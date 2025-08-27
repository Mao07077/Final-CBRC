import React, { useEffect, useState } from 'react';
import { Play, Pause, Plus, Trash2, Music, Globe, Lock, Link, X } from 'lucide-react';
import useMusicPlayerStore from '../../../../store/student/musicPlayerStore';

const UserPlaylists = () => {
  const [showAddTrack, setShowAddTrack] = useState(null);
  const [newTrack, setNewTrack] = useState({ url: '', title: '', artist: '' });
  const [errors, setErrors] = useState({});

  const {
    userPlaylists,
    activePlaylistId,
    activePlaylistType,
    currentTrackIndex,
    isPlaying,
    isLoading,
    error,
    playlistError,
    fetchUserPlaylists,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    selectTrack,
    play,
    pause,
    clearError
  } = useMusicPlayerStore();

  useEffect(() => {
    fetchUserPlaylists();
  }, []);

  const handlePlayPause = async (playlistId, trackIndex) => {
    const isCurrentTrack = activePlaylistId === playlistId && 
                          activePlaylistType === "user" && 
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
        await selectTrack(playlistId, trackIndex, "user");
      } catch (error) {
        console.error("Track selection error:", error);
      }
    }
  };

  const handleDeletePlaylist = async (playlistId, playlistName) => {
    if (window.confirm(`Are you sure you want to delete "${playlistName}"?`)) {
      await deletePlaylist(playlistId);
    }
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddTrack = async (playlistId) => {
    const newErrors = {};
    
    if (!newTrack.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!validateUrl(newTrack.url)) {
      newErrors.url = 'Please enter a valid URL';
    }
    
    if (!newTrack.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!newTrack.artist.trim()) {
      newErrors.artist = 'Artist is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const trackData = {
      url: newTrack.url.trim(),
      title: newTrack.title.trim(),
      artist: newTrack.artist.trim()
    };

    const success = await addTrackToPlaylist(playlistId, trackData);
    
    if (success) {
      setNewTrack({ url: '', title: '', artist: '' });
      setShowAddTrack(null);
      setErrors({});
    }
  };

  const handleRemoveTrack = async (playlistId, trackIndex, trackTitle) => {
    if (window.confirm(`Remove "${trackTitle}" from playlist?`)) {
      await removeTrackFromPlaylist(playlistId, trackIndex);
    }
  };

  const cancelAddTrack = () => {
    setShowAddTrack(null);
    setNewTrack({ url: '', title: '', artist: '' });
    setErrors({});
  };

  if (isLoading && userPlaylists.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading your playlists...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Music className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Your Playlists</h3>
        </div>
      </div>

      {playlistError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <p className="text-red-600 text-sm">{playlistError}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-800 text-sm font-medium">Audio Playback Error</p>
              <p className="text-orange-600 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-orange-400 hover:text-orange-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {userPlaylists.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Music className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No Custom Playlists Yet</h4>
          <p className="text-gray-500 mb-4">Create your first playlist to get started!</p>
        </div>
      ) : (
        userPlaylists.map((playlist) => (
          <div key={playlist._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Playlist Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-gray-800">{playlist.name}</h4>
                    {playlist.is_public ? (
                      <Globe className="w-4 h-4 text-green-600" title="Public playlist" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-600" title="Private playlist" />
                    )}
                  </div>
                  {playlist.description && (
                    <p className="text-sm text-gray-600 mb-2">{playlist.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {playlist.tracks?.length || 0} songs • Created {new Date(playlist.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAddTrack(showAddTrack === playlist._id ? null : playlist._id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Add song"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(playlist._id, playlist.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Add Track Form */}
            {showAddTrack === playlist._id && (
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Song URL (YouTube, SoundCloud, etc.)
                    </label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={newTrack.url}
                        onChange={(e) => setNewTrack(prev => ({ ...prev, url: e.target.value }))}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.url ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                    {errors.url && (
                      <p className="text-red-500 text-xs mt-1">{errors.url}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Song Title
                      </label>
                      <input
                        type="text"
                        value={newTrack.title}
                        onChange={(e) => setNewTrack(prev => ({ ...prev, title: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.title ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter song title"
                      />
                      {errors.title && (
                        <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Artist
                      </label>
                      <input
                        type="text"
                        value={newTrack.artist}
                        onChange={(e) => setNewTrack(prev => ({ ...prev, artist: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.artist ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter artist name"
                      />
                      {errors.artist && (
                        <p className="text-red-500 text-xs mt-1">{errors.artist}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={cancelAddTrack}
                      className="px-3 py-1.5 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddTrack(playlist._id)}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Adding...' : 'Add Song'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Track List */}
            <div className="divide-y divide-gray-100">
              {playlist.tracks && playlist.tracks.length > 0 ? (
                playlist.tracks.map((track, index) => {
                  const isCurrentTrack = activePlaylistId === playlist._id && 
                                       activePlaylistType === "user" && 
                                       currentTrackIndex === index;
                  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
                  
                  return (
                    <div
                      key={track.id || index}
                      className={`p-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        isCurrentTrack ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          onClick={() => handlePlayPause(playlist._id, index)}
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
                            {track.source === 'youtube' && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">YouTube</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{track.artist}</p>
                          {track.url && (
                            <p className="text-xs text-gray-400 truncate">{track.url}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{track.duration}</span>
                        <button
                          onClick={() => handleRemoveTrack(playlist._id, index, track.title)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                          title="Remove song"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Music className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No songs in this playlist</p>
                  <p className="text-xs text-gray-400">Click the + button to add some!</p>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default UserPlaylists;
