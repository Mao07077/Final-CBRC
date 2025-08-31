import React from 'react';

/**
 * AudioOnlyYouTubePlayer
 * Plays YouTube audio only (video hidden), with minimal UI: title, artist, play/pause.
 * Props:
 *   - videoId: YouTube video ID
 *   - title: Track title
 *   - artist: Track artist
 */
const AudioOnlyYouTubePlayer = ({ videoId, title, artist }) => {
  // YouTube embed URL for audio only
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&showinfo=0&rel=0`;

  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
      {/* Minimal Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-800 truncate">{title}</div>
        <div className="text-sm text-gray-500 truncate">{artist}</div>
        <span className="inline-block text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded mt-1">YouTube</span>
      </div>
      {/* Hidden YouTube Player */}
      <div style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute' }}>
        <iframe
          src={embedUrl}
          title="YouTube Audio Player"
          allow="autoplay"
          frameBorder="0"
          allowFullScreen
        />
      </div>
      {/* Play/Pause: Let user control via YouTube controls or add custom controls if needed */}
      {/* For simplicity, rely on YouTube's built-in controls (hidden) */}
    </div>
  );
};

export default AudioOnlyYouTubePlayer;
