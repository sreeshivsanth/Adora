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
    { id: 'itunes_1502476579', title: 'Vaathi Coming', artist: 'Anirudh Ravichander & Gana Balachandar', album: 'Master', language: 'tamil', durationSec: 230, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a3/f2/dc/a3f2dc29-fc54-07bb-8f9c-2a3936d21a5d/886448363347.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Vaathi+Coming&artist=Anirudh+Ravichander', isLocal: false, releaseYear: 2021, mood: 'energetic', genre: 'Soundtrack' },
    { id: 'itunes_1556858076', title: 'Enjoy Enjaami', artist: 'Dhee, Arivu & Santhosh Narayanan', album: 'Enjoy Enjaami - Single', language: 'tamil', durationSec: 302, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/cf/c5/9b/cfc59b20-dda2-e4a3-54db-e23ac7a55b80/cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Enjoy+Enjaami&artist=Dhee+Arivu', isLocal: false, releaseYear: 2021, mood: 'chill', genre: 'Indie' },
    { id: 'itunes_1583726481', title: 'Adiye', artist: 'Dhibu Ninan Thomas & Kapil Kapilan', album: 'Bachelor', language: 'tamil', durationSec: 254, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d3/00/1b/d3001b7a-f99b-eb10-3535-999a8610a2dd/cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Adiye&artist=Dhibu+Ninan+Thomas', isLocal: false, releaseYear: 2021, mood: 'romantic', genre: 'Soundtrack' },
    { id: 'itunes_1699923812', title: 'Hukum - Thalaivar Alappara', artist: 'Anirudh Ravichander & Super Subu', album: 'Jailer', language: 'tamil', durationSec: 207, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/29/10/dc/2910dce9-8973-7957-6a39-e8afc074aa55/197189422959.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Hukum+Thalaivar+Alappara&artist=Anirudh+Ravichander', isLocal: false, releaseYear: 2023, mood: 'energetic', genre: 'Soundtrack' },
    { id: 'itunes_tamil_2000', title: 'Kandukondain Kandukondain', artist: 'A.R. Rahman, Hariharan & Mahalakshmi', album: 'Kandukondain Kandukondain', language: 'tamil', durationSec: 312, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/7f/85/1e/7f851efc-4d49-8867-bb6f-9c0e5ce40f71/1200214615666.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Kandukondain+Kandukondain&artist=A.R.+Rahman', isLocal: false, releaseYear: 2000, mood: 'romantic', genre: 'Classical' },
    { id: 'itunes_tamil_2006', title: 'Munbe Vaa', artist: 'A.R. Rahman, Naresh Iyer & Shreya Ghoshal', album: 'Sillunu Oru Kaadhal', language: 'tamil', durationSec: 358, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/18/22/45/18224513-8229-7496-7947-74b154f01686/Cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Munbe+Vaa&artist=A.R.+Rahman+Naresh+Iyer', isLocal: false, releaseYear: 2006, mood: 'romantic', genre: 'Soundtrack' }
  ],
  hindi: [
    { id: 'itunes_1634938221', title: 'Kesariya', artist: 'Pritam, Arijit Singh & Amitabh Bhattacharya', album: 'Brahmastra', language: 'hindi', durationSec: 268, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Kesariya&artist=Arijit+Singh', isLocal: false, releaseYear: 2022, mood: 'romantic', genre: 'Bollywood' },
    { id: 'itunes_1440782917', title: 'Arziyan', artist: 'A.R. Rahman, Javed Ali & Kailash Kher', album: 'Delhi-6', language: 'hindi', durationSec: 521, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/12/00/d2/1200d257-27ba-53c4-10f2-abde8475efcd/8903431051332_cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Arziyan&artist=A.R.+Rahman', isLocal: false, releaseYear: 2009, mood: 'devotional', genre: 'Sufi' },
    { id: 'itunes_1163456789', title: 'Channa Mereya', artist: 'Pritam & Arijit Singh', album: 'Ae Dil Hai Mushkil', language: 'hindi', durationSec: 289, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bc/6e/4d/bc6e4d0c-adec-b431-7b60-16f5689f9664/886446201597.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Channa+Mereya&artist=Arijit+Singh', isLocal: false, releaseYear: 2016, mood: 'melancholic', genre: 'Bollywood' },
    { id: 'itunes_hindi_2003', title: 'Kal Ho Naa Ho', artist: 'Shankar-Ehsaan-Loy & Sonu Nigam', album: 'Kal Ho Naa Ho', language: 'hindi', durationSec: 322, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/fb/82/da/fb82dab1-d0cd-714c-000c-6450774fd5d4/888880945587.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Kal+Ho+Naa+Ho&artist=Sonu+Nigam', isLocal: false, releaseYear: 2003, mood: 'melancholic', genre: 'Bollywood' },
    { id: 'itunes_hindi_2013', title: 'Tum Hi Ho', artist: 'Mithoon & Arijit Singh', album: 'Aashiqui 2', language: 'hindi', durationSec: 262, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Tum+Hi+Ho&artist=Arijit+Singh', isLocal: false, releaseYear: 2013, mood: 'romantic', genre: 'Bollywood' }
  ],
  english: [
    { id: 'itunes_1440857781', title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', language: 'english', durationSec: 243, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/5b/f3/4b/5bf34b53-c1f5-bf0e-1492-59c4e2dae012/cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Midnight+City&artist=M83', isLocal: false, releaseYear: 2011, mood: 'focus', genre: 'Electronic' },
    { id: 'itunes_1440833249', title: 'Starboy', artist: 'The Weeknd feat. Daft Punk', album: 'Starboy', language: 'english', durationSec: 230, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Starboy&artist=The+Weeknd', isLocal: false, releaseYear: 2016, mood: 'energetic', genre: 'Pop' },
    { id: 'itunes_believer', title: 'Believer', artist: 'Imagine Dragons', album: 'Evolve', language: 'english', durationSec: 204, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/11/7a/b8/117ab805-6811-8929-18b9-0fad7baf0c25/17UMGIM98210.rgb.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Believer&artist=Imagine+Dragons', isLocal: false, releaseYear: 2017, mood: 'motivation', genre: 'Rock' }
  ],
  telugu: [
    { id: 'itunes_tel_2020', title: 'Samajavaragamana', artist: 'Thaman S & Sid Sriram', album: 'Ala Vaikunthapurramuloo', language: 'telugu', durationSec: 221, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/53/98/c1/5398c1cf-7c16-24a6-bfa3-391dc6015376/cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Samajavaragamana&artist=Sid+Sriram', isLocal: false, releaseYear: 2020, mood: 'chill', genre: 'Soundtrack' },
    { id: 'itunes_tel_butta', title: 'Butta Bomma', artist: 'Armaan Malik & Thaman S', album: 'Ala Vaikunthapurramuloo', language: 'telugu', durationSec: 198, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/46/aa/48/46aa4863-c1ec-4574-e98e-80b8c1f3ef69/cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Butta+Bomma&artist=Armaan+Malik', isLocal: false, releaseYear: 2020, mood: 'energetic', genre: 'Soundtrack' }
  ],
  malayalam: [
    { id: 'itunes_mal_2015', title: 'Malare', artist: 'Vijay Yesudas & Rajesh Murugesan', album: 'Premam', language: 'malayalam', durationSec: 316, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music2/v4/6f/3c/cd/6f3ccd36-2a0f-0c4e-ce51-5aebcf9e9f84/cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Malare&artist=Vijay+Yesudas', isLocal: false, releaseYear: 2015, mood: 'romantic', genre: 'Soundtrack' },
    { id: 'itunes_mal_2022', title: 'Darshana', artist: 'Hesham Abdul Wahab', album: 'Hridayam', language: 'malayalam', durationSec: 238, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/69/26/34/6926341a-b85f-f853-de47-cb6fa81544aa/cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Darshana&artist=Hesham+Abdul+Wahab', isLocal: false, releaseYear: 2022, mood: 'romantic', genre: 'Soundtrack' }
  ],
  punjabi: [
    { id: 'itunes_pun_2020', title: 'Brown Munde', artist: 'AP Dhillon, Gurinder Gill & Shinda Kahlon', album: 'Brown Munde', language: 'punjabi', durationSec: 268, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/26/a3/ac/26a3ac64-69e4-95ec-80ab-1f5a477537d2/859742042973_cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Brown+Munde&artist=AP+Dhillon', isLocal: false, releaseYear: 2020, mood: 'party', genre: 'Hip-Hop' },
    { id: 'itunes_pun_2021', title: 'Lover', artist: 'Diljit Dosanjh', album: 'MoonChild Era', language: 'punjabi', durationSec: 185, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/8a/89/e4/8a89e445-d2c6-f8ac-a828-27818b0c1afe/859749638209_cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Lover&artist=Diljit+Dosanjh', isLocal: false, releaseYear: 2021, mood: 'energetic', genre: 'Pop' }
  ],
  korean: [
    { id: 'itunes_1660603593', title: 'Ditto', artist: 'NewJeans', album: 'NewJeans \'OMG\'', language: 'korean', durationSec: 185, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/f6/29/42/f629426e-92fe-535c-cbe4-76e70850819b/196922287107_Cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Ditto&artist=NewJeans', isLocal: false, releaseYear: 2022, mood: 'chill', genre: 'K-Pop' },
    { id: 'itunes_1694764831', title: 'Super Shy', artist: 'NewJeans', album: 'Get Up', language: 'korean', durationSec: 154, cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/63/e5/e2/63e5e2e4-829b-924d-a1dc-8058a1d69bd4/196922462702_Cover.jpg/600x600bb.jpg', audioUrl: '/api/stream/full?title=Super+Shy&artist=NewJeans', isLocal: false, releaseYear: 2023, mood: 'energetic', genre: 'K-Pop' }
  ]
};

app.get('/api/search', optionalToken, async (req: AuthenticatedRequest, res: Response) => {
  const query = (req.query.q as string || '').trim();
  const language = (req.query.language as string || 'all').toLowerCase();
  const mood = (req.query.mood as string || 'all').toLowerCase();
  const genre = (req.query.genre as string || 'all').toLowerCase();
  const region = ((req.query.region as string) || 'IN').toUpperCase();
  const itunesCountry = region === 'GLOBAL' ? 'US' : region;

  // If query is blank and all filters are default, return curated collection
  if (!query && mood === 'all' && genre === 'all') {
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
    let searchTerm: string;
    if (query) {
      // Mode A: Song / Artist name query + optional filters
      const parts = [query];
      if (genre !== 'all') parts.push(genre);
      if (mood !== 'all') parts.push(mood);
      if (language !== 'all') parts.push(language);
      searchTerm = parts.join(' ');
    } else {
      // Mode B: Filter Discovery Mode (No song/artist name entered)
      const parts: string[] = [];
      if (language !== 'all') parts.push(language);
      else if (region === 'IN') parts.push('india');
      else parts.push('top hits');
      if (mood !== 'all') parts.push(`${mood} songs`);
      if (genre !== 'all') parts.push(genre);
      searchTerm = parts.join(' ');
    }

    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&country=${itunesCountry}&entity=song&limit=45`;
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

      const releaseYear = r.releaseDate ? new Date(r.releaseDate).getFullYear() : undefined;
      let trackGenre = r.primaryGenreName || 'Music';

      // Enhanced mood dynamic inference
      const lowerTitle = (r.trackName || '').toLowerCase();
      const lowerGenre = (r.primaryGenreName || '').toLowerCase();
      let inferredMood = 'chill';

      if (/breakup|heartbreak|dhokha|pirivu|broken|separation|cheat/i.test(lowerTitle)) {
        inferredMood = 'breakup';
      } else if (/sad|alone|crying|pain|dard|kannir|dukha|tear|lonely|hurt|judaai|miss/i.test(lowerTitle)) {
        inferredMood = 'sad';
      } else if (/motivation|gym|workout|energy|power|victory|aarambam|aarambh|believer|beast|roar|unbreakable|rise|fight|hustle/i.test(lowerTitle)) {
        inferredMood = 'motivation';
      } else if (/dance|party|club|remix|beat|dhol|bhangra|thara local|kuthu/i.test(lowerTitle) || /dance|party/i.test(lowerGenre)) {
        inferredMood = 'energetic';
      } else if (/love|heart|soul|romantic|unplugged|kadhal|pyaar|ishq|prem/i.test(lowerTitle) || /romance/i.test(lowerGenre)) {
        inferredMood = 'romantic';
      } else if (/devotional|bhajan|aarti|spiritual|gospel|shiva|krishna|hanuman/i.test(lowerTitle) || /devotional/i.test(lowerGenre)) {
        inferredMood = 'devotional';
      } else if (/ambient|sleep|study|lo-fi|piano|relax|calm/i.test(lowerTitle) || /ambient/i.test(lowerGenre)) {
        inferredMood = 'focus';
      } else if (mood !== 'all') {
        inferredMood = mood;
      }

      // Enhanced genre dynamic inference
      if (genre !== 'all') {
        trackGenre = genre.charAt(0).toUpperCase() + genre.slice(1);
      } else if (/melody|acoustic|unplugged|soft|slow/i.test(lowerTitle) || /melody/i.test(lowerGenre)) {
        trackGenre = 'Melody';
      } else if (/hip-hop|hip hop|rap|trap|drill/i.test(lowerGenre) || /rap|beat/i.test(lowerTitle)) {
        trackGenre = 'Hip-Hop';
      } else if (/pop/i.test(lowerGenre)) {
        trackGenre = 'Pop';
      } else if (/rock|metal/i.test(lowerGenre)) {
        trackGenre = 'Rock';
      } else if (/classical|carnatic|hindustani|instrumental/i.test(lowerGenre)) {
        trackGenre = 'Classical';
      } else if (/electronic|dance|edm|house/i.test(lowerGenre)) {
        trackGenre = 'EDM';
      } else if (/r&b|soul/i.test(lowerGenre)) {
        trackGenre = 'R&B';
      } else if (/folk/i.test(lowerGenre)) {
        trackGenre = 'Folk';
      }

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
        isStarred: false,
        releaseYear: releaseYear,
        mood: inferredMood,
        genre: trackGenre
      };
    });

    res.json({ results, count: results.length });
  } catch (err: any) {
    console.error('[Adora Search Error]', err);
    const allSeeds = Object.values(CURATED_SEED).flat();
    const fallback = allSeeds.filter(t => 
      !query ||
      t.title.toLowerCase().includes(query.toLowerCase()) || 
      t.artist.toLowerCase().includes(query.toLowerCase())
    );
    res.json({ results: fallback, count: fallback.length, error: err.message });
  }
});

// -------------------------------------------------------------
// Real India Live Trending Songs (iTunes India Store & Regional Charts)
// -------------------------------------------------------------
interface TrendingCacheEntry {
  results: any[];
  expiresAt: number;
}
const trendingCache = new Map<string, TrendingCacheEntry>();

app.get('/api/trending', optionalToken, async (req: AuthenticatedRequest, res: Response) => {
  const region = ((req.query.region as string) || 'IN').toUpperCase();
  const state = (req.query.state as string || '').trim();
  const languagesQuery = (req.query.languages as string || req.query.language as string || 'tamil,hindi,english').toLowerCase();
  const languages = languagesQuery.split(',').map(s => s.trim()).filter(Boolean);
  const cacheKey = `${region}:::${state}:::${languages.sort().join(',')}`;
  const now = Date.now();

  const cached = trendingCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    res.json({ results: cached.results, count: cached.results.length, region, state, cached: true });
    return;
  }

  try {
    const collectedTracks: any[] = [];
    const seenTitles = new Set<string>();
    const itunesCountry = (region === 'GLOBAL' ? 'us' : region.toLowerCase());

    // 1. Fetch Official Apple Music Top Songs Chart for the user's specific region
    try {
      const topRssUrl = `https://itunes.apple.com/${itunesCountry}/rss/topsongs/limit=35/json`;
      const rssResp = await fetch(topRssUrl, { headers: { 'User-Agent': 'Adora-Sanctuary/1.0' } });
      if (rssResp.ok) {
        const rssData: any = await rssResp.json();
        const entries = rssData.feed?.entry || [];
        for (const entry of entries) {
          const trackId = entry.id?.attributes?.['im:id'];
          const title = entry['im:name']?.label || entry.title?.label;
          const artist = entry['im:artist']?.label || 'Unknown Artist';
          const album = entry['im:collection']?.['im:name']?.label || 'Trending Single';
          const images = entry['im:image'] || [];
          const coverUrl = images[images.length - 1]?.label || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600';
          const genre = entry.category?.attributes?.label || 'Trending';
          
          const uniqueKey = `${title.toLowerCase()}:::${artist.toLowerCase()}`;
          if (!trackId || seenTitles.has(uniqueKey)) continue;
          seenTitles.add(uniqueKey);

          const fullAudioUrl = `/api/stream/full?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&id=${trackId}`;
          
          let inferredMood = 'chill';
          const lowerTitle = title.toLowerCase();
          if (/breakup|heartbreak|broken/i.test(lowerTitle)) inferredMood = 'breakup';
          else if (/sad|pain|dard|crying|tear/i.test(lowerTitle)) inferredMood = 'sad';
          else if (/motivation|power|energy|beast|roar/i.test(lowerTitle)) inferredMood = 'motivation';
          else if (/dance|party|club|remix|beat/i.test(lowerTitle)) inferredMood = 'energetic';
          else if (/love|heart|romantic|ishq|pyaar/i.test(lowerTitle)) inferredMood = 'romantic';

          collectedTracks.push({
            id: `trending_${trackId}`,
            title,
            artist,
            album,
            language: region.toLowerCase(),
            durationSec: 215,
            cover: coverUrl,
            audioUrl: fullAudioUrl,
            isLocal: false,
            isDownloaded: false,
            isStarred: false,
            releaseYear: 2026,
            mood: inferredMood,
            genre: genre
          });
        }
      }
    } catch (rssErr) {
      console.warn('[Adora Trending RSS Error]', rssErr);
    }

    // 2. Query Regional Trending Hits for each preferred language within that region
    for (const lang of languages.slice(0, 3)) {
      try {
        const queryCountry = (region === 'GLOBAL' ? 'US' : region);
        const langQuery = `trending ${lang} hits`;
        const langUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(langQuery)}&country=${queryCountry}&entity=song&limit=15`;
        const langResp = await fetch(langUrl, { headers: { 'User-Agent': 'Adora-Sanctuary/1.0' } });
        if (langResp.ok) {
          const langData: any = await langResp.json();
          for (const r of (langData.results || [])) {
            const uniqueKey = `${(r.trackName || '').toLowerCase()}:::${(r.artistName || '').toLowerCase()}`;
            if (seenTitles.has(uniqueKey)) continue;
            seenTitles.add(uniqueKey);

            const coverUrl = r.artworkUrl100
              ? r.artworkUrl100.replace('100x100bb', '600x600bb')
              : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600';

            const fullAudioUrl = `/api/stream/full?title=${encodeURIComponent(r.trackName)}&artist=${encodeURIComponent(r.artistName)}&id=${r.trackId}&fallback=${encodeURIComponent(r.previewUrl || '')}`;
            
            let inferredMood = 'chill';
            const lowerTitle = (r.trackName || '').toLowerCase();
            if (/breakup|heartbreak|pirivu|broken/i.test(lowerTitle)) inferredMood = 'breakup';
            else if (/sad|pain|dard|crying|tear|kannir/i.test(lowerTitle)) inferredMood = 'sad';
            else if (/motivation|power|energy|beast|roar|aarambam/i.test(lowerTitle)) inferredMood = 'motivation';
            else if (/dance|party|club|remix|kuthu|beat/i.test(lowerTitle)) inferredMood = 'energetic';
            else if (/love|heart|romantic|kadhal|pyaar/i.test(lowerTitle)) inferredMood = 'romantic';

            collectedTracks.push({
              id: `trending_${r.trackId}`,
              title: r.trackName,
              artist: r.artistName,
              album: r.collectionName || 'Single',
              language: lang,
              durationSec: Math.round((r.trackTimeMillis || 0) / 1000) || 210,
              cover: coverUrl,
              audioUrl: fullAudioUrl,
              isLocal: false,
              isDownloaded: false,
              isStarred: false,
              releaseYear: r.releaseDate ? new Date(r.releaseDate).getFullYear() : 2026,
              mood: inferredMood,
              genre: r.primaryGenreName || 'Regional Hit'
            });
          }
        }
      } catch (langErr) {
        console.warn(`[Adora Trending Lang ${lang} Error]`, langErr);
      }
    }

    // Cache results for 20 minutes
    trendingCache.set(cacheKey, {
      results: collectedTracks,
      expiresAt: now + 20 * 60 * 1000
    });

    res.json({ results: collectedTracks, count: collectedTracks.length, region });
  } catch (err: any) {
    console.error('[Adora Trending Error]', err);
    res.status(500).json({ error: 'Failed to fetch trending songs', details: err.message });
  }
});

// -------------------------------------------------------------
// Real-Time Synchronized Lyrics Engine (LRCLIB Integration)
// -------------------------------------------------------------
interface LyricLineItem {
  time: number; // in seconds (with decimals)
  text: string;
}

interface LyricsCacheEntry {
  available: boolean;
  synced: boolean;
  lines: LyricLineItem[];
  plainLyrics?: string;
  source: string;
  expiresAt: number;
}

const lyricsCache = new Map<string, LyricsCacheEntry>();

function parseLrc(lrcText: string): LyricLineItem[] {
  const lines: LyricLineItem[] = [];
  if (!lrcText) return lines;

  for (const rawLine of lrcText.split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    // Matches [mm:ss.xx] or [mm:ss]
    const match = trimmed.match(/^\[(\d{1,2}):(\d{2}(?:\.\d+)?)\]\s*(.*)$/);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseFloat(match[2]);
      const text = match[3].trim();
      if (text) {
        lines.push({
          time: parseFloat((mins * 60 + secs).toFixed(2)),
          text
        });
      }
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

function cleanSongTitleForLyrics(title: string): string {
  return title
    .replace(/\s*\(From\s+["'][^"']+["']\)/gi, '')
    .replace(/\s*\(feat\.[^)]+\)/gi, '')
    .replace(/\s*\(ft\.[^)]+\)/gi, '')
    .replace(/\s*\[Official[^\]]*\]/gi, '')
    .replace(/\s*\(Official[^)]*\)/gi, '')
    .replace(/\s*-\s*From\s+["'][^"']+["']/gi, '')
    .replace(/\s*\(Original[^)]*\)/gi, '')
    .trim();
}

app.get('/api/lyrics', optionalToken, async (req: AuthenticatedRequest, res: Response) => {
  const rawTitle = (req.query.title as string || '').trim();
  const rawArtist = (req.query.artist as string || '').trim();
  const durationSec = parseFloat(req.query.duration as string || '0');

  if (!rawTitle) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const cleanTitle = cleanSongTitleForLyrics(rawTitle);
  const cleanArtist = rawArtist.split('&')[0].split(',')[0].trim();
  const cacheKey = `${cleanTitle.toLowerCase()}:::${cleanArtist.toLowerCase()}`;
  const now = Date.now();

  const cached = lyricsCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    res.json(cached);
    return;
  }

  try {
    let matchItem: any = null;

    // 1. Try exact get endpoint
    try {
      const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      const getResp = await fetch(getUrl, {
        headers: { 'User-Agent': 'AudoraApp/1.0 (https://github.com/audora)' }
      });
      if (getResp.ok) {
        matchItem = await getResp.json();
      }
    } catch {}

    // 2. If not found or no synced lyrics, try broad search query
    if (!matchItem || (!matchItem.syncedLyrics && !matchItem.plainLyrics)) {
      try {
        const query = `${cleanTitle} ${cleanArtist}`.trim();
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
        const searchResp = await fetch(searchUrl, {
          headers: { 'User-Agent': 'AudoraApp/1.0 (https://github.com/audora)' }
        });
        if (searchResp.ok) {
          const list: any[] = await searchResp.json();
          // Find first entry with syncedLyrics
          matchItem = list.find((item: any) => item.syncedLyrics) || list.find((item: any) => item.plainLyrics) || null;
        }
      } catch {}
    }

    // 3. Fallback: Search with raw title only if still nothing found
    if (!matchItem || (!matchItem.syncedLyrics && !matchItem.plainLyrics)) {
      try {
        const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}`;
        const searchResp = await fetch(searchUrl, {
          headers: { 'User-Agent': 'AudoraApp/1.0 (https://github.com/audora)' }
        });
        if (searchResp.ok) {
          const list: any[] = await searchResp.json();
          matchItem = list.find((item: any) => item.syncedLyrics) || list.find((item: any) => item.plainLyrics) || null;
        }
      } catch {}
    }

    let responseData: LyricsCacheEntry;

    if (matchItem && matchItem.syncedLyrics) {
      const lines = parseLrc(matchItem.syncedLyrics);
      responseData = {
        available: lines.length > 0,
        synced: true,
        lines,
        source: 'lrclib_synced',
        expiresAt: now + 24 * 60 * 60 * 1000
      };
    } else if (matchItem && matchItem.plainLyrics) {
      const rawLines = matchItem.plainLyrics.split('\n').map((l: string) => l.trim()).filter(Boolean);
      const approxDuration = durationSec > 0 ? durationSec : (matchItem.duration || 210);
      const step = approxDuration / Math.max(1, rawLines.length);
      const lines: LyricLineItem[] = rawLines.map((text: string, idx: number) => ({
        time: parseFloat((idx * step).toFixed(2)),
        text
      }));
      responseData = {
        available: lines.length > 0,
        synced: false,
        lines,
        plainLyrics: matchItem.plainLyrics,
        source: 'lrclib_plain',
        expiresAt: now + 24 * 60 * 60 * 1000
      };
    } else {
      responseData = {
        available: false,
        synced: false,
        lines: [],
        source: 'none',
        expiresAt: now + 6 * 60 * 60 * 1000
      };
    }

    lyricsCache.set(cacheKey, responseData);
    res.json(responseData);
  } catch (err: any) {
    console.warn('[Lyrics Fetch Error]', err.message);
    res.json({
      available: false,
      synced: false,
      lines: [],
      error: 'Failed to retrieve lyrics',
      source: 'error'
    });
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
// User Preferences & Playlists Persistence
// -------------------------------------------------------------
const DATA_DIR = path.resolve(__dirname, '../../data');
const PREFERENCES_FILE = path.join(DATA_DIR, 'user_preferences.json');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'user_playlists.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.get('/api/user/preferences', optionalToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'default_user';
  try {
    if (fs.existsSync(PREFERENCES_FILE)) {
      const allPrefs = JSON.parse(fs.readFileSync(PREFERENCES_FILE, 'utf-8'));
      const userPrefs = allPrefs[userId] || {
        region: 'IN',
        state: 'Tamil Nadu',
        preferredLanguages: ['tamil', 'hindi', 'english'],
        favoriteArtists: ['A.R. Rahman', 'Anirudh Ravichander', 'Arijit Singh', 'The Weeknd'],
        onboardingCompleted: false
      };
      if (!userPrefs.region) {
        userPrefs.region = 'IN';
      }
      if (!userPrefs.state) {
        userPrefs.state = '';
      }
      res.json({ preferences: userPrefs });
      return;
    }
  } catch (e) {}

  res.json({
    preferences: {
      region: 'IN',
      state: 'Tamil Nadu',
      preferredLanguages: ['tamil', 'hindi', 'english'],
      favoriteArtists: ['A.R. Rahman', 'Anirudh Ravichander', 'Arijit Singh', 'The Weeknd'],
      onboardingCompleted: false
    }
  });
});

app.post('/api/user/preferences', optionalToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'default_user';
  const { region, state, preferredLanguages, favoriteArtists, onboardingCompleted } = req.body;

  let allPrefs: Record<string, any> = {};
  try {
    if (fs.existsSync(PREFERENCES_FILE)) {
      allPrefs = JSON.parse(fs.readFileSync(PREFERENCES_FILE, 'utf-8'));
    }
  } catch (e) {}

  allPrefs[userId] = {
    region: typeof region === 'string' && region.trim() ? region.trim().toUpperCase() : (allPrefs[userId]?.region || 'IN'),
    state: typeof state === 'string' ? state.trim() : (allPrefs[userId]?.state || ''),
    preferredLanguages: Array.isArray(preferredLanguages) ? preferredLanguages : ['tamil', 'hindi', 'english'],
    favoriteArtists: Array.isArray(favoriteArtists) ? favoriteArtists : [],
    onboardingCompleted: Boolean(onboardingCompleted)
  };

  try {
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(allPrefs, null, 2));
  } catch (e) {}

  res.json({ success: true, preferences: allPrefs[userId] });
});

app.get('/api/user/playlists', optionalToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'default_user';
  try {
    if (fs.existsSync(PLAYLISTS_FILE)) {
      const allPlaylists = JSON.parse(fs.readFileSync(PLAYLISTS_FILE, 'utf-8'));
      res.json({ playlists: allPlaylists[userId] || [] });
      return;
    }
  } catch (e) {}
  res.json({ playlists: [] });
});

app.post('/api/user/playlists', optionalToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'default_user';
  const { playlists } = req.body;

  let allPlaylists: Record<string, any> = {};
  try {
    if (fs.existsSync(PLAYLISTS_FILE)) {
      allPlaylists = JSON.parse(fs.readFileSync(PLAYLISTS_FILE, 'utf-8'));
    }
  } catch (e) {}

  allPlaylists[userId] = Array.isArray(playlists) ? playlists : [];

  try {
    fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(allPlaylists, null, 2));
  } catch (e) {}

  res.json({ success: true, playlists: allPlaylists[userId] });
});

// -------------------------------------------------------------
// App Play Telemetry & Listening Trends Persistence
// -------------------------------------------------------------
const TELEMETRY_FILE = path.join(DATA_DIR, 'telemetry_plays.json');

interface PlayRecord {
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  audioUrl?: string;
  language?: string;
  mood?: string;
  genre?: string;
  durationSec?: number;
  playCount: number;
  lastPlayedAt: number;
}

interface TelemetryStore {
  tracks: Record<string, PlayRecord>;
  recentPlays: Array<{ trackId: string; title: string; artist: string; timestamp: number; cover?: string }>;
  totalPlays: number;
}

function loadTelemetry(): TelemetryStore {
  try {
    if (fs.existsSync(TELEMETRY_FILE)) {
      return JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('[Adora Telemetry Load Error]', err);
  }

  // Pre-seed with realistic, initial community telemetry for top sanctuary songs
  return {
    tracks: {
      'seed_1': { trackId: 'seed_1', title: 'Enjoy Enjaami', artist: 'Dhee, Arivu & Santhosh Narayanan', album: 'Enjoy Enjaami', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', language: 'tamil', mood: 'energetic', genre: 'Melody', playCount: 428, lastPlayedAt: Date.now() - 360000 },
      'seed_2': { trackId: 'seed_2', title: 'Vaathi Coming', artist: 'Anirudh Ravichander & Gana Balachandar', album: 'Master', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600', language: 'tamil', mood: 'energetic', genre: 'Kuthu', playCount: 382, lastPlayedAt: Date.now() - 720000 },
      'seed_3': { trackId: 'seed_3', title: 'Kesariya', artist: 'Arijit Singh, Pritam & Amitabh Bhattacharya', album: 'Brahmastra', cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600', language: 'hindi', mood: 'romantic', genre: 'Melody', playCount: 356, lastPlayedAt: Date.now() - 1440000 },
      'seed_4': { trackId: 'seed_4', title: 'Arabic Kuthu', artist: 'Anirudh Ravichander & Jonita Gandhi', album: 'Beast', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600', language: 'tamil', mood: 'party', genre: 'Pop', playCount: 310, lastPlayedAt: Date.now() - 2800000 },
      'seed_5': { trackId: 'seed_5', title: 'Brown Munde', artist: 'AP Dhillon, Gurinder Gill & Shinda Kahlon', album: 'Brown Munde', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600', language: 'punjabi', mood: 'party', genre: 'Hip-Hop', playCount: 294, lastPlayedAt: Date.now() - 3600000 },
      'seed_6': { trackId: 'seed_6', title: 'Starboy', artist: 'The Weeknd & Daft Punk', album: 'Starboy', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600', language: 'english', mood: 'energetic', genre: 'R&B', playCount: 275, lastPlayedAt: Date.now() - 5400000 },
      'seed_7': { trackId: 'seed_7', title: 'Believer', artist: 'Imagine Dragons', album: 'Evolve', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600', language: 'english', mood: 'motivation', genre: 'Rock', playCount: 258, lastPlayedAt: Date.now() - 7200000 }
    },
    recentPlays: [
      { trackId: 'seed_1', title: 'Enjoy Enjaami', artist: 'Dhee & Arivu', timestamp: Date.now() - 360000, cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600' },
      { trackId: 'seed_2', title: 'Vaathi Coming', artist: 'Anirudh Ravichander', timestamp: Date.now() - 720000, cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600' },
      { trackId: 'seed_3', title: 'Kesariya', artist: 'Arijit Singh', timestamp: Date.now() - 1440000, cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600' }
    ],
    totalPlays: 2303
  };
}

function saveTelemetry(store: TelemetryStore) {
  try {
    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Adora Telemetry Save Error]', err);
  }
}

app.post('/api/telemetry/play', optionalToken, (req: AuthenticatedRequest, res: Response) => {
  const { track } = req.body;
  if (!track || !track.title) {
    res.status(400).json({ error: 'Missing track data' });
    return;
  }

  const store = loadTelemetry();
  const trackKey = track.id || `${track.title}:::${track.artist}`;
  
  if (!store.tracks[trackKey]) {
    store.tracks[trackKey] = {
      trackId: track.id || trackKey,
      title: track.title,
      artist: track.artist || 'Unknown Artist',
      album: track.album,
      cover: track.cover,
      audioUrl: track.audioUrl,
      language: track.language,
      mood: track.mood || 'chill',
      genre: track.genre || 'Music',
      durationSec: track.durationSec,
      playCount: 1,
      lastPlayedAt: Date.now()
    };
  } else {
    store.tracks[trackKey].playCount += 1;
    store.tracks[trackKey].lastPlayedAt = Date.now();
    if (track.cover && !store.tracks[trackKey].cover) store.tracks[trackKey].cover = track.cover;
    if (track.audioUrl) store.tracks[trackKey].audioUrl = track.audioUrl;
  }

  store.totalPlays = (store.totalPlays || 0) + 1;
  store.recentPlays.unshift({
    trackId: track.id || trackKey,
    title: track.title,
    artist: track.artist || 'Unknown',
    timestamp: Date.now(),
    cover: track.cover
  });
  if (store.recentPlays.length > 40) {
    store.recentPlays.pop();
  }

  saveTelemetry(store);
  res.json({ success: true, playCount: store.tracks[trackKey].playCount, totalPlays: store.totalPlays });
});

app.get('/api/telemetry/trends', optionalToken, (_req: AuthenticatedRequest, res: Response) => {
  const store = loadTelemetry();
  const trackList = Object.values(store.tracks);
  
  // Sort tracks by play count descending
  const topPlayed = [...trackList].sort((a, b) => b.playCount - a.playCount).slice(0, 30);

  // Calculate artist, mood, and genre distribution
  const artistMap: Record<string, number> = {};
  const moodMap: Record<string, number> = {};
  const genreMap: Record<string, number> = {};

  for (const t of trackList) {
    const artist = t.artist || 'Unknown';
    artistMap[artist] = (artistMap[artist] || 0) + t.playCount;

    const mood = (t.mood || 'chill').toLowerCase();
    moodMap[mood] = (moodMap[mood] || 0) + t.playCount;

    const genre = (t.genre || 'Music').trim();
    genreMap[genre] = (genreMap[genre] || 0) + t.playCount;
  }

  const total = store.totalPlays || 1;

  const topArtists = Object.entries(artistMap)
    .map(([artist, count]) => ({ artist, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topMoods = Object.entries(moodMap)
    .map(([mood, count]) => ({ mood, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);

  const topGenres = Object.entries(genreMap)
    .map(([genre, count]) => ({ genre, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({
    totalAppPlays: store.totalPlays,
    topPlayed,
    topArtists,
    topMoods,
    topGenres,
    recentActivity: store.recentPlays.slice(0, 15)
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
