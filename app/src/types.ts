export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  language: string;
  durationSec: number;
  cover: string;
  audioUrl?: string;
  isLocal: boolean;
  isDownloaded?: boolean;
  isStarred?: boolean;
  lyrics?: string[];
  releaseYear?: number;
  mood?: string;
  genre?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface UserPreferences {
  region: string; // Country code e.g. 'IN', 'US', 'GB', 'CA', etc.
  preferredLanguages: string[];
  favoriteArtists: string[];
  onboardingCompleted: boolean;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  token?: string;
  refreshToken?: string;
  preferences?: UserPreferences;
  isNewUser?: boolean;
}

export interface Device {
  deviceId: string;
  deviceName: string;
  userId: string;
  isPlaying: boolean;
  trackTitle?: string;
  volume: number;
  lastSeen: number;
}

export interface BlendSession {
  roomId: string;
  isPlaying: boolean;
  currentTrack: Track | null;
  positionSec: number;
  participants: string[];
}

export interface AdminMetrics {
  storage: {
    totalGB: number;
    pinnedGB: number;
    cachedGB: number;
    usedGB: number;
    freeGB: number;
    highWatermarkGB: number;
    isNearLimit: boolean;
  };
  system: {
    uptimeSeconds: number;
    freeMemoryMB: number;
    totalMemoryMB: number;
  };
  activity: {
    activeListeners: number;
    activeBlendRooms: number;
    twoFactorEnabled: boolean;
  };
}
