import { useState, useEffect, useRef } from 'react';
import { ZenNavRail } from './components/ZenNavRail';
import { TopHeader } from './components/TopHeader';
import { FloatingPlayer } from './components/FloatingPlayer';
import { LivingRoomMode } from './components/LivingRoomMode';
import { BlendLoungeModal } from './components/BlendLoungeModal';
import { AdminStudioModal } from './components/AdminStudioModal';
import { AuthModal } from './components/AuthModal';
import { TrackList } from './components/TrackList';
import { Track, User, Device, BlendSession, AdminMetrics } from './types';
import { Sparkles, Radio, CheckCircle, ShieldCheck } from 'lucide-react';
import { searchTracks, requestIngest, fetchLocalTracks, resolveAudioUrl } from './services/api';

const INITIAL_TRACKS: Track[] = [
  {
    id: 'trk_1',
    title: 'Adiye',
    artist: 'Dhibu Ninan Thomas, Kapil Kapilan',
    album: 'Bachelor',
    language: 'tamil',
    durationSec: 372,
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    isLocal: true,
    isStarred: true,
    isDownloaded: true,
    lyrics: [
      "Adiye en aada thozhiye,",
      "Nee illaatha podhilaum un ninaive.",
      "Acoustic strings echoing through the night,",
      "Warm vinyl resonance holding every breath,",
      "In the gentle quiet of the room."
    ]
  },
  {
    id: 'trk_2',
    title: 'Kesariya',
    artist: 'Arijit Singh, Pritam',
    album: 'Brahmastra',
    language: 'hindi',
    durationSec: 425,
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    isLocal: true,
    isStarred: true,
    isDownloaded: false,
    lyrics: [
      "Kesariya tera ishq hai piya,",
      "Rang jaaun jo main haath lagaun.",
      "Din beete saare teri fikr mein,",
      "Rain saari teri khair manaun."
    ]
  },
  {
    id: 'trk_3',
    title: 'Midnight City',
    artist: 'M83',
    album: "Hurry Up, We're Dreaming",
    language: 'english',
    durationSec: 344,
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    isLocal: true,
    isStarred: false,
    isDownloaded: true,
    lyrics: [
      "Waiting in a car,",
      "Waiting for a ride in the dark.",
      "The city is my church,",
      "It wraps me in the blinding twilight."
    ]
  },
  {
    id: 'trk_4',
    title: 'Ditto',
    artist: 'NewJeans',
    album: 'OMG',
    language: 'korean',
    durationSec: 185,
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    isLocal: true,
    isStarred: false,
    isDownloaded: false,
    lyrics: [
      "Stay in the middle,",
      "Like you a little, don't want no riddle.",
      "Say it back, oh say it ditto,",
      "Soft acoustic melodies floating away."
    ]
  },
  {
    id: 'trk_5',
    title: 'Enjoy Enjaami',
    artist: 'Dhee, Arivu, Santhosh Narayanan',
    album: 'Independent Single',
    language: 'tamil',
    durationSec: 302,
    cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    isLocal: false, // Discovered on-demand online!
    isStarred: false,
    isDownloaded: false,
    lyrics: [
      "Cuckoo cuckoo kaathodu thaalelo,",
      "Kombu thean poovodu thenalo.",
      "Earthly roots, heritage voices,",
      "Singing for the soil and ancestors."
    ]
  }
];

export function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentTab, setCurrentTab] = useState<'studio' | 'vault' | 'blend' | 'admin'>('studio');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Audio State & Real HTML5 Audio Element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [volume, setVolume] = useState(0.85);

  // Modals
  const [isLivingRoomOpen, setIsLivingRoomOpen] = useState(false);
  const [isBlendModalOpen, setIsBlendModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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

  // Blend Session State
  const [blendSession, setBlendSession] = useState<BlendSession | null>(null);

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

  // Audio Playback Synchronization with HTML5 Audio Element
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn('Playback gesture required by browser:', err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  // Live Worldwide Music Search (250ms debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const data = await searchTracks(searchQuery, selectedLanguage, currentUser?.token);
        if (data && Array.isArray(data.results)) {
          setTracks(data.results);
        }
      } catch (err) {
        console.warn('[Adora Live Search]', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedLanguage, currentUser?.token]);

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

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPositionSec(Math.floor(audioRef.current.currentTime));
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Playback handlers
  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
    setPositionSec(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrack(tracks[prevIndex]);
    setPositionSec(0);
    setIsPlaying(true);
  };

  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setPositionSec(0);

    // If online track, trigger on-demand JIT ingestion in background
    if (!track.isLocal) {
      requestIngest({ title: track.title, artist: track.artist, language: track.language }, currentUser?.token)
        .catch(e => console.warn('[Adora Ingestion Trigger]', e));
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn(e));
    }
  };

  const handleSeek = (pos: number) => {
    setPositionSec(pos);
    if (audioRef.current) {
      audioRef.current.currentTime = pos;
    }
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

  // Blend Sessions
  const handleStartBlend = () => {
    const newSession: BlendSession = {
      roomId: `BLND-${Math.floor(1000 + Math.random() * 9000)}`,
      isPlaying: isPlaying,
      currentTrack: currentTrack,
      positionSec: positionSec,
      participants: [currentUser?.username || 'You', 'Aarav', 'Maya']
    };
    setBlendSession(newSession);
    showToast(`Blend Room Created: ${newSession.roomId}`);
  };

  const handleLeaveBlend = () => {
    setBlendSession(null);
    showToast('Left Blend room');
  };

  // Filtered tracks
  const filteredTracks = tracks.filter(t => {
    if (currentTab === 'vault') {
      const matchesQuery = !searchQuery || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.artist.toLowerCase().includes(searchQuery.toLowerCase());
      return (t.isStarred || t.isDownloaded) && matchesQuery;
    }

    // When an online search is active, the results are already resolved by the search engine
    if (searchQuery.trim()) {
      return true;
    }

    // Curated ambient browsing filtered by language
    return selectedLanguage === 'all' || t.language === selectedLanguage;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--canvas-bg)] text-[var(--text-primary)]">
      {/* Real Audio Player Element */}
      <audio
        ref={audioRef}
        src={resolveAudioUrl(currentTrack?.audioUrl)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full glass-panel shadow-xl text-xs font-semibold flex items-center gap-2 border border-[var(--border-subtle)]">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Zen Navigation Rail */}
      <ZenNavRail
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'blend') setIsBlendModalOpen(true);
          else if (tab === 'admin') setIsAdminModalOpen(true);
          else setCurrentTab(tab);
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Sanctuary Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* 2. Top Header */}
        <TopHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          activeDevice={activeDevice}
          onOpenDevicePicker={() => {
            showToast('Adora Connect: Switched playback between Phone & Desktop');
          }}
          currentUser={currentUser}
        />

        {/* 3. Main Body Content */}
        <main className="flex-1 overflow-y-auto px-6 pt-2 pb-32 flex flex-col gap-8 max-w-6xl w-full mx-auto">
          
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
                    </span>
                    {blendSession && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Radio className="w-3 h-3 animate-pulse" />
                        Blend Room {blendSession.roomId}
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
                      className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold shadow-md hover:scale-105 transition-transform"
                    >
                      {isPlaying ? 'Pause' : 'Play Now'}
                    </button>
                    <button
                      onClick={() => setIsLivingRoomOpen(true)}
                      className="px-4 py-2 rounded-full bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--border-subtle)] transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      Living Room Mode
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
                <span>Zero Ads • Lossless Audio</span>
              </div>
            </div>
          )}

          {/* Track Shelf / Library List */}
          <TrackList
            tracks={filteredTracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onSelectTrack={handleSelectTrack}
            onToggleFavorite={handleToggleFavorite}
            onToggleDownload={handleToggleDownload}
            onIngestOnlineTrack={handleIngestTrack}
            title={currentTab === 'vault' ? "The Vault (Your Playlists & Offline)" : "Curated Sanctuary Shelf"}
            subtitle={
              selectedLanguage !== 'all' 
                ? `Filtered by ${selectedLanguage.toUpperCase()} curations` 
                : "Songs you & your friends have discovered and saved"
            }
          />
        </main>

        {/* 4. Floating Acoustic Island Player */}
        <FloatingPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={handleNext}
          onPrev={handlePrev}
          positionSec={positionSec}
          onSeek={handleSeek}
          volume={volume}
          onVolumeChange={(vol) => setVolume(vol)}
          onOpenLivingRoom={() => setIsLivingRoomOpen(true)}
          onToggleDownload={handleToggleDownload}
          isBlendSession={Boolean(blendSession)}
        />
      </div>

      {/* 5. Modals & Overlays */}
      {isLivingRoomOpen && currentTrack && (
        <LivingRoomMode
          track={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={handleNext}
          onPrev={handlePrev}
          onClose={() => setIsLivingRoomOpen(false)}
          isBlendSession={Boolean(blendSession)}
          blendParticipants={blendSession?.participants}
        />
      )}

      <BlendLoungeModal
        isOpen={isBlendModalOpen}
        onClose={() => setIsBlendModalOpen(false)}
        session={blendSession}
        onStartBlend={handleStartBlend}
        onLeaveBlend={handleLeaveBlend}
        currentTrack={currentTrack}
      />

      <AdminStudioModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        metrics={adminMetrics}
        onToggle2FA={(val) => {
          setAdminMetrics(prev => ({
            ...prev,
            activity: { ...prev.activity, twoFactorEnabled: val }
          }));
          showToast(`Admin 2FA OTP requirement set to: ${val ? 'ON' : 'OFF'}`);
        }}
        onTriggerPrune={() => {
          setAdminMetrics(prev => ({
            ...prev,
            storage: {
              ...prev.storage,
              cachedGB: Math.max(0, prev.storage.cachedGB - 0.015),
              usedGB: prev.storage.usedGB - 0.015,
              freeGB: prev.storage.freeGB + 0.015
            }
          }));
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome back, ${user.username}!`);
        }}
        onLogout={() => {
          setCurrentUser(null);
          showToast('Logged out');
        }}
      />
    </div>
  );
}

export default App;
