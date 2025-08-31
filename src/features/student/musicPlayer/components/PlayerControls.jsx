import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, X } from 'lucide-react';
import useMusicPlayerStore from '../../../../store/student/musicPlayerStore';
import AudioOnlyYouTubePlayer from './AudioOnlyYouTubePlayer';

const PlayerControls = () => {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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

  useEffect(() => {
    if (!audio) return;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
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

  useEffect(() => {
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [audio, volume, isMuted]);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSeek = (e) => {
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack || !showPlayer) {
    return null;
  }

  // Only show one player at a time
  const isYouTubeUrl = currentTrack.url && (currentTrack.url.includes('youtube.com') || currentTrack.url.includes('youtu.be'));
  let videoId = null;
  if ((currentTrack.source === 'youtube' || isYouTubeUrl) && currentTrack.url) {
    try {
      const urlObj = new URL(currentTrack.url);
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.replace('/', '').split('?')[0];
      } else if (urlObj.searchParams.has('v')) {
        videoId = urlObj.searchParams.get('v');
      } else {
        const match = currentTrack.url.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
        if (match) videoId = match[1];
      }
    } catch {
      const match = currentTrack.url.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
      if (match) videoId = match[1];
    }
    if (!videoId && currentTrack.audio_url) {
      const m2 = currentTrack.audio_url.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
      if (m2) videoId = m2[1];
    }
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
        {videoId ? (
          <AudioOnlyYouTubePlayer
            videoId={videoId}
            title={currentTrack.title}
            artist={currentTrack.artist}
          />
        ) : (
          <audio
            src={currentTrack.url || currentTrack.audio_url}
            controls
            autoPlay
            style={{ width: '100%' }}
            onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
            onLoadedMetadata={e => setDuration(e.target.duration)}
            onEnded={nextTrack}
            volume={isMuted ? 0 : volume}
          />
        )}
        {/* Playback Controls (for local audio) */}
        {!videoId && (
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
        )}
      </div>
    </div>
  );
};

export default PlayerControls;
