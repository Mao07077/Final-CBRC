import React from 'react';
import ReactPlayer from 'react-player';

const AudioOnlyYouTubePlayer = ({ url, playing, onEnded, volume = 1 }) => {
  return (
    <div style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute' }}>
      <ReactPlayer
        url={url}
        playing={playing}
        controls={false}
        volume={volume}
        onEnded={onEnded}
        width={0}
        height={0}
        config={{
          youtube: {
            playerVars: {
              autoplay: 1,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
            },
          },
        }}
      />
    </div>
  );
};

export default AudioOnlyYouTubePlayer;
