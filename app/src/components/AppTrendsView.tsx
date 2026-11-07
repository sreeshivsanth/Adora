import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Play, Pause, Flame, Trophy, Sparkles, Music, 
  BarChart3, RefreshCw, Plus, Heart, Radio, Disc3, Clock,
  Download, Check
} from 'lucide-react';
import { Track } from '../types';
import { fetchTelemetryTrends } from '../services/api';

interface AppTrendsViewProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onPauseTrack: () => void;
  onAddToQueue: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  onToggleStar: (trackId: string) => void;
  onToggleDownload?: (track: Track) => void;
  isDownloaded?: (track: Track) => boolean;
  token?: string;
}

export const AppTrendsView: React.FC<AppTrendsViewProps> = ({
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPauseTrack,
  onAddToQueue,
  onAddToPlaylist,
  onToggleStar,
  onToggleDownload,
  isDownloaded,
  token
}) => {
  const [trendsData, setTrendsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchTelemetryTrends(token);
      if (data && Array.isArray(data.topPlayed)) {
        setTrendsData(data);
      }
    } catch (err) {
      console.warn('[Adora Pulse Error]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const topPlayed: any[] = trendsData?.topPlayed || [];
  const topArtists: any[] = trendsData?.topArtists || [];
  const topMoods: any[] = trendsData?.topMoods || [];
  const topGenres: any[] = trendsData?.topGenres || [];
  const recentActivity: any[] = trendsData?.recentActivity || [];
  const totalPlays = trendsData?.totalAppPlays || 0;

  const topSong = topPlayed[0];
  const topArtist = topArtists[0];
  const dominantMood = topMoods[0];

  const handlePlayAllTop = () => {
    if (topPlayed.length > 0) {
      onPlayTrack(topPlayed[0]);
      for (let i = 1; i < Math.min(topPlayed.length, 10); i++) {
        onAddToQueue(topPlayed[i]);
      }
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto px-3.5 md:px-10 py-4 md:py-8 flex flex-col gap-6 md:gap-8 pb-44 md:pb-32 select-none animate-fadeIn">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] shadow-sm">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-[var(--text-primary)] flex items-center gap-2">
              Adora Pulse
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-mono font-semibold tracking-normal">
                Live App Trends
              </span>
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Top streamed tracks, listening patterns, and community genre trends inside Adora
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[var(--accent-primary)]' : ''}`} />
            <span>Refresh</span>
          </button>

          {topPlayed.length > 0 && (
            <button
              onClick={handlePlayAllTop}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--canvas-bg)] text-xs font-semibold shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Top Charts</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total App Streams */}
        <div className="p-4 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Streams</span>
            <Disc3 className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <span className="text-2xl font-bold text-[var(--text-primary)] font-mono">
            {totalPlays.toLocaleString()}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">Plays recorded in this app</span>
        </div>

        {/* #1 Top Song */}
        <div className="p-4 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">#1 Most Played</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-sm font-bold text-[var(--text-primary)] truncate">
            {topSong ? topSong.title : 'Enjoy Enjaami'}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] truncate">
            {topSong ? `${topSong.artist} • ${topSong.playCount} plays` : 'Streaming Leader'}
          </span>
        </div>

        {/* Top Artist */}
        <div className="p-4 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Streamed Artist</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <span className="text-sm font-bold text-[var(--text-primary)] truncate">
            {topArtist ? topArtist.artist : 'Anirudh Ravichander'}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {topArtist ? `${topArtist.count} plays (${topArtist.percent}% share)` : 'Popular Artist'}
          </span>
        </div>

        {/* Dominant Mood */}
        <div className="p-4 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Dominant Mood</span>
            <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <span className="text-sm font-bold text-[var(--text-primary)] capitalize">
            {dominantMood ? `${dominantMood.mood} Mood` : 'Energetic Flow'}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {dominantMood ? `${dominantMood.percent}% of active listening` : 'Community vibe'}
          </span>
        </div>
      </div>

      {/* Main Grid: Most Played Leaderboard (Left/Center) + Analytics Breakdown (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Leaderboard Table */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-[var(--text-primary)] font-serif">
                Most Played Songs in Adora
              </h2>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              Ranked by total in-app streams
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {topPlayed.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.trackId || currentTrack?.title === track.title;
              const isTrackPlaying = isCurrent && isPlaying;
              const rank = idx + 1;

              return (
                <div
                  key={track.trackId || track.title}
                  className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[var(--surface-hover)] border-[var(--accent-primary)]/50 shadow-sm'
                      : 'bg-[var(--surface-card)] border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]'
                  }`}
                  onClick={() => {
                    if (isTrackPlaying) onPauseTrack();
                    else onPlayTrack(track);
                  }}
                >
                  {/* Left: Rank & Thumbnail */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-7 text-center flex-shrink-0">
                      {rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-black font-extrabold text-xs shadow-md">
                          1
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-black font-bold text-xs shadow-sm">
                          2
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs shadow-sm">
                          3
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-semibold text-[var(--text-muted)]">
                          #{rank}
                        </span>
                      )}
                    </div>

                    {/* Album Art Thumbnail with Hover Play Button */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-800 shadow-sm">
                      <img
                        src={track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isTrackPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        {isTrackPlaying ? (
                          <Pause className="w-5 h-5 text-white fill-current" />
                        ) : (
                          <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Title & Artist */}
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-bold truncate ${
                        isCurrent ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                      }`}>
                        {track.title}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] truncate">
                        {track.artist}
                      </span>
                    </div>
                  </div>

                  {/* Right: Badges & Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Mood / Language Badge */}
                    {track.mood && (
                      <span className="hidden sm:inline px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                        {track.mood}
                      </span>
                    )}

                    {/* Play Count Pill */}
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs font-mono font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {track.playCount} plays
                    </span>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      {onToggleDownload && (
                        <button
                          onClick={() => onToggleDownload(track)}
                          className={`p-1.5 rounded-full transition-colors ${
                            (isDownloaded ? isDownloaded(track) : track.isDownloaded)
                              ? 'text-emerald-500 bg-emerald-500/10'
                              : 'hover:bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                          title={(isDownloaded ? isDownloaded(track) : track.isDownloaded) ? "Saved in Offline Vault" : "Download to Offline Vault"}
                        >
                          {(isDownloaded ? isDownloaded(track) : track.isDownloaded) ? <Check className="w-4 h-4 text-emerald-500" /> : <Download className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => onAddToQueue(track)}
                        className="p-1.5 rounded-full hover:bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="Add to Playback Queue"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onAddToPlaylist(track)}
                        className="p-1.5 rounded-full hover:bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="Add to Playlist"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Deep Analytics Breakdown */}
        <div className="flex flex-col gap-6">
          
          {/* Top Artists in App */}
          <div className="p-5 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--accent-primary)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Top Streamed Artists
              </h3>
            </div>
            
            <div className="flex flex-col gap-3">
              {topArtists.map((artist, idx) => (
                <div key={artist.artist} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)] truncate">
                      {idx + 1}. {artist.artist}
                    </span>
                    <span className="text-[var(--text-muted)] font-mono text-[11px]">
                      {artist.count} plays ({artist.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (artist.count / (topArtists[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Mood Breakdown */}
          <div className="p-5 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm flex flex-col gap-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              Community Mood Breakdown
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {topMoods.map((m) => (
                <div
                  key={m.mood}
                  className="px-3 py-1.5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs"
                >
                  <span className="capitalize font-semibold text-[var(--text-primary)]">
                    {m.mood === 'breakup' ? '💔 Breakup' :
                     m.mood === 'motivation' ? '🔥 Motivation' :
                     m.mood === 'sad' ? '🌧️ Sad' :
                     m.mood === 'chill' ? '☕ Chill' :
                     m.mood === 'energetic' ? '⚡ Energetic' :
                     m.mood === 'romantic' ? '💖 Romantic' : m.mood}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--accent-primary)] font-bold">
                    {m.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Play Activity Feed */}
          <div className="p-5 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm flex flex-col gap-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
              Recent Play Stream
            </h3>
            <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
              {recentActivity.map((act, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-[var(--text-primary)] truncate">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] truncate">
                      {act.artist}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                    Recently
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
