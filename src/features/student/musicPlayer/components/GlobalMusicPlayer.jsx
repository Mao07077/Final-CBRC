import React, { useMemo } from 'react';
import useMusicPlayerStore from '../../../../store/student/musicPlayerStore';
import PlayerControls from './PlayerControls';
import AudioOnlyYouTubePlayer from './AudioOnlyYouTubePlayer';
import { Music, Play, Pause, SkipForward, Maximize2, X } from 'lucide-react';

const GlobalMusicPlayer = () => {
  const {
    playlists,
    userPlaylists,
    activePlaylistId,
    activePlaylistType,
    currentTrackIndex,
    showPlayer,
    isMinimized,
    isPlaying,
    play,
    pause,
    nextTrack,
    maximizePlayer,
    stopAndClose
  } = useMusicPlayerStore();

  const currentTrack = useMemo(() => {
    if (!activePlaylistId) return null;
    let playlist;
    if (activePlaylistType === 'embedded') {
      playlist = playlists[activePlaylistId];
    } else {
      playlist = userPlaylists.find(p => p._id === activePlaylistId);
    }
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) return null;
    return playlist.tracks[currentTrackIndex];
  }, [playlists, userPlaylists, activePlaylistId, activePlaylistType, currentTrackIndex]);

  // Extract YouTube videoId for engine mount
  const videoId = useMemo(() => {
    if (!currentTrack) return null;
    const isYouTubeUrl = currentTrack?.url && (currentTrack.url.includes('youtube.com') || currentTrack.url.includes('youtu.be'));
    if (!(currentTrack.source === 'youtube' || isYouTubeUrl)) return null;
    const sourceUrl = currentTrack.url || currentTrack.audio_url;
    if (!sourceUrl) return null;
    try {
      const urlObj = new URL(sourceUrl);
      if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.replace('/', '').split('?')[0];
      } else if (urlObj.searchParams.has('v')) {
        return urlObj.searchParams.get('v');
      }
      const match = sourceUrl.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
      return match ? match[1] : null;
    } catch {
      const match = sourceUrl.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
      return match ? match[1] : null;
    }
  }, [currentTrack]);

  // Always mount engine if needed
  const showEngine = !!videoId;

  if (!showPlayer) return null;

  return (
    <>
      {showEngine && (
        <AudioOnlyYouTubePlayer
          videoId={videoId}
          title={currentTrack?.title}
          artist={currentTrack?.artist}
        />
      )}

      {/* Full controls when not minimized */}
      {!isMinimized && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <PlayerControls />
        </div>
      )}

      {/* Mini widget when minimized */}
      {isMinimized && currentTrack && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 shadow-xl rounded-full pl-2 pr-3 py-2 flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
            {currentTrack.thumbnail ? (
              <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <Music className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="hidden sm:block max-w-[160px]">
            <div className="text-xs font-medium text-gray-800 truncate">{currentTrack.title}</div>
            <div className="text-[10px] text-gray-500 truncate">{currentTrack.artist}</div>
          </div>
          <button
            onClick={() => {
              const isYT = currentTrack?.source === 'youtube' || (currentTrack?.url && (currentTrack.url.includes('youtube.com') || currentTrack.url.includes('youtu.be')));
              if (isYT && window._audioYTPlayer) {
                try {
                  if (isPlaying) {
                    window._audioYTPlayer.pauseVideo?.();
                  } else {
                    window._audioYTPlayer.playVideo?.();
                  }
                } catch {}
              } else {
                if (isPlaying) pause(); else play();
              }
            }}
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={nextTrack}
            className="p-2 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            title="Next"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={maximizePlayer}
            className="p-2 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            title="Expand"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={stopAndClose}
            className="p-2 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Spacer to avoid content being covered by full controls */}
      {!isMinimized && currentTrack && <div className="h-32" />}
    </>
  );
};

export default GlobalMusicPlayer;
