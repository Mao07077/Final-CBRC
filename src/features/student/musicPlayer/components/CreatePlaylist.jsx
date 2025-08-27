import React, { useState } from 'react';
import { Plus, X, Link, Music, Globe, Lock } from 'lucide-react';
import useMusicPlayerStore from '../../../../store/student/musicPlayerStore';

const CreatePlaylist = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: true,
    tracks: []
  });
  
  const [newTrack, setNewTrack] = useState({
    url: '',
    title: '',
    artist: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const { createPlaylist, isCreatingPlaylist, playlistError } = useMusicPlayerStore();

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const addTrack = () => {
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

    const track = {
      id: `custom_${Date.now()}`,
      title: newTrack.title.trim(),
      artist: newTrack.artist.trim(),
      url: newTrack.url.trim(),
      duration: "0:00",
      source: newTrack.url.includes('youtube.com') || newTrack.url.includes('youtu.be') ? 'youtube' : 'custom'
    };

    setFormData(prev => ({
      ...prev,
      tracks: [...prev.tracks, track]
    }));

    setNewTrack({ url: '', title: '', artist: '' });
    setErrors({});
  };

  const removeTrack = (index) => {
    setFormData(prev => ({
      ...prev,
      tracks: prev.tracks.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Form submitted with data:", formData);
    
    const formErrors = {};
    
    if (!formData.name.trim()) {
      formErrors.name = 'Playlist name is required';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    console.log("Calling createPlaylist...");
    const success = await createPlaylist(formData);
    console.log("createPlaylist returned:", success);
    
    if (success) {
      setFormData({
        name: '',
        description: '',
        is_public: true,
        tracks: []
      });
      setErrors({});
      onSuccess?.();
      onClose();
    } else {
      console.log("Playlist creation failed, error:", playlistError);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      is_public: true,
      tracks: []
    });
    setNewTrack({ url: '', title: '', artist: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Music className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Create New Playlist</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {playlistError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{playlistError}</p>
            </div>
          )}

          {/* Playlist Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Playlist Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter playlist name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter playlist description"
                rows="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Privacy Setting
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    checked={formData.is_public}
                    onChange={() => setFormData(prev => ({ ...prev, is_public: true }))}
                    className="mr-2"
                  />
                  <Globe className="w-4 h-4 mr-1 text-green-600" />
                  <span className="text-sm">Public</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    checked={!formData.is_public}
                    onChange={() => setFormData(prev => ({ ...prev, is_public: false }))}
                    className="mr-2"
                  />
                  <Lock className="w-4 h-4 mr-1 text-gray-600" />
                  <span className="text-sm">Private</span>
                </label>
              </div>
            </div>
          </div>

          {/* Add Tracks Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Add Songs</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Song URL
                </label>
                <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 mb-2">
                    <strong>✅ Supported URLs:</strong> Both YouTube URLs and direct audio files are now supported!
                  </p>
                  <p className="text-sm text-green-700 mb-2">
                    <strong>YouTube:</strong> https://youtube.com/watch?v=... or https://youtu.be/...<br/>
                    <strong>Direct Audio:</strong> URLs ending in .mp3, .wav, .ogg, etc.
                  </p>
                  <div className="text-xs text-green-600 font-mono bg-green-100 p-2 rounded">
                    https://youtu.be/dQw4w9WgXcQ<br/>
                    https://example.com/song.mp3<br/>
                    https://archive.org/download/audio.wav
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTrack(prev => ({ 
                        ...prev, 
                        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
                        title: 'Bell Ringing',
                        artist: 'Sample Audio'
                      }))}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                    >
                      Try Sample Audio URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTrack(prev => ({ 
                        ...prev, 
                        url: 'https://youtu.be/dQw4w9WgXcQ',
                        title: 'Never Gonna Give You Up',
                        artist: 'Rick Astley'
                      }))}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                    >
                      Try YouTube URL
                    </button>
                  </div>
                </div>
                <div className="flex">
                  <div className="relative flex-1">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={newTrack.url}
                      onChange={(e) => setNewTrack(prev => ({ ...prev, url: e.target.value }))}
                      className={`w-full pl-10 pr-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.url ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="https://example.com/song.mp3 or https://youtube.com/..."
                    />
                  </div>
                </div>
                {errors.url && (
                  <p className="text-red-500 text-xs mt-1">{errors.url}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Song Title *
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
                    Artist *
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

              <button
                type="button"
                onClick={addTrack}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Song to Playlist</span>
              </button>
            </div>
          </div>

          {/* Track List */}
          {formData.tracks.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">
                Songs in Playlist ({formData.tracks.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formData.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-800">{track.title}</h5>
                      <p className="text-sm text-gray-600">{track.artist}</p>
                      <p className="text-xs text-gray-500 truncate">{track.url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTrack(index)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingPlaylist}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isCreatingPlaylist ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Playlist</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlaylist;
