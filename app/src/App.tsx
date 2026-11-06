import { useState, useEffect, useRef, useMemo } from 'react';
import { ZenNavRail } from './components/ZenNavRail';
import { TopHeader } from './components/TopHeader';
import { FloatingPlayer } from './components/FloatingPlayer';
import { LivingRoomMode } from './components/LivingRoomMode';
import { BlendLoungeModal } from './components/BlendLoungeModal';
import { AdminStudioModal } from './components/AdminStudioModal';
import { AuthModal } from './components/AuthModal';
import { TrackList } from './components/TrackList';
import { QueueDrawer } from './components/QueueDrawer';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { PlaylistDetailView } from './components/PlaylistDetailView';
import { UserSettingsModal } from './components/UserSettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { Track, User, Device, BlendSession, AdminMetrics, Playlist, UserPreferences } from './types';
import { Sparkles, Radio, CheckCircle, ShieldCheck, Flame, History, FolderPlus, Play, Plus, Music, Disc3, Clock } from 'lucide-react';
import { searchTracks, requestIngest, fetchLocalTracks, resolveAudioUrl, fetchUserPreferences, saveUserPreferences, fetchUserPlaylists, saveUserPlaylists } from './services/api';

const INITIAL_TRACKS: Track[] = [
  {
    id: 'itunes_1502476579',
    title: 'Vaathi Coming',
    artist: 'Anirudh Ravichander & Gana Balachandar',
    album: 'Master',
    language: 'tamil',
    durationSec: 230,
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
    audioUrl: '/api/stream/full?title=Vaathi+Coming&artist=Anirudh+Ravichander',
    isLocal: false,
    releaseYear: 2021,
    mood: 'energetic',
    genre: 'Soundtrack',
    isStarred: true
  },
  {
    id: 'itunes_1556858076',
    title: 'Enjoy Enjaami',
    artist: 'Dhee, Arivu & Santhosh Narayanan',
    album: 'Enjoy Enjaami - Single',
    language: 'tamil',
    durationSec: 302,
    cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600',
    audioUrl: '/api/stream/full?title=Enjoy+Enjaami&artist=Dhee+Arivu',
    isLocal: false,
    releaseYear: 2021,
    mood: 'chill',
    genre: 'Indie'
  },
  {
    id: 'itunes_1583726481',
    title: 'Adiye',
    artist: 'Dhibu Ninan Thomas & Kapil Kapilan',
    album: 'Bachelor',
    language: 'tamil',
    durationSec: 254,
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    audioUrl: '/api/stream/full?title=Adiye&artist=Dhibu+Ninan+Thomas',
    isLocal: false,
    releaseYear: 2021,
    mood: 'romantic',
    genre: 'Soundtrack'
  },
  {
    id: 'itunes_1634938221',
    title: 'Kesariya',
    artist: 'Pritam, Arijit Singh & Amitabh Bhattacharya',
    album: 'Brahmastra',
    language: 'hindi',
    durationSec: 268,
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
    audioUrl: '/api/stream/full?title=Kesariya&artist=Arijit+Singh',
    isLocal: false,
    releaseYear: 2022,
    mood: 'romantic',
    genre: 'Bollywood',
    isStarred: true
  },
  {
    id: 'itunes_1440857781',
    title: 'Midnight City',
    artist: 'M83',
    album: "Hurry Up, We're Dreaming",
    language: 'english',
    durationSec: 243,
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    audioUrl: '/api/stream/full?title=Midnight+City&artist=M83',
    isLocal: false,
    releaseYear: 2011,
    mood: 'focus',
    genre: 'Electronic'
  },
  {
    id: 'itunes_1440833249',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    language: 'english',
    durationSec: 200,
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    audioUrl: '/api/stream/full?title=Blinding+Lights&artist=The+Weeknd',
    isLocal: false,
    releaseYear: 2019,
    mood: 'energetic',
    genre: 'Pop'
  },
  {
    id: 'itunes_1660603593',
    title: 'Ditto',
    artist: 'NewJeans',
    album: "NewJeans 'OMG'",
    language: 'korean',
    durationSec: 185,
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
    audioUrl: '/api/stream/full?title=Ditto&artist=NewJeans',
    isLocal: false,
    releaseYear: 2022,
    mood: 'chill',
    genre: 'K-Pop'
  }
];

const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'pl_favorites',
    name: 'Sanctuary Favorites',
    description: 'Hand-picked songs immune from LRU cloud pruning',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
    trackIds: ['itunes_1502476579', 'itunes_1634938221'],
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now()
  },
  {
    id: 'pl_chill',
    name: 'Late Night Flow',
    description: 'Acoustic & lo-fi calm for study and relaxation',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    trackIds: ['itunes_1556858076', 'itunes_1440857781', 'itunes_1660603593'],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now()
  }
];

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentTab, setCurrentTab] = useState<'studio' | 'vault' | 'sync' | 'admin'>('studio');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedYearRange, setSelectedYearRange] = useState<{ min: number; max: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Audio State & Real HTML5 Audio Element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [volume, setVolume] = useState(0.85);

  // Queue System
  const [queue, setQueue] = useState<Track[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Playlists System
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('adora_user_playlists');
      return saved ? JSON.parse(saved) : DEFAULT_PLAYLISTS;
    } catch {
      return DEFAULT_PLAYLISTS;
    }
  });
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [playlistTrackToAdd, setPlaylistTrackToAdd] = useState<Track | null>(null);

  // Recently Played
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('adora_recently_played');
      return saved ? JSON.parse(saved) : [INITIAL_TRACKS[0], INITIAL_TRACKS[1]];
    } catch {
      return [INITIAL_TRACKS[0], INITIAL_TRACKS[1]];
    }
  });

  // User Preferences & First-Time Onboarding
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('adora_user_prefs');
      return saved ? JSON.parse(saved) : {
        preferredLanguages: ['tamil', 'hindi', 'english'],
        favoriteArtists: ['A.R. Rahman', 'Anirudh Ravichander', 'Arijit Singh'],
        onboardingCompleted: false
      };
    } catch {
      return {
        preferredLanguages: ['tamil', 'hindi', 'english'],
        favoriteArtists: ['A.R. Rahman', 'Anirudh Ravichander', 'Arijit Singh'],
        onboardingCompleted: false
      };
    }
  });

  // Modals
  const [isLivingRoomOpen, setIsLivingRoomOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => !userPreferences.onboardingCompleted);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auth & Devices
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'usr_admin',
    username: 'admin',
    role: 'admin',
    token: 'mock_ephemeral_token_15m'
  });

  const [activeDevice] = useState<Device | null>(() => ({
    deviceId: 'dev_laptop',
    deviceName: "Studio Desktop PC",
    userId: 'usr_admin',
    isPlaying: false,
    volume: 0.85,
    lastSeen: Date.now()
  }));

  // Sync Session State (formerly Blend)
  const [syncSession, setSyncSession] = useState<BlendSession | null>(null);

  // Admin Metrics
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics>({
    storage: {
      totalGB: 200,
      pinnedGB: 34.2,
      cachedGB: 12.8,
      usedGB: 47.0,
      freeGB: 153.0,
      highWatermarkGB: 160,
      isNearLimit: false
    },
    system: {
      uptimeSeconds: 124500,
      freeMemoryMB: 18450,
      totalMemoryMB: 24576
    },
    activity: {
      activeListeners: 4,
      activeBlendRooms: 1,
      twoFactorEnabled: false
    }
  });

  // Dark Mode class toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save Playlists to LocalStorage & Server
  useEffect(() => {
    try {
      localStorage.setItem('adora_user_playlists', JSON.stringify(playlists));
      saveUserPlaylists(playlists, currentUser?.token).catch(() => {});
    } catch {}
  }, [playlists, currentUser?.token]);

  // Save Recently Played
  useEffect(() => {
    try {
      localStorage.setItem('adora_recently_played', JSON.stringify(recentlyPlayed));
    } catch {}
  }, [recentlyPlayed]);

  // Save Preferences
  const handleSavePreferences = (newPrefs: UserPreferences) => {
    setUserPreferences(newPrefs);
    try {
      localStorage.setItem('adora_user_prefs', JSON.stringify(newPrefs));
      saveUserPreferences(newPrefs, currentUser?.token).catch(() => {});
    } catch {}
    setIsOnboardingOpen(false);
    showToast('Preferences updated! Your feed is tailored.');
  };

  // Sync Preferences & Playlists from Server on login
  useEffect(() => {
    if (currentUser?.token) {
      fetchUserPreferences(currentUser.token)
        .then(res => {
          if (res?.preferences) {
            setUserPreferences(res.preferences);
            if (!res.preferences.onboardingCompleted) {
              setIsOnboardingOpen(true);
            }
          }
        })
        .catch(() => {});

      fetchUserPlaylists(currentUser.token)
        .then(res => {
          if (res?.playlists && Array.isArray(res.playlists) && res.playlists.length > 0) {
            setPlaylists(res.playlists);
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  // Audio Playback Synchronization with HTML5 Audio Element
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  // Clean Audio Source Synchronization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack?.audioUrl) {
      audio.pause();
      return;
    }

    const targetSrc = resolveAudioUrl(currentTrack.audioUrl) || '';
    if (audio.src !== targetSrc) {
      audio.src = targetSrc;
      audio.load();
      setPositionSec(0);
    }

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn('[Adora Playback]', err);
      });
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying]);

  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDurationSec(Math.floor(audioRef.current.duration));
    } else if (currentTrack) {
      setDurationSec(currentTrack.durationSec || 30);
    }
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.warn('[Adora Playback]', e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPositionSec(Math.floor(audioRef.current.currentTime));
    }
  };

  // Live Worldwide Music Search (250ms debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const queryTerm = searchQuery.trim();
        // If mood is selected and query is active, append mood for richer search
        const fullQuery = (selectedMood !== 'all' && queryTerm)
          ? `${queryTerm} ${selectedMood}`
          : queryTerm;

        const data = await searchTracks(fullQuery, selectedLanguage, currentUser?.token);
        if (data && Array.isArray(data.results)) {
          setTracks(data.results);
        }
      } catch (err) {
        console.warn('[Adora Live Search]', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedLanguage, selectedMood, currentUser?.token]);

  // Initial load: Fetch local downloaded library from server
  useEffect(() => {
    fetchLocalTracks(currentUser?.token)
      .then(res => {
        if (res && Array.isArray(res.tracks) && res.tracks.length > 0) {
          setTracks(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newTracks = res.tracks.filter((t: Track) => !existingIds.has(t.id));
            return [...newTracks, ...prev];
          });
        }
      })
      .catch(() => {});
  }, [currentUser?.token]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Playback handlers
  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  // -------------------------------------------------------------
  // Smart Autoplay Algorithm: Determines upcoming track based on mood & taste
  // -------------------------------------------------------------
  const upcomingAutoplayTrack = useMemo<Track | null>(() => {
    if (!currentTrack || tracks.length === 0) return null;

    const currentMood = (currentTrack.mood || 'chill').toLowerCase();
    const currentArtist = currentTrack.artist.toLowerCase();
    const currentLang = currentTrack.language.toLowerCase();

    // 1. First priority: match exact mood and user preferred languages/artists
    const candidates = tracks.filter(t => t.id !== currentTrack.id);

    // Try matching mood + language
    const moodMatches = candidates.filter(t => 
      t.mood && t.mood.toLowerCase() === currentMood &&
      (userPreferences.preferredLanguages.includes(t.language) || t.language === currentLang)
    );
    if (moodMatches.length > 0) {
      return moodMatches[Math.floor(Math.random() * moodMatches.length)];
    }

    // Try matching same artist or same language
    const artistMatches = candidates.filter(t => 
      t.artist.toLowerCase().includes(currentArtist) || currentArtist.includes(t.artist.toLowerCase())
    );
    if (artistMatches.length > 0) {
      return artistMatches[0];
    }

    // Fallback to any different track in catalog
    return candidates[0] || null;
  }, [currentTrack, tracks, userPreferences]);

  // Song transition (Queue -> Smart Autoplay -> Sequential)
  const handleNext = () => {
    if (queue.length > 0) {
      const [nextQueued, ...restQueue] = queue;
      setQueue(restQueue);
      playSongWithHistory(nextQueued);
      showToast(`Playing from Queue: ${nextQueued.title}`);
      return;
    }

    if (upcomingAutoplayTrack) {
      playSongWithHistory(upcomingAutoplayTrack);
      showToast(`Smart Autoplay: ${upcomingAutoplayTrack.title} (${upcomingAutoplayTrack.mood || 'Mood Match'})`);
      return;
    }

    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    playSongWithHistory(tracks[nextIndex]);
  };

  const handlePrev = () => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playSongWithHistory(tracks[prevIndex]);
  };

  const playSongWithHistory = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setPositionSec(0);

    // Add to Recently Played (max 15 unique)
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      return [track, ...filtered].slice(0, 15);
    });

    // If online track, trigger on-demand JIT ingestion in background
    if (!track.isLocal) {
      requestIngest({ title: track.title, artist: track.artist, language: track.language }, currentUser?.token)
        .catch(e => console.warn('[Adora Ingestion Trigger]', e));
    }
  };

  const handleSelectTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(prev => !prev);
      return;
    }
    playSongWithHistory(track);
  };

  // Queue Operations
  const handleAddToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
    showToast(`Added "${track.title}" to Queue`);
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearQueue = () => {
    setQueue([]);
    showToast('Queue cleared');
  };

  // Playlist Operations
  const handleCreatePlaylist = (newPl: Playlist) => {
    setPlaylists(prev => [newPl, ...prev]);
    showToast(`Created playlist "${newPl.name}"`);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    if (activePlaylistId === playlistId) {
      setActivePlaylistId(null);
    }
    showToast('Playlist deleted');
  };

  const handleToggleTrackInPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        const hasTrack = p.trackIds.includes(trackId);
        const updatedTrackIds = hasTrack
          ? p.trackIds.filter(id => id !== trackId)
          : [...p.trackIds, trackId];
        showToast(hasTrack ? 'Removed from playlist' : 'Added to playlist');
        return { ...p, trackIds: updatedTrackIds, updatedAt: Date.now() };
      }
      return p;
    }));
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, trackIds: p.trackIds.filter(id => id !== trackId), updatedAt: Date.now() };
      }
      return p;
    }));
    showToast('Track removed from playlist');
  };

  const handlePlayPlaylist = (playlistTracks: Track[]) => {
    if (playlistTracks.length === 0) return;
    const [first, ...rest] = playlistTracks;
    playSongWithHistory(first);
    setQueue(rest);
    showToast(`Playing playlist (${playlistTracks.length} tracks queued)`);
  };

  const handleShufflePlaylist = (playlistTracks: Track[]) => {
    if (playlistTracks.length === 0) return;
    const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
    const [first, ...rest] = shuffled;
    playSongWithHistory(first);
    setQueue(rest);
    showToast(`Shuffled playlist (${playlistTracks.length} tracks)`);
  };

  // Logo Click / Home Handler: Clears all filters and returns to Home pure view
  const handleGoHome = () => {
    setCurrentTab('studio');
    setActivePlaylistId(null);
    setSearchQuery('');
    setSelectedMood('all');
    setSelectedYearRange(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const effectiveDuration = (durationSec && durationSec > 0) ? durationSec : (currentTrack?.durationSec || 30);

  const handleSeek = (pos: number) => {
    if (!audioRef.current) return;
    const maxDur = effectiveDuration > 0.5 ? effectiveDuration - 0.5 : 0;
    const clamped = Math.max(0, Math.min(pos, maxDur));
    audioRef.current.currentTime = clamped;
    setPositionSec(Math.floor(clamped));
  };

  const handleFastForward = (seconds: number = 10) => {
    if (!audioRef.current) return;
    handleSeek(audioRef.current.currentTime + seconds);
  };

  const handleRewind = (seconds: number = 10) => {
    if (!audioRef.current) return;
    handleSeek(audioRef.current.currentTime - seconds);
  };

  // Favorite (Pins track from deletion)
  const handleToggleFavorite = (trackId: string) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        const isNowStarred = !t.isStarred;
        showToast(isNowStarred ? 'Saved to Favorites (Immune from pruning)' : 'Removed from Favorites');
        return { ...t, isStarred: isNowStarred };
      }
      return t;
    }));
  };

  // Offline Download (Vault) & Server Permanent JIT Ingest
  const handleToggleDownload = (track: Track) => {
    setTracks(prev => prev.map(t => {
      if (t.id === track.id) {
        const isNowDownloaded = !t.isDownloaded;
        showToast(isNowDownloaded ? 'Queued for Vault download' : 'Removed from Offline Vault');
        if (isNowDownloaded) {
          requestIngest({ title: track.title, artist: track.artist, language: track.language }, currentUser?.token)
            .then(res => {
              if (res && res.audioUrl) {
                t.audioUrl = res.audioUrl;
                t.isLocal = true;
              }
            })
            .catch(e => console.warn('[Adora Download Queue]', e));
        }
        return { ...t, isDownloaded: isNowDownloaded };
      }
      return t;
    }));
  };

  // JIT Ingestion Save
  const handleIngestTrack = (track: Track) => {
    setTracks(prev => prev.map(t => {
      if (t.id === track.id) {
        showToast(`Ingesting "${track.title}" to permanent cloud library`);
        return { ...t, isLocal: true, isStarred: true };
      }
      return t;
    }));
  };

  // Sync Sessions (Group listening)
  const handleStartSync = () => {
    const newSession: BlendSession = {
      roomId: `SYNC-${Math.floor(1000 + Math.random() * 9000)}`,
      isPlaying: isPlaying,
      currentTrack: currentTrack,
      positionSec: positionSec,
      participants: [currentUser?.username || 'You', 'Aarav', 'Maya']
    };
    setSyncSession(newSession);
    showToast(`Sync Room Created: ${newSession.roomId}`);
  };

  const handleLeaveSync = () => {
    setSyncSession(null);
    showToast('Left Sync room');
  };

  // Filtered tracks with Mood, Language, and Release Year Range support
  const filteredTracks = useMemo(() => {
    return tracks.filter(t => {
      // 1. Vault tab filter
      if (currentTab === 'vault') {
        const matchesQuery = !searchQuery || 
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          t.artist.toLowerCase().includes(searchQuery.toLowerCase());
        return (t.isStarred || t.isDownloaded) && matchesQuery;
      }

      // 2. Language filter
      if (selectedLanguage !== 'all' && t.language !== selectedLanguage) {
        return false;
      }

      // 3. Mood filter
      if (selectedMood !== 'all') {
        const songMood = (t.mood || '').toLowerCase();
        if (songMood && songMood !== selectedMood.toLowerCase()) {
          return false;
        }
      }

      // 4. Release Year Range filter
      if (selectedYearRange && t.releaseYear) {
        if (t.releaseYear < selectedYearRange.min || t.releaseYear > selectedYearRange.max) {
          return false;
        }
      }

      return true;
    });
  }, [tracks, currentTab, searchQuery, selectedLanguage, selectedMood, selectedYearRange]);

  // Active playlist resolution if user clicked a playlist
  const activePlaylist = useMemo(() => {
    if (!activePlaylistId) return null;
    return playlists.find(p => p.id === activePlaylistId) || null;
  }, [activePlaylistId, playlists]);

  // Trending tracks based on user preferences and popular seed list
  const trendingTracks = useMemo(() => {
    return tracks.filter(t => 
      userPreferences.preferredLanguages.includes(t.language) ||
      userPreferences.favoriteArtists.some(a => t.artist.toLowerCase().includes(a.toLowerCase()))
    ).slice(0, 6);
  }, [tracks, userPreferences]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--canvas-bg)] text-[var(--text-primary)]">
      {/* Real Audio Player Element */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={() => {
          if (isPlaying && audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(e => console.warn('[Adora Playback]', e));
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full glass-panel shadow-xl text-xs font-semibold flex items-center gap-2 border border-[var(--border-subtle)] animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Zen Navigation Rail */}
      <ZenNavRail
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'sync') setIsSyncModalOpen(true);
          else if (tab === 'admin') setIsAdminModalOpen(true);
          else {
            setActivePlaylistId(null);
            setCurrentTab(tab);
          }
        }}
        onGoHome={handleGoHome}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Sanctuary Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* 2. Top Header with Search, Mood & Year Range Filters */}
        <TopHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          selectedMood={selectedMood}
          setSelectedMood={setSelectedMood}
          selectedYearRange={selectedYearRange}
          setSelectedYearRange={setSelectedYearRange}
          activeDevice={activeDevice}
          onOpenDevicePicker={() => {
            showToast('Adora Connect: Switched playback between Phone & Desktop');
          }}
          currentUser={currentUser}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* 3. Main Body Content */}
        <main className="flex-1 overflow-y-auto px-6 pt-2 pb-32 flex flex-col gap-8 max-w-6xl w-full mx-auto">
          
          {/* VIEW A: Active Playlist View (When clicked from Home) */}
          {activePlaylist ? (
            <PlaylistDetailView
              playlist={activePlaylist}
              allTracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handleSelectTrack}
              onPlayAll={handlePlayPlaylist}
              onShufflePlay={handleShufflePlaylist}
              onBack={() => setActivePlaylistId(null)}
              onDeletePlaylist={handleDeletePlaylist}
              onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
              onToggleFavorite={handleToggleFavorite}
              onToggleDownload={handleToggleDownload}
              onAddToQueue={handleAddToQueue}
            />
          ) : (
            <>
              {/* VIEW B: Normal Home Discovery Feed */}

              {/* Hero Banner: Current Track Showcase */}
              {currentTrack && (
                <div className="relative rounded-3xl overflow-hidden p-6 md:p-8 bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div 
                      className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 cursor-pointer group"
                      onClick={() => setIsLivingRoomOpen(true)}
                      title="Open Living Room Mode"
                    >
                      <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent-primary)]">
                          {currentTrack.language} • {currentTrack.isLocal ? 'High-Res Audio' : 'Instant Online Discovery'}
                          {currentTrack.releaseYear && ` • ${currentTrack.releaseYear}`}
                        </span>
                        {syncSession && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <Radio className="w-3 h-3 animate-pulse" />
                            Sync Room {syncSession.roomId}
                          </span>
                        )}
                      </div>
                      <h1 className="text-2xl md:text-3xl font-serif font-bold text-[var(--text-primary)]">
                        {currentTrack.title}
                      </h1>
                      <p className="text-sm text-[var(--text-muted)] font-medium">
                        {currentTrack.artist} — {currentTrack.album}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={handleTogglePlay}
                          className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold shadow-md hover:scale-105 transition-transform flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          {isPlaying ? 'Pause' : 'Play Now'}
                        </button>
                        <button
                          onClick={() => handleAddToQueue(currentTrack)}
                          className="px-4 py-2 rounded-full bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--border-subtle)] transition-colors"
                        >
                          Add to Queue
                        </button>
                        <button
                          onClick={() => setIsLivingRoomOpen(true)}
                          className="px-4 py-2 rounded-full bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--border-subtle)] transition-colors flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                          Living Room
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="hidden lg:flex flex-col items-end text-right gap-1 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      Pruning Protection Active
                    </span>
                    <span>Cloudflare Edge • Secure Vault</span>
                    <span>Zero Ads • 100% Free Full Audio</span>
                  </div>
                </div>
              )}

              {/* HOME SECTION 1: User Playlists Showcase (Cards with details) */}
              {!searchQuery && currentTab === 'studio' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold font-serif text-[var(--text-primary)] tracking-tight">
                        Your Playlists
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        Curated playlists for any mood or journey
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCreatePlaylistOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold shadow-sm hover:scale-105 transition-transform"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Playlist
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => setActivePlaylistId(pl.id)}
                        className="group relative rounded-2xl p-3.5 bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 transition-all cursor-pointer shadow-sm flex flex-col gap-3"
                      >
                        <div className="w-full aspect-square rounded-xl overflow-hidden relative shadow-md">
                          {pl.coverUrl ? (
                            <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)]">
                              <Music className="w-8 h-8" />
                            </div>
                          )}

                          {/* Quick Play Floating Action */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const plTracks = pl.trackIds.map(id => tracks.find(t => t.id === id)).filter((t): t is Track => Boolean(t));
                              handlePlayPlaylist(plTracks);
                            }}
                            className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110 active:scale-95 transition-all"
                            title="Play playlist"
                          >
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </button>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)]">
                            {pl.name}
                          </h4>
                          <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                            {pl.description || `${pl.trackIds.length} tracks`}
                          </p>
                          <span className="text-[11px] font-mono text-[var(--text-muted)] mt-1 block">
                            {pl.trackIds.length} tracks
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Create New Playlist Card */}
                    <div
                      onClick={() => setIsCreatePlaylistOpen(true)}
                      className="rounded-2xl p-4 border border-dashed border-[var(--border-subtle)] hover:border-[var(--accent-primary)] bg-[var(--surface-card)]/40 hover:bg-[var(--accent-primary)]/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 min-h-48"
                    >
                      <div className="p-3 rounded-full bg-[var(--surface-hover)] text-[var(--accent-primary)]">
                        <FolderPlus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">New Playlist</span>
                      <span className="text-[11px] text-[var(--text-muted)]">Create your own collection</span>
                    </div>
                  </div>
                </div>
              )}

              {/* HOME SECTION 2: Recently Played / Heard */}
              {!searchQuery && currentTab === 'studio' && recentlyPlayed.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[var(--accent-primary)]" />
                    <h3 className="text-base font-bold font-serif text-[var(--text-primary)]">
                      Recently Heard
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {recentlyPlayed.map((track) => (
                      <div
                        key={`recent_${track.id}`}
                        onClick={() => handleSelectTrack(track)}
                        className="flex-shrink-0 w-44 p-2.5 rounded-2xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] transition-all cursor-pointer group flex flex-col gap-2"
                      >
                        <div className="w-full h-28 rounded-xl overflow-hidden relative shadow-sm">
                          <img src={track.cover} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-md">
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-[var(--text-primary)] truncate">{track.title}</h5>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">{track.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HOME SECTION 3: Trending Now (Based on user taste) */}
              {!searchQuery && currentTab === 'studio' && trendingTracks.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <h3 className="text-base font-bold font-serif text-[var(--text-primary)]">
                        Trending For You
                      </h3>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Tuned to {userPreferences.preferredLanguages.join(', ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {trendingTracks.map((track) => (
                      <div
                        key={`trend_${track.id}`}
                        onClick={() => handleSelectTrack(track)}
                        className="p-2.5 rounded-2xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                            <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-[var(--text-primary)] truncate">{track.title}</h5>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">{track.artist}</p>
                          </div>
                        </div>
                        <Play className="w-3.5 h-3.5 text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity fill-current mr-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HOME SECTION 4: Filtered Track Shelf / Library List */}
              <TrackList
                tracks={filteredTracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onSelectTrack={handleSelectTrack}
                onToggleFavorite={handleToggleFavorite}
                onToggleDownload={handleToggleDownload}
                onIngestOnlineTrack={handleIngestTrack}
                onAddToQueue={handleAddToQueue}
                onAddToPlaylist={(track) => setPlaylistTrackToAdd(track)}
                title={
                  currentTab === 'vault' 
                    ? "The Vault (Your Starred & Downloaded Music)" 
                    : searchQuery 
                    ? `Search Results for "${searchQuery}"`
                    : selectedMood !== 'all'
                    ? `${selectedMood.toUpperCase()} Curated Shelf`
                    : "Curated Sanctuary Shelf"
                }
                subtitle={
                  selectedYearRange 
                    ? `Filtering songs released between ${selectedYearRange.min} and ${selectedYearRange.max}`
                    : selectedLanguage !== 'all' 
                    ? `Filtered by ${selectedLanguage.toUpperCase()} songs` 
                    : "Songs discovered and saved across worldwide languages"
                }
              />
            </>
          )}

        </main>

        {/* 4. Floating Acoustic Island Player (Frosted Glass Translucent) */}
        <FloatingPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={handleNext}
          onPrev={handlePrev}
          positionSec={positionSec}
          durationSec={durationSec}
          onSeek={handleSeek}
          onFastForward={() => handleFastForward(10)}
          onRewind={() => handleRewind(10)}
          volume={volume}
          onVolumeChange={(vol) => setVolume(vol)}
          onOpenLivingRoom={() => setIsLivingRoomOpen(true)}
          onToggleDownload={handleToggleDownload}
          isBlendSession={Boolean(syncSession)}
          queueCount={queue.length}
          onOpenQueue={() => setIsQueueOpen(true)}
          onAddToPlaylist={(track) => setPlaylistTrackToAdd(track)}
        />
      </div>

      {/* 5. Modals & Overlays */}
      {/* Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        queue={queue}
        onPlayTrack={handleSelectTrack}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
        upcomingAutoplayTrack={upcomingAutoplayTrack}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreatePlaylist={handleCreatePlaylist}
      />

      {/* Add Track to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={Boolean(playlistTrackToAdd)}
        onClose={() => setPlaylistTrackToAdd(null)}
        track={playlistTrackToAdd}
        playlists={playlists}
        onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
        onOpenCreatePlaylist={() => {
          setPlaylistTrackToAdd(null);
          setIsCreatePlaylistOpen(true);
        }}
      />

      {/* User Personalization Settings Modal */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={userPreferences}
        onSavePreferences={handleSavePreferences}
      />

      {/* 1st-Time User Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        username={currentUser?.username}
        onComplete={handleSavePreferences}
      />

      {/* Living Room Mode */}
      {isLivingRoomOpen && currentTrack && (
        <LivingRoomMode
          track={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={handleNext}
          onPrev={handlePrev}
          onClose={() => setIsLivingRoomOpen(false)}
          positionSec={positionSec}
          durationSec={durationSec}
          onSeek={handleSeek}
          onFastForward={() => handleFastForward(10)}
          onRewind={() => handleRewind(10)}
          isBlendSession={Boolean(syncSession)}
        />
      )}

      {/* Sync Lounge Modal (formerly Blend) */}
      <BlendLoungeModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        session={syncSession}
        onStartBlend={handleStartSync}
        onLeaveBlend={handleLeaveSync}
        currentTrack={currentTrack}
      />

      {/* Admin Studio Modal */}
      <AdminStudioModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        metrics={adminMetrics}
        onToggle2FA={(enabled) => {
          setAdminMetrics(prev => ({
            ...prev,
            activity: { ...prev.activity, twoFactorEnabled: enabled }
          }));
          showToast(`2FA ${enabled ? 'Enabled' : 'Disabled'}`);
        }}
        onTriggerPrune={() => {
          showToast('LRU Pruning completed: 1.2 GB freed');
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome back, ${user.username}!`);
          // If first time login, trigger onboarding
          if (!userPreferences.onboardingCompleted) {
            setIsOnboardingOpen(true);
          }
        }}
        onLogout={() => {
          setCurrentUser(null);
          showToast('Logged out successfully');
        }}
      />
    </div>
  );
}
