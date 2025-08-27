import React from 'react';
import { Play, Pause, Music, Clock, Globe, Lock } from 'lucide-react';

const Playlist = ({ 
  playlist, 
  isPlaying, 
  currentTrackIndex, 
  activePlaylistId,
  activePlaylistType,
  playlistType = "embedded",
  onTrackSelect,
  onPlayPause 
}) => {
  if (!playlist) return null;

  const isActivePlaylist = activePlaylistId === (playlist._id || playlist.id) && 
                          activePlaylistType === playlistType;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Playlist Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-800">{playlist.name}</h4>
              {playlist.is_public !== undefined && (
                playlist.is_public ? (
                  <Globe className="w-4 h-4 text-green-600" title="Public playlist" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-600" title="Private playlist" />
                )
              )}
            </div>
            {playlist.description && (
              <p className="text-sm text-gray-600 mb-2">{playlist.description}</p>
            )}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center">
                <Music className="w-3 h-3 mr-1" />
                {playlist.tracks?.length || 0} songs
              </span>
              {playlist.created_at && (
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Created {new Date(playlist.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="divide-y divide-gray-100">
        {playlist.tracks && playlist.tracks.length > 0 ? (
          playlist.tracks.map((track, index) => {
            const isCurrentTrack = isActivePlaylist && currentTrackIndex === index;
            const isCurrentlyPlaying = isCurrentTrack && isPlaying;
            
            return (
              <div
                key={track.id || index}
                className={`p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                  isCurrentTrack ? 'bg-blue-50' : ''
                }`}
                onClick={() => onTrackSelect?.(playlist._id || playlist.id, index, playlistType)}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayPause?.(playlist._id || playlist.id, index, playlistType);
                    }}
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
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h5 className={`font-medium truncate ${
                        isCurrentTrack ? 'text-blue-700' : 'text-gray-800'
                      }`}>
                        {track.title}
                      </h5>
                      {track.source && track.source !== 'embedded' && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          track.source === 'youtube' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {track.source}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{track.artist}</p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 flex-shrink-0">
                  {track.duration}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Music className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No songs in this playlist</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Playlist;
