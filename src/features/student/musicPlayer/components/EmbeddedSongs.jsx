import React, { useEffect } from 'react';
import { Play, Pause, Music } from 'lucide-react';
import useMusicPlayerStore from '../../../../store/student/musicPlayerStore';

const EmbeddedSongs = () => {
  const {
    playlists,
    activePlaylistId,
    activePlaylistType,
    currentTrackIndex,
    isPlaying,
    isLoading,
    error,
    fetchPlaylists,
    selectTrack,
    play,
    pause
  } = useMusicPlayerStore();

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handlePlayPause = async (playlistId, trackIndex) => {
    const isCurrentTrack = activePlaylistId === playlistId && 
                          activePlaylistType === "embedded" && 
                          currentTrackIndex === trackIndex;
    
    if (isCurrentTrack) {
      // If it's the current track, just toggle play/pause
      try {
        if (isPlaying) {
          await pause();
        } else {
          await play();
        }
      } catch (error) {
        console.error("Play/pause error:", error);
      }
    } else {
      // If it's a different track, select it (this will automatically start playing)
      try {
        await selectTrack(playlistId, trackIndex, "embedded");
      } catch (error) {
        console.error("Track selection error:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading music playlists...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Music className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Study Music Playlists</h3>
      </div>
      
      {Object.entries(playlists).map(([playlistId, playlist]) => (
        <div key={playlistId} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-semibold text-gray-800 mb-1">{playlist.name}</h4>
            <p className="text-sm text-gray-600">{playlist.description}</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {playlist.tracks.map((track, index) => {
              const isCurrentTrack = activePlaylistId === playlistId && 
                                   activePlaylistType === "embedded" && 
                                   currentTrackIndex === index;
              const isCurrentlyPlaying = isCurrentTrack && isPlaying;
              
              return (
                <div
                  key={track.id}
                  className={`p-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    isCurrentTrack ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <button
                      onClick={() => handlePlayPause(playlistId, index)}
                      className={`p-2 rounded-full transition-colors ${
                        isCurrentTrack
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h5 className={`font-medium ${
                        isCurrentTrack ? 'text-blue-700' : 'text-gray-800'
                      }`}>
                        {track.title}
                      </h5>
                      <p className="text-sm text-gray-500">{track.artist}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {track.duration}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {Object.keys(playlists).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No playlists available</p>
        </div>
      )}
    </div>
  );
};

export default EmbeddedSongs;
