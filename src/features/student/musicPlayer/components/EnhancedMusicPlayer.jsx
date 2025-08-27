import React, { useState, useEffect } from 'react';
import { Plus, Music, Headphones } from 'lucide-react';
import useMusicPlayerStore from '../../../../store/student/musicPlayerStore';
import EmbeddedSongs from './EmbeddedSongs';
import UserPlaylists from './UserPlaylists';
import CreatePlaylist from './CreatePlaylist';
import PlayerControls from './PlayerControls';

const EnhancedMusicPlayer = () => {
  const [activeTab, setActiveTab] = useState('embedded');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

  const {
    fetchPlaylists,
    fetchUserPlaylists,
    clearError,
    showPlayer
  } = useMusicPlayerStore();

  useEffect(() => {
    fetchPlaylists();
    fetchUserPlaylists();
  }, []);

  const tabs = [
    {
      id: 'embedded',
      label: 'Study Music',
      icon: Headphones,
      description: 'Curated playlists for focus'
    },
    {
      id: 'custom',
      label: 'My Playlists',
      icon: Music,
      description: 'Your custom playlists'
    }
  ];

  const handleCreatePlaylistSuccess = () => {
    // Refresh user playlists after creation
    fetchUserPlaylists();
  };

  return (
    <div className="max-w-6xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Music Player</h1>
              <p className="text-gray-600 mt-1">Listen to music while you study</p>
            </div>
            
            {activeTab === 'custom' && (
              <button
                onClick={() => setShowCreatePlaylist(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Playlist</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    clearError();
                  }}
                  className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'embedded' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Study Music Collections</h2>
              <p className="text-gray-600">
                Carefully curated playlists designed to help you focus and be productive while studying.
              </p>
            </div>
            <EmbeddedSongs />
          </div>
        )}

        {activeTab === 'custom' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Your Custom Playlists</h2>
              <p className="text-gray-600">
                Create personalized playlists with your favorite songs from YouTube, SoundCloud, and other sources.
              </p>
            </div>
            <UserPlaylists />
          </div>
        )}
      </div>

      {/* Fixed Player Controls at Bottom */}
      {showPlayer && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <PlayerControls />
        </div>
      )}

      {/* Add bottom padding to content to account for fixed player */}
      {showPlayer && <div className="h-32"></div>}

      {/* Create Playlist Modal */}
      <CreatePlaylist
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onSuccess={handleCreatePlaylistSuccess}
      />
    </div>
  );
};

export default EnhancedMusicPlayer;
