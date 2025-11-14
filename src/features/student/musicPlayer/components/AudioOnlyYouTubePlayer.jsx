
import React, { useRef, useEffect, useState } from 'react';
import useMusicPlayerStore from '../../../../store/student/musicPlayerStore';

const AudioOnlyYouTubePlayer = ({ videoId, title, artist }) => {
  const { nextTrack, repeatMode } = useMusicPlayerStore();

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
      height: '0',
      width: '0',
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
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            try { useMusicPlayerStore.setState({ isPlaying: true }); } catch {}
          }
          if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
            try { useMusicPlayerStore.setState({ isPlaying: false }); } catch {}
          }
          if (event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            try { useMusicPlayerStore.setState({ isPlaying: false }); } catch {}
            // Respect repeat-one setting: restart the same video
            try {
              const state = useMusicPlayerStore.getState();
              const mode = state?.repeatMode || repeatMode;
              if (mode === 'one') {
                // Seek to start and play again
                try { window._audioYTPlayer?.seekTo?.(0, true); } catch {}
                try { window._audioYTPlayer?.playVideo?.(); } catch {}
              } else {
                nextTrack();
              }
            } catch (e) {
              console.error('Next track error (YouTube ended):', e);
            }
          }
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
    <div className="sr-only">
      {/* Hidden audio-only YouTube iframe */}
      <div ref={(el) => { playerRef.current = el; }} />
      {/* Title/artist exposed via PlayerControls */}
    </div>
  );
};

export default AudioOnlyYouTubePlayer;
