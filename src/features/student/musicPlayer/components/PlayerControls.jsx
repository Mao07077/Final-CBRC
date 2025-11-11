import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, X } from 'lucide-react';
import useMusicPlayerStore from '../../../../store/student/musicPlayerStore';
import AudioOnlyYouTubePlayer from './AudioOnlyYouTubePlayer';

const PlayerControls = () => {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const ytTimerRef = useRef(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const {
    playlists,
    userPlaylists,
    activePlaylistId,
    activePlaylistType,
    currentTrackIndex,
    isPlaying,
    audio,
    showPlayer,
    play,
    pause,
    nextTrack,
    prevTrack,
    hidePlayer,
    cleanup
  } = useMusicPlayerStore();

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const getCurrentTrack = () => {
    if (!activePlaylistId) return null;
    let playlist;
    if (activePlaylistType === "embedded") {
      playlist = playlists[activePlaylistId];
    } else {
      playlist = userPlaylists.find(p => p._id === activePlaylistId);
    }
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) return null;
    return playlist.tracks[currentTrackIndex];
  };

  const currentTrack = getCurrentTrack();
  // Determine YouTube videoId early for effects and handlers
  const isYouTubeUrl = currentTrack?.url && (currentTrack.url.includes('youtube.com') || currentTrack.url.includes('youtu.be'));
  let videoId = null;
  if (currentTrack && (currentTrack.source === 'youtube' || isYouTubeUrl) && (currentTrack.url || currentTrack.audio_url)) {
    const sourceUrl = currentTrack.url || currentTrack.audio_url;
    try {
      const urlObj = new URL(sourceUrl);
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.replace('/', '').split('?')[0];
      } else if (urlObj.searchParams.has('v')) {
        videoId = urlObj.searchParams.get('v');
      } else {
        const match = sourceUrl.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
        if (match) videoId = match[1];
      }
    } catch {
      const match = sourceUrl.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
      if (match) videoId = match[1];
    }
  }

  useEffect(() => {
    if (!audio) return;
    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => nextTrack();
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audio, nextTrack]);

  // Poll YouTube current time/duration when using YouTube source
  useEffect(() => {
    if (!videoId || !window._audioYTPlayer) {
      if (ytTimerRef.current) {
        clearInterval(ytTimerRef.current);
        ytTimerRef.current = null;
      }
      return;
    }
    // Start interval to update every 500ms
    ytTimerRef.current = setInterval(() => {
      try {
        const t = window._audioYTPlayer.getCurrentTime?.() || 0;
        const d = window._audioYTPlayer.getDuration?.() || 0;
        setCurrentTime(t);
        setDuration(d);
      } catch {}
    }, 500);
    return () => {
      if (ytTimerRef.current) {
        clearInterval(ytTimerRef.current);
        ytTimerRef.current = null;
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [audio, volume, isMuted]);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    // Apply to YouTube player if present
    if (window._audioYTPlayer && typeof window._audioYTPlayer.setVolume === 'function') {
      try { window._audioYTPlayer.setVolume(Math.round(newVolume * 100)); } catch {}
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (window._audioYTPlayer) {
      try {
        if (next) {
          window._audioYTPlayer.mute?.();
        } else {
          window._audioYTPlayer.unMute?.();
          window._audioYTPlayer.setVolume?.(Math.round(volume * 100));
        }
      } catch {}
    }
  };

  const handleSeek = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    // Seek for YouTube or HTMLAudio
    if (videoId && window._audioYTPlayer && typeof window._audioYTPlayer.seekTo === 'function') {
      try { window._audioYTPlayer.seekTo(newTime, true); } catch {}
    } else if (audio) {
      audio.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePrevTrack = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    try {
      await prevTrack();
    } catch (error) {
      console.error("Previous track error:", error);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleNextTrack = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    try {
      await nextTrack();
    } catch (error) {
      console.error("Next track error:", error);
    } finally {
      setIsNavigating(false);
    }
  };

  const handlePlayPauseToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (videoId && window._audioYTPlayer) {
        if (isPlaying) {
          window._audioYTPlayer.pauseVideo();
        } else {
          window._audioYTPlayer.playVideo();
        }
      } else {
        if (isPlaying) {
          await pause();
        } else {
          await play();
        }
      }
    } catch (error) {
      console.error("Play/pause error:", error);
    } finally {
      setIsToggling(false);
    }
  };

  // Note: Do not early-return before all hooks are declared (to keep hooks order stable)

  // Debug log for videoId
  console.log('[PlayerControls] videoId:', videoId, 'track:', currentTrack);

  // Media Session API for lockscreen/notification controls (mobile-friendly)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack?.title || 'Unknown',
        artist: currentTrack?.artist || 'Unknown',
        album: 'CBRC Study Music',
        artwork: currentTrack?.thumbnail ? [
          { src: currentTrack.thumbnail, sizes: '96x96', type: 'image/png' },
          { src: currentTrack.thumbnail, sizes: '192x192', type: 'image/png' }
        ] : []
      });
      navigator.mediaSession.setActionHandler('play', async () => {
        if (videoId && window._audioYTPlayer) {
          window._audioYTPlayer.playVideo?.();
        } else {
          await play();
        }
      });
      navigator.mediaSession.setActionHandler('pause', async () => {
        if (videoId && window._audioYTPlayer) {
          window._audioYTPlayer.pauseVideo?.();
        } else {
          await pause();
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') {
          if (videoId && window._audioYTPlayer) {
            window._audioYTPlayer.seekTo?.(details.seekTime, true);
          } else if (audio) {
            audio.currentTime = details.seekTime;
          }
          setCurrentTime(details.seekTime);
        }
      });
    } catch {}
  }, [currentTrack, videoId, audio, play, pause, prevTrack, nextTrack]);

  // Safe early return AFTER all hooks are set up to preserve hooks order between renders
  if (!currentTrack || !showPlayer) {
    return null;
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4 shadow-lg ml-0 lg:ml-64">
      <div className="max-w-6xl mx-auto">
        {/* Close Button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={hidePlayer}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Hide player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Track Info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0 mb-2">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            {currentTrack.thumbnail ? (
              <img 
                src={currentTrack.thumbnail} 
                alt={currentTrack.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Music className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-800 truncate">{currentTrack.title}</h4>
            <p className="text-sm text-gray-600 truncate">{currentTrack.artist}</p>
            {(currentTrack.source === 'youtube' || isYouTubeUrl) && (
              <span className="inline-block text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded mt-1">YouTube</span>
            )}
          </div>
        </div>
  {/* Only show one player at a time */}
        {(currentTrack.source === 'youtube' || isYouTubeUrl) ? (
          videoId ? (
            <AudioOnlyYouTubePlayer
              videoId={videoId}
              title={currentTrack.title}
              artist={currentTrack.artist}
            />
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4 text-center">
              <span className="text-red-600 font-bold">Error: Invalid or missing YouTube video ID.</span>
              <div className="text-xs text-red-400 mt-2">Check the track URL or try another song.</div>
            </div>
          )
        ) : null}
        {/* Progress bar and time indicator */}
        <div className="mt-2">
          <div
            className="w-full h-2 bg-gray-200 rounded cursor-pointer relative"
            onClick={handleSeek}
            onTouchStart={handleSeek}
          >
            <div
              className="h-2 bg-blue-600 rounded"
              style={{ width: `${duration ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        {/* Playback Controls (common) */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-4 flex-shrink-0">
            <button
              onClick={handlePrevTrack}
              disabled={isNavigating}
              className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors ${
                isNavigating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Previous track"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={handlePlayPauseToggle}
              disabled={isToggling}
              className={`p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors ${
                isToggling ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={handleNextTrack}
              disabled={isNavigating}
              className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors ${
                isNavigating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Next track"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
            <button
              onClick={toggleMute}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(isMuted ? 0 : volume) * 100}%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%, #e5e7eb 100%)`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;
