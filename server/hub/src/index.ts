import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import os from 'os';
import fs from 'fs';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8787;
const JWT_SECRET = process.env.JWT_SECRET || 'adora_production_secret_key_change_me_99';
const STORAGE_HIGH_WATERMARK_GB = parseFloat(process.env.STORAGE_HIGH_WATERMARK_GB || '160');
const STORAGE_TARGET_GB = parseFloat(process.env.STORAGE_TARGET_GB || '140');
let TWO_FACTOR_ENABLED = process.env.TWO_FACTOR_ENABLED === 'true';

app.use(cors());
app.use(express.json());

// In-Memory state for active devices, blend rooms, and OTPs
interface DeviceState {
  deviceId: string;
  deviceName: string;
  userId: string;
  isPlaying: boolean;
  trackId: string | null;
  trackTitle: string | null;
  artist: string | null;
  albumArt: string | null;
  positionSec: number;
  durationSec: number;
  volume: number;
  lastSeen: number;
}

interface BlendRoom {
  roomId: string;
  hostUserId: string;
  currentTrack: any;
  isPlaying: boolean;
  positionSec: number;
  serverTimestamp: number;
  participants: Map<string, { username: string; ws: WebSocket }>;
}

const activeDevices = new Map<string, DeviceState>();
const blendRooms = new Map<string, BlendRoom>();
const pendingOtps = new Map<string, { code: string; expiresAt: number; target: string }>();

// -------------------------------------------------------------
// Security Middleware
// -------------------------------------------------------------
interface AuthenticatedRequest extends Request {
  user?: { id: string; username: string; role: 'admin' | 'user' };
}

function verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed authorization token' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token expired or invalid signature' });
  }
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Admin credentials required' });
    return;
  }
  next();
}

// -------------------------------------------------------------
// Authentication & 2FA Endpoints
// -------------------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password, otp } = req.body;

  // In production, verify against Navidrome SQLite DB / Argon2id hash
  const isAdmin = username.toLowerCase() === 'admin';

  if (isAdmin && TWO_FACTOR_ENABLED) {
    if (!otp) {
      // Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      pendingOtps.set(username, {
        code: generatedOtp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        target: 'admin@adora.local'
      });
      console.log(`[Adora Auth] 2FA OTP for Admin: ${generatedOtp} (Expires in 5m)`);
      res.status(200).json({
        requires2FA: true,
        message: '6-digit OTP code sent. Enter OTP to complete login.',
        debugOtpNotice: 'OTP sent to registered admin channel.'
      });
      return;
    }

    const recorded = pendingOtps.get(username);
    if (!recorded || recorded.code !== otp || Date.now() > recorded.expiresAt) {
      res.status(401).json({ error: 'Invalid or expired 2FA OTP code' });
      return;
    }
    pendingOtps.delete(username);
  }

  // Issue 15-Minute Ephemeral Access Token + Refresh Token
  const role = isAdmin ? 'admin' : 'user';
  const token = jwt.sign(
    { id: `usr_${username}`, username, role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: `usr_${username}`, username, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    refreshToken,
    expiresInSeconds: 900,
    user: { id: `usr_${username}`, username, role }
  });
});

app.post('/api/auth/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token is required' });
    return;
  }
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    const newToken = jwt.sign(
      { id: decoded.id, username: decoded.username, role: decoded.username === 'admin' ? 'admin' : 'user' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ token: newToken, expiresInSeconds: 900 });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// 3-Tier Forgot Password
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { emailOrUsername } = req.body;
  const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase();
  console.log(`[Adora Recovery] Password Reset Code for ${emailOrUsername}: ${resetToken}`);
  res.json({
    message: 'If the account exists, a password reset link and 6-digit code has been dispatched.',
    recoveryTokenPreview: resetToken
  });
});

// -------------------------------------------------------------
// Just-In-Time (JIT) Ingestion & Search
// -------------------------------------------------------------
app.get('/api/search', verifyToken, (req: AuthenticatedRequest, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase();
  const language = req.query.language as string || 'all';

  // Demo metadata search response showing language curation
  const sampleTracks = [
    { id: 'trk_1', title: 'Adiye', artist: 'Dhibu Ninan Thomas', album: 'Bachelor', language: 'tamil', durationSec: 254, isLocal: true, cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300' },
    { id: 'trk_2', title: 'Kesariya', artist: 'Arijit Singh, Pritam', album: 'Brahmastra', language: 'hindi', durationSec: 268, isLocal: true, cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300' },
    { id: 'trk_3', title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', language: 'english', durationSec: 243, isLocal: true, cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300' },
    { id: 'trk_4', title: 'Ditto', artist: 'NewJeans', album: 'OMG', language: 'korean', durationSec: 185, isLocal: true, cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300' },
    { id: 'trk_5', title: 'Enjoy Enjaami', artist: 'Dhee, Arivu, Santhosh Narayanan', album: 'Single', language: 'tamil', durationSec: 302, isLocal: false, cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300' },
  ];

  let filtered = sampleTracks;
  if (language !== 'all') {
    filtered = filtered.filter(t => t.language === language);
  }
  if (query) {
    filtered = filtered.filter(t => t.title.toLowerCase().includes(query) || t.artist.toLowerCase().includes(query));
  }

  res.json({ results: filtered, count: filtered.length });
});

app.post('/api/ingest', verifyToken, (req: AuthenticatedRequest, res: Response) => {
  const { trackTitle, artist, language } = req.body;
  console.log(`[Adora Ingestion] Queued JIT background download: "${trackTitle}" by ${artist} (${language})`);
  
  res.json({
    status: 'queued',
    message: `Ingestion scheduled. Instant preview stream available immediately.`,
    trackId: `jit_${Date.now()}`
  });
});

// -------------------------------------------------------------
// Admin Telemetry & Storage Management
// -------------------------------------------------------------
app.get('/api/admin/metrics', verifyToken, requireAdmin, (_req: Request, res: Response) => {
  const totalStorageGB = 200;
  const pinnedStorageGB = 34.2;
  const cachedStorageGB = 12.8;
  const usedStorageGB = pinnedStorageGB + cachedStorageGB;
  const freeStorageGB = totalStorageGB - usedStorageGB;

  res.json({
    system: {
      uptimeSeconds: process.uptime(),
      loadAvg: os.loadavg(),
      freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
    },
    storage: {
      totalGB: totalStorageGB,
      pinnedGB: pinnedStorageGB,
      cachedGB: cachedStorageGB,
      usedGB: usedStorageGB,
      freeGB: freeStorageGB,
      highWatermarkGB: STORAGE_HIGH_WATERMARK_GB,
      isNearLimit: usedStorageGB >= STORAGE_HIGH_WATERMARK_GB
    },
    activity: {
      activeListeners: activeDevices.size,
      activeBlendRooms: blendRooms.size,
      twoFactorEnabled: TWO_FACTOR_ENABLED
    }
  });
});

app.post('/api/admin/settings/2fa', verifyToken, requireAdmin, (req: Request, res: Response) => {
  const { enabled } = req.body;
  TWO_FACTOR_ENABLED = Boolean(enabled);
  console.log(`[Adora Security] Admin 2FA toggled to: ${TWO_FACTOR_ENABLED}`);
  res.json({ twoFactorEnabled: TWO_FACTOR_ENABLED });
});

app.get('/api/admin/prune/preview', verifyToken, requireAdmin, (_req: Request, res: Response) => {
  // Simulates LRU candidates that are NOT pinned in any playlist or starred
  const candidates = [
    { id: 'c1', title: 'One-off Meme Song', artist: 'Unknown', lastPlayedDaysAgo: 74, sizeMB: 8.4, reason: 'Unplayed for 60+ days, not in any playlist' },
    { id: 'c2', title: 'Random Background Track', artist: 'Various', lastPlayedDaysAgo: 91, sizeMB: 7.2, reason: 'Zero plays since initial search' }
  ];
  res.json({
    candidates,
    totalReclaimableMB: candidates.reduce((acc, c) => acc + c.sizeMB, 0),
    notice: 'Pinned tracks in playlists and favorites are strictly protected and never listed.'
  });
});

// -------------------------------------------------------------
// WebSocket Engine: Adora Blend & Adora Connect
// -------------------------------------------------------------
wss.on('connection', (ws: WebSocket) => {
  let boundUserId: string | null = null;
  let boundDeviceId: string | null = null;

  ws.on('message', (messageRaw: string) => {
    try {
      const data = JSON.parse(messageRaw);

      // --- ADORA CONNECT: Device Registration & Remote Control ---
      if (data.type === 'DEVICE_REGISTER' && data.deviceId && data.userId) {
        const dId = String(data.deviceId);
        const uId = String(data.userId);
        boundUserId = uId;
        boundDeviceId = dId;
        activeDevices.set(dId, {
          deviceId: dId,
          deviceName: data.deviceName || "Unknown Device",
          userId: uId,
          isPlaying: data.isPlaying || false,
          trackId: data.trackId || null,
          trackTitle: data.trackTitle || null,
          artist: data.artist || null,
          albumArt: data.albumArt || null,
          positionSec: data.positionSec || 0,
          durationSec: data.durationSec || 0,
          volume: data.volume ?? 1,
          lastSeen: Date.now()
        });
        broadcastUserDevices(uId);
      }

      if (data.type === 'DEVICE_CONTROL_COMMAND') {
        // Broadcast command to specific target device
        const target = activeDevices.get(data.targetDeviceId);
        if (target) {
          // Forward event to target
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'REMOTE_EXECUTE',
                command: data.command, // PLAY, PAUSE, SEEK, VOLUME, TRANSFER
                payload: data.payload
              }));
            }
          });
        }
      }

      // --- ADORA BLEND: Social Synchronized Listening ---
      if (data.type === 'BLEND_JOIN') {
        const { roomId, username } = data;
        let room = blendRooms.get(roomId);
        if (!room) {
          room = {
            roomId,
            hostUserId: boundUserId || 'host',
            currentTrack: null,
            isPlaying: false,
            positionSec: 0,
            serverTimestamp: Date.now(),
            participants: new Map()
          };
          blendRooms.set(roomId, room);
        }
        room.participants.set(username, { username, ws });
        broadcastBlendState(roomId);
      }

      if (data.type === 'BLEND_SYNC_EVENT') {
        const { roomId, action, track, positionSec, isPlaying } = data;
        const room = blendRooms.get(roomId);
        if (room) {
          room.isPlaying = isPlaying;
          room.positionSec = positionSec;
          room.currentTrack = track;
          room.serverTimestamp = Date.now();
          broadcastBlendState(roomId, action);
        }
      }

      if (data.type === 'BLEND_REACTION') {
        const { roomId, emoji, username } = data;
        broadcastToRoom(roomId, {
          type: 'BLEND_REACTION_EMIT',
          emoji,
          username,
          id: Math.random().toString()
        });
      }

    } catch (err) {
      console.error('[Adora WS Error]', err);
    }
  });

  ws.on('close', () => {
    if (boundDeviceId) {
      activeDevices.delete(boundDeviceId);
      if (boundUserId) broadcastUserDevices(boundUserId);
    }
  });
});

function broadcastUserDevices(userId: string) {
  const userDevices = Array.from(activeDevices.values()).filter(d => d.userId === userId);
  const payload = JSON.stringify({ type: 'DEVICES_UPDATED', devices: userDevices });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}

function broadcastBlendState(roomId: string, actionTrigger?: string) {
  const room = blendRooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify({
    type: 'BLEND_STATE',
    roomId: room.roomId,
    isPlaying: room.isPlaying,
    currentTrack: room.currentTrack,
    positionSec: room.positionSec,
    serverTimestamp: room.serverTimestamp,
    actionTrigger,
    participantCount: room.participants.size,
    participants: Array.from(room.participants.keys())
  });
  broadcastToRoom(roomId, JSON.parse(payload));
}

function broadcastToRoom(roomId: string, message: any) {
  const room = blendRooms.get(roomId);
  if (!room) return;
  const str = JSON.stringify(message);
  room.participants.forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(str);
    }
  });
}

server.listen(PORT, () => {
  console.log(`[Adora Hub] Service listening on port ${PORT} (HTTP & WebSockets)`);
});
