
import React, { useRef, useEffect, useState } from 'react';

const AudioOnlyYouTubePlayer = ({ videoId, title, artist }) => {
  useEffect(() => {
    console.log('[AudioOnlyYouTubePlayer] videoId:', videoId);
    // Auto-play when videoId changes (track selected)
    if (window._audioYTPlayer && videoId) {
      setTimeout(() => {
        try {
          window._audioYTPlayer.playVideo();
        } catch (e) {
          console.error('Auto-play error:', e);
        }
      }, 500); // slight delay to ensure player is ready
    }
  }, [videoId]);
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [apiReady, setApiReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => setApiReady(true);
  }, []);

  // Create player when API is ready
  useEffect(() => {
    if (!apiReady || !playerRef.current) return;
    const player = new window.YT.Player(playerRef.current, {
      height: '1',
      width: '1',
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
      },
      events: {
        onStateChange: (event) => {
          console.log('[AudioOnlyYouTubePlayer] YouTube Player State:', event.data);
          if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
          if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) setIsPlaying(false);
        },
        onError: (event) => {
          console.error('[AudioOnlyYouTubePlayer] YouTube Player Error:', event);
        }
      },
    });
    // Save player instance for controls
    window._audioYTPlayer = player;
    return () => {
      if (player && player.destroy) player.destroy();
      window._audioYTPlayer = null;
    };
  }, [apiReady, videoId]);

  // Play/Pause controls
  const handlePlay = () => {
    if (window._audioYTPlayer) window._audioYTPlayer.playVideo();
  };
  const handlePause = () => {
    if (window._audioYTPlayer) window._audioYTPlayer.pauseVideo();
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-800 truncate">{title}</div>
        <div className="text-sm text-gray-500 truncate">{artist}</div>
        <span className="inline-block text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded mt-1">YouTube</span>
      </div>
      {/* Visible YouTube Player for debugging */}
      <div style={{ width: 400, height: 225 }}>
        <div ref={el => {
          playerRef.current = el;
          if (el && el.parentElement) {
            const parent = el.parentElement;
            const style = window.getComputedStyle(parent);
            console.log('[AudioOnlyYouTubePlayer] Parent container:', parent);
            console.log('[AudioOnlyYouTubePlayer] Parent computed style:', style);
          }
        }} />
      </div>
      {/* Custom Play/Pause Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handlePlay}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={isPlaying}
        >Play</button>
        <button
          onClick={handlePause}
          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          disabled={!isPlaying}
        >Pause</button>
      </div>
    </div>
  );
};

export default AudioOnlyYouTubePlayer;
