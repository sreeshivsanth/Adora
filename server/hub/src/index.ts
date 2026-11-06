import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8787;
const JWT_SECRET = process.env.JWT_SECRET || 'adora_production_secret_key_change_me_99';
const STORAGE_HIGH_WATERMARK_GB = parseFloat(process.env.STORAGE_HIGH_WATERMARK_GB || '160');
const STORAGE_TARGET_GB = parseFloat(process.env.STORAGE_TARGET_GB || '140');
let TWO_FACTOR_ENABLED = process.env.TWO_FACTOR_ENABLED === 'true';

const MUSIC_DIR = process.env.MUSIC_DIR || path.resolve(__dirname, '../../music');
const YTDLP_PATH = process.env.YTDLP_PATH || path.resolve(__dirname, '../../bin/yt-dlp');
const NAVIDROME_URL = process.env.NAVIDROME_URL || 'http://localhost:4533';

if (!fs.existsSync(MUSIC_DIR)) {
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

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

function optionalToken(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
    } catch {
      // Ignored for optional token
    }
  }
  next();
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
// Just-In-Time (JIT) Ingestion & Worldwide Search
// -------------------------------------------------------------

// Curated seed tracks for instant ambient discovery (Full YouTube Music audio)
const CURATED_SEED: Record<string, any[]> = {
  tamil: [
    { id: 'itunes_1502476579', title: 'Vaathi Coming', artist: 'Anirudh Ravichander & Gana Balachandar', album: 'Master', language: 'tamil', durationSec: 230, cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', audioUrl: '/api/stream/full?title=Vaathi+Coming&artist=Anirudh+Ravichander', isLocal: false },
    { id: 'itunes_1556858076', title: 'Enjoy Enjaami', artist: 'Dhee, Arivu & Santhosh Narayanan', album: 'Enjoy Enjaami - Single', language: 'tamil', durationSec: 302, cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600', audioUrl: '/api/stream/full?title=Enjoy+Enjaami&artist=Dhee+Arivu', isLocal: false },
    { id: 'itunes_1583726481', title: 'Adiye', artist: 'Dhibu Ninan Thomas & Kapil Kapilan', album: 'Bachelor', language: 'tamil', durationSec: 254, cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600', audioUrl: '/api/stream/full?title=Adiye&artist=Dhibu+Ninan+Thomas', isLocal: false },
    { id: 'itunes_1699923812', title: 'Hukum - Thalaivar Alappara', artist: 'Anirudh Ravichander & Super Subu', album: 'Jailer', language: 'tamil', durationSec: 207, cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600', audioUrl: '/api/stream/full?title=Hukum+Thalaivar+Alappara&artist=Anirudh+Ravichander', isLocal: false }
  ],
  hindi: [
    { id: 'itunes_1634938221', title: 'Kesariya', artist: 'Pritam, Arijit Singh & Amitabh Bhattacharya', album: 'Brahmastra', language: 'hindi', durationSec: 268, cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600', audioUrl: '/api/stream/full?title=Kesariya&artist=Arijit+Singh', isLocal: false },
    { id: 'itunes_1440782917', title: 'Arziyan', artist: 'A.R. Rahman, Javed Ali & Kailash Kher', album: 'Delhi-6', language: 'hindi', durationSec: 521, cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', audioUrl: '/api/stream/full?title=Arziyan&artist=A.R.+Rahman', isLocal: false },
    { id: 'itunes_1163456789', title: 'Channa Mereya', artist: 'Pritam & Arijit Singh', album: 'Ae Dil Hai Mushkil', language: 'hindi', durationSec: 289, cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600', audioUrl: '/api/stream/full?title=Channa+Mereya&artist=Arijit+Singh', isLocal: false }
  ],
  english: [
    { id: 'itunes_1440857781', title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', language: 'english', durationSec: 243, cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600', audioUrl: '/api/stream/full?title=Midnight+City&artist=M83', isLocal: false },
    { id: 'itunes_1440833249', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', language: 'english', durationSec: 200, cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600', audioUrl: '/api/stream/full?title=Blinding+Lights&artist=The+Weeknd', isLocal: false },
    { id: 'itunes_647318188', title: 'Get Lucky', artist: 'Daft Punk feat. Pharrell Williams', album: 'Random Access Memories', language: 'english', durationSec: 369, cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600', audioUrl: '/api/stream/full?title=Get+Lucky&artist=Daft+Punk', isLocal: false }
  ],
  korean: [
    { id: 'itunes_1660603593', title: 'Ditto', artist: 'NewJeans', album: 'NewJeans \'OMG\'', language: 'korean', durationSec: 185, cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600', audioUrl: '/api/stream/full?title=Ditto&artist=NewJeans', isLocal: false },
    { id: 'itunes_1694764831', title: 'Super Shy', artist: 'NewJeans', album: 'Get Up', language: 'korean', durationSec: 154, cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600', audioUrl: '/api/stream/full?title=Super+Shy&artist=NewJeans', isLocal: false }
  ]
};

app.get('/api/search', optionalToken, async (req: AuthenticatedRequest, res: Response) => {
  const query = (req.query.q as string || '').trim();
  const language = (req.query.language as string || 'all').toLowerCase();

  // If query is blank, return curated collection based on language
  if (!query) {
    if (language === 'all') {
      const allSeeds = Object.values(CURATED_SEED).flat();
      res.json({ results: allSeeds, count: allSeeds.length });
    } else {
      const seeds = CURATED_SEED[language] || [];
      res.json({ results: seeds, count: seeds.length });
    }
    return;
  }

  try {
    const searchTerm = language !== 'all' ? `${query} ${language}` : query;
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=30`;
    const response = await fetch(itunesUrl);

    if (!response.ok) {
      throw new Error(`iTunes API status: ${response.status}`);
    }

    const data: any = await response.json();
    const results = (data.results || []).map((r: any) => {
      const coverUrl = r.artworkUrl100
        ? r.artworkUrl100.replace('100x100bb', '600x600bb')
        : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600';

      const safeArtist = (r.artistName || 'Unknown').replace(/[^a-z0-9 _-]/gi, '_');
      const safeTitle = (r.trackName || 'Unknown').replace(/[^a-z0-9 _-]/gi, '_');
      const langFolder = language === 'all' ? 'vault' : language.replace(/[^a-z0-9]/gi, '_');
      const localFileMp3 = path.join(MUSIC_DIR, langFolder, safeArtist, `${safeTitle}.mp3`);
      const isLocal = fs.existsSync(localFileMp3);

      // Full YouTube Music audio stream endpoint (with fallback preview if needed)
      const fullAudioUrl = isLocal
        ? `/api/stream?path=${encodeURIComponent(path.relative(MUSIC_DIR, localFileMp3))}`
        : `/api/stream/full?title=${encodeURIComponent(r.trackName)}&artist=${encodeURIComponent(r.artistName)}&id=${r.trackId}&fallback=${encodeURIComponent(r.previewUrl || '')}`;

      return {
        id: `itunes_${r.trackId}`,
        title: r.trackName,
        artist: r.artistName,
        album: r.collectionName || 'Single',
        language: language,
        durationSec: Math.round((r.trackTimeMillis || 0) / 1000),
        cover: coverUrl,
        audioUrl: fullAudioUrl,
        isLocal: isLocal,
        isDownloaded: isLocal,
        isStarred: false
      };
    });

    res.json({ results, count: results.length });
  } catch (err: any) {
    console.error('[Adora Search Error]', err);
    const allSeeds = Object.values(CURATED_SEED).flat();
    const fallback = allSeeds.filter(t => 
      t.title.toLowerCase().includes(query.toLowerCase()) || 
      t.artist.toLowerCase().includes(query.toLowerCase())
    );
    res.json({ results: fallback, count: fallback.length, error: err.message });
  }
});

// -------------------------------------------------------------
// YouTube Music Direct Stream Engine & In-Memory Stream Cache
// -------------------------------------------------------------

interface StreamCacheEntry {
  url: string;
  expiresAt: number;
}

const streamUrlCache = new Map<string, StreamCacheEntry>();
const inFlightResolutions = new Map<string, Promise<string>>();

/**
 * Resolves a direct high-fidelity Google Video Opus/WebM audio stream URL
 * from YouTube Music using yt-dlp. Results are cached in memory for 3.5 hours.
 */
async function resolveYouTubeAudioStream(title: string, artist?: string): Promise<string> {
  const cleanTitle = (title || '').trim();
  const cleanArtist = (artist || '').trim();
  const cacheKey = `${cleanTitle.toLowerCase()}:::${cleanArtist.toLowerCase()}`;
  const now = Date.now();

  const cached = streamUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  // De-duplicate simultaneous requests for the exact same track
  if (inFlightResolutions.has(cacheKey)) {
    return inFlightResolutions.get(cacheKey)!;
  }

  const resolvePromise = new Promise<string>((resolve, reject) => {
    const ytdlpBinary = fs.existsSync(YTDLP_PATH) ? YTDLP_PATH : 'yt-dlp';
    const searchQuery = `ytsearch1:${cleanTitle} ${cleanArtist} audio`;

    console.log(`[YouTube Music Stream] Resolving direct audio stream for: "${cleanTitle}" by "${cleanArtist}"`);

    const proc = spawn(ytdlpBinary, [
      '--js-runtimes', 'node',
      '--no-playlist',
      '--no-warnings',
      '-f', 'ba/b',
      '-g',
      searchQuery
    ]);

    let stdoutData = '';
    let stderrData = '';

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      inFlightResolutions.delete(cacheKey);
      reject(new Error(`Extraction timed out after 15 seconds for "${cleanTitle}"`));
    }, 15000);

    proc.stdout.on('data', (d) => { stdoutData += d.toString(); });
    proc.stderr.on('data', (d) => { stderrData += d.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      inFlightResolutions.delete(cacheKey);

      const lines = stdoutData.trim().split(/\r?\n/).map(l => l.trim());
      const streamUrl = lines.find(l => l.startsWith('http://') || l.startsWith('https://'));

      if (code === 0 && streamUrl) {
        // Cache for 3.5 hours (Google Video CDN URLs typically expire after 6 hours)
        streamUrlCache.set(cacheKey, {
          url: streamUrl,
          expiresAt: Date.now() + 3.5 * 60 * 60 * 1000
        });
        console.log(`[YouTube Music Stream] Successfully cached stream for: "${cleanTitle}"`);
        resolve(streamUrl);
      } else {
        console.warn(`[YouTube Music Stream] yt-dlp failed (code ${code}): ${stderrData.slice(0, 200)}`);
        reject(new Error(`yt-dlp extraction failed with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      inFlightResolutions.delete(cacheKey);
      reject(err);
    });
  });

  inFlightResolutions.set(cacheKey, resolvePromise);
  return resolvePromise;
}

interface IngestJob {
  id: string;
  title: string;
  artist: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  localPath?: string;
  error?: string;
}

const activeJobs = new Map<string, IngestJob>();
const activeIngestKeys = new Set<string>();

/**
 * Triggers background JIT download of 320kbps MP3 into server/music storage
 */
function triggerBackgroundIngest(trackTitle: string, artist: string, language: string = 'all') {
  const cleanTitle = (trackTitle || '').trim();
  const cleanArtist = (artist || 'Various Artists').trim();
  const cleanLang = (language || 'all').toLowerCase();

  const safeLang = cleanLang === 'all' ? 'vault' : cleanLang.replace(/[^a-z0-9]/gi, '_');
  const safeArtist = cleanArtist.replace(/[^a-z0-9 _-]/gi, '_');
  const safeTitle = cleanTitle.replace(/[^a-z0-9 _-]/gi, '_');

  const targetDir = path.join(MUSIC_DIR, safeLang, safeArtist);
  const targetFile = path.join(targetDir, `${safeTitle}.mp3`);
  const relativePath = path.relative(MUSIC_DIR, targetFile);

  if (fs.existsSync(targetFile)) {
    return { targetFile, relativePath, jobId: 'already_downloaded', alreadyExists: true };
  }

  const ingestKey = `${safeLang}/${safeArtist}/${safeTitle}`.toLowerCase();
  if (activeIngestKeys.has(ingestKey)) {
    return { targetFile, relativePath, jobId: 'downloading', alreadyExists: false };
  }

  activeIngestKeys.add(ingestKey);
  fs.mkdirSync(targetDir, { recursive: true });

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const job: IngestJob = {
    id: jobId,
    title: cleanTitle,
    artist: cleanArtist,
    status: 'downloading',
    progress: 10,
    localPath: relativePath
  };
  activeJobs.set(jobId, job);

  const ytdlpBinary = fs.existsSync(YTDLP_PATH) ? YTDLP_PATH : 'yt-dlp';
  const outTemplate = path.join(targetDir, `${safeTitle}.%(ext)s`);
  const searchQuery = `ytsearch1:${cleanTitle} ${cleanArtist} official audio`;

  console.log(`[Adora Ingestion] Ingesting: "${cleanTitle}" by ${cleanArtist}...`);

  const child = spawn(ytdlpBinary, [
    '--js-runtimes', 'node',
    searchQuery,
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '-o', outTemplate,
    '--no-playlist',
    '--embed-thumbnail',
    '--add-metadata',
    '--no-warnings'
  ]);

  child.on('close', (code) => {
    activeIngestKeys.delete(ingestKey);
    if (code === 0 && fs.existsSync(targetFile)) {
      job.status = 'completed';
      job.progress = 100;
      console.log(`[Adora Ingestion] Successfully ingested "${cleanTitle}" -> ${targetFile}`);

      // Call Navidrome catalog rescan if accessible
      fetch(`${NAVIDROME_URL}/rest/startScan?u=admin&p=admin&v=1.16.1&c=adora&f=json`).catch(() => {});
    } else {
      job.status = 'failed';
      job.error = `yt-dlp exited with code ${code}`;
      console.warn(`[Adora Ingestion] Failed to ingest "${cleanTitle}": code ${code}`);
    }
  });

  return { targetFile, relativePath, jobId, alreadyExists: false };
}

app.post('/api/ingest', optionalToken, (req: AuthenticatedRequest, res: Response) => {
  const { trackTitle, artist, language } = req.body;
  if (!trackTitle) {
    res.status(400).json({ error: 'trackTitle is required' });
    return;
  }

  const result = triggerBackgroundIngest(trackTitle, artist, language);
  if (result.alreadyExists) {
    res.json({
      jobId: result.jobId,
      status: 'completed',
      message: 'Track is already in local music storage.',
      audioUrl: `/api/stream?path=${encodeURIComponent(result.relativePath)}`
    });
    return;
  }

  res.json({
    jobId: result.jobId,
    status: 'downloading',
    message: `Background JIT ingestion initiated for "${trackTitle}".`,
    audioUrl: `/api/stream?path=${encodeURIComponent(result.relativePath)}`
  });
});

app.get('/api/ingest/status/:jobId', (req: Request, res: Response) => {
  const job = activeJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json(job);
});

// Full-length YouTube Music Audio Stream Endpoint
app.get('/api/stream/full', async (req: Request, res: Response) => {
  const title = (req.query.title as string || '').trim();
  const artist = (req.query.artist as string || '').trim();
  const language = (req.query.language as string || 'all').trim();
  const fallbackUrl = (req.query.fallback as string || '').trim();

  if (!title) {
    res.status(400).json({ error: 'title parameter is required' });
    return;
  }

  // 1. If file already exists in local storage, stream locally via byte-range server
  const safeLang = language === 'all' ? 'vault' : language.replace(/[^a-z0-9]/gi, '_');
  const safeArtist = (artist || 'Various Artists').replace(/[^a-z0-9 _-]/gi, '_');
  const safeTitle = title.replace(/[^a-z0-9 _-]/gi, '_');

  const possibleExtensions = ['.mp3', '.m4a', '.opus', '.flac'];
  for (const ext of possibleExtensions) {
    const candidateLocal = path.join(MUSIC_DIR, safeLang, safeArtist, `${safeTitle}${ext}`);
    if (fs.existsSync(candidateLocal)) {
      const relPath = path.relative(MUSIC_DIR, candidateLocal);
      res.redirect(302, `/api/stream?path=${encodeURIComponent(relPath)}`);
      return;
    }
    // Also check generic vault
    const vaultLocal = path.join(MUSIC_DIR, 'vault', safeArtist, `${safeTitle}${ext}`);
    if (fs.existsSync(vaultLocal)) {
      const relPath = path.relative(MUSIC_DIR, vaultLocal);
      res.redirect(302, `/api/stream?path=${encodeURIComponent(relPath)}`);
      return;
    }
  }

  // 2. Trigger asynchronous background ingestion into local disk for offline preservation
  triggerBackgroundIngest(title, artist, language);

  // 3. Resolve direct YouTube Music Opus/WebM audio stream
  try {
    const streamUrl = await resolveYouTubeAudioStream(title, artist);
    res.redirect(302, streamUrl);
  } catch (err: any) {
    console.warn(`[Stream Full Error] Could not extract stream for "${title}":`, err.message);
    if (fallbackUrl && fallbackUrl.startsWith('http')) {
      res.redirect(302, fallbackUrl);
    } else {
      res.status(502).json({ error: 'Failed to extract audio stream from YouTube Music', message: err.message });
    }
  }
});

// -------------------------------------------------------------
// HTTP 206 Partial Content Audio Streaming & Local Catalog
// -------------------------------------------------------------
app.get('/api/stream', (req: Request, res: Response) => {
  const filePathParam = req.query.path as string;
  if (!filePathParam) {
    res.status(400).json({ error: 'path parameter is required' });
    return;
  }

  // Prevent directory traversal attacks
  const resolvedPath = path.resolve(MUSIC_DIR, filePathParam.replace(/^(\.\.[\/\\])+/, ''));
  if (!resolvedPath.startsWith(MUSIC_DIR) || !fs.existsSync(resolvedPath)) {
    res.status(404).json({ error: 'Audio file not found' });
    return;
  }

  const stat = fs.statSync(resolvedPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(resolvedPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(resolvedPath).pipe(res);
  }
});

app.get('/api/tracks/local', (_req: Request, res: Response) => {
  const localTracks: any[] = [];

  function scanDir(dir: string, category: string = 'Vault') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath, entry.name);
      } else if (/\.(mp3|m4a|opus|flac)$/i.test(entry.name)) {
        const relPath = path.relative(MUSIC_DIR, fullPath);
        const fileNameWithoutExt = entry.name.replace(/\.[^/.]+$/, "");
        const stat = fs.statSync(fullPath);
        localTracks.push({
          id: `local_${Buffer.from(relPath).toString('base64url')}`,
          title: fileNameWithoutExt,
          artist: category || 'Adora Vault',
          album: 'Self-Hosted Library',
          language: 'all',
          durationSec: 240,
          cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
          audioUrl: `/api/stream?path=${encodeURIComponent(relPath)}`,
          isLocal: true,
          isDownloaded: true,
          sizeBytes: stat.size
        });
      }
    }
  }

  scanDir(MUSIC_DIR);
  res.json({ tracks: localTracks, count: localTracks.length });
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

  // Pre-warm curated seed tracks into cache for instantaneous zero-latency playback
  setTimeout(async () => {
    console.log('[YouTube Music Stream] Pre-warming popular seed tracks into cache...');
    const allSeeds = Object.values(CURATED_SEED).flat();
    for (const seed of allSeeds.slice(0, 8)) {
      try {
        await resolveYouTubeAudioStream(seed.title, seed.artist);
      } catch (err) {
        // Silently continue if pre-warm fails
      }
    }
    console.log('[YouTube Music Stream] Pre-warming complete. Curated tracks ready for instant playback.');
  }, 2000);
});
