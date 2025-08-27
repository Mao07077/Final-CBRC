# Enhanced Music Player

A comprehensive music player for your study application with support for embedded songs, custom playlists, and YouTube integration.

## Features

### 🎵 Embedded Songs
- Pre-curated study music playlists
- Lofi beats, ambient soundscapes, and classical focus music
- Ready-to-use playlists for immediate playback

### 🎶 Custom Playlists
- Create personalized playlists
- Add songs from YouTube, SoundCloud, and other sources
- Public and private playlist options
- Full playlist management (add, remove, delete)

### 🎧 Advanced Player Controls
- Full playback controls (play, pause, next, previous)
- Volume control and mute functionality
- Progress bar with seeking capability
- Track information display with thumbnails

### 📱 User Interface
- Clean, modern design with responsive layout
- Tab-based navigation between embedded and custom playlists
- Fixed player controls at the bottom
- Real-time playback status updates

## Components

### Main Components
- **EnhancedMusicPlayer**: Main container component
- **EmbeddedSongs**: Displays pre-curated playlists
- **UserPlaylists**: Manages custom user playlists
- **CreatePlaylist**: Modal for creating new playlists
- **PlayerControls**: Audio playback controls and progress bar
- **Playlist**: Reusable playlist display component

### Store Management
- **musicPlayerStore**: Zustand store for state management
- Handles both embedded and user playlist data
- Manages audio playback state and controls
- API integration for playlist CRUD operations

## Usage

### Basic Implementation
```jsx
import EnhancedMusicPlayer from './features/student/musicPlayer/components/EnhancedMusicPlayer';

function App() {
  return (
    <div className="App">
      <EnhancedMusicPlayer />
    </div>
  );
}
```

### Adding the Page to Routes
```jsx
import MusicPlayerPage from './pages/student/MusicPlayerPage';

// In your router configuration
<Route path="/music" element={<MusicPlayerPage />} />
```

## API Endpoints

### Embedded Playlists
- `GET /api/music/playlists` - Get all embedded playlists
- `GET /api/music/playlist/{playlist_id}` - Get specific embedded playlist

### User Playlists
- `POST /api/music/user-playlists` - Create new playlist
- `GET /api/music/user-playlists/{user_id}` - Get user's playlists
- `GET /api/music/user-playlist/{playlist_id}` - Get specific playlist
- `PUT /api/music/user-playlist/{playlist_id}` - Update playlist
- `DELETE /api/music/user-playlist/{playlist_id}` - Delete playlist
- `POST /api/music/user-playlist/{playlist_id}/add-track` - Add track to playlist
- `DELETE /api/music/user-playlist/{playlist_id}/track/{track_index}` - Remove track

## Track Sources

### Supported URL Types
- **YouTube**: `https://www.youtube.com/watch?v=...` or `https://youtu.be/...`
- **Custom URLs**: Any direct audio URL
- **Embedded**: Pre-configured study music tracks

### YouTube Integration
- Automatic video ID extraction
- Thumbnail generation from YouTube
- Special YouTube badge display
- Note: For full YouTube playback, you may need to implement YouTube Player API

## Data Structure

### Track Object
```javascript
{
  id: "unique_track_id",
  title: "Song Title",
  artist: "Artist Name",
  url: "https://source-url.com",
  duration: "3:45",
  thumbnail: "https://thumbnail-url.com",
  source: "youtube" | "custom" | "embedded"
}
```

### Playlist Object
```javascript
{
  _id: "playlist_id",
  user_id: "user_id",
  name: "Playlist Name",
  description: "Optional description",
  is_public: true,
  tracks: [/* array of track objects */],
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z"
}
```

## Installation & Setup

1. **Backend Dependencies**
   ```bash
   pip install fastapi pydantic pymongo
   ```

2. **Frontend Dependencies**
   ```bash
   npm install lucide-react zustand
   ```

3. **Database Setup**
   - MongoDB collections: `playlists`, `user_playlists`
   - Ensure proper indexes for user_id and playlist queries

4. **Environment Configuration**
   - Update your MongoDB connection string
   - Ensure CORS settings allow frontend requests

## Customization

### Adding New Sources
To support additional music sources, extend the `extract_youtube_info` function in `music_routes.py`:

```python
def extract_source_info(url: str, source_type: str) -> Dict[str, Any]:
    if source_type == "spotify":
        # Implement Spotify URL parsing
        pass
    elif source_type == "soundcloud":
        # Implement SoundCloud URL parsing
        pass
    # ... additional sources
```

### Styling
The components use Tailwind CSS classes. Customize the appearance by modifying the className attributes in each component.

### Store Extensions
Extend the `musicPlayerStore` to add features like:
- Shuffle and repeat modes
- Equalizer settings
- Playback history
- Favorites management

## Troubleshooting

### Common Issues
1. **Audio not playing**: Check CORS settings and audio URL accessibility
2. **YouTube videos not loading**: Implement YouTube Player API for embedded playback
3. **Playlist not saving**: Verify user authentication and database permissions
4. **Controls not responding**: Check audio element initialization in the store
5. **Features not showing**: Ensure you're accessing `/student/music-player` route and that `StudyMusicPlayerPage.jsx` imports `EnhancedMusicPlayer`

### Where to Find Each Feature

#### 🎵 **Embedded Study Music**
- **Location**: "Study Music" tab (default tab)
- **What you'll see**: 3 pre-curated playlists:
  - "Lofi Beats for Focus" (3 songs)
  - "Ambient Soundscapes" (3 songs) 
  - "Classical for Focus" (2 songs)
- **File**: `EmbeddedSongs.jsx` displays these playlists

#### 📝 **Create New Playlist**
- **Location**: "My Playlists" tab → "Create Playlist" button (top right)
- **What opens**: Modal popup with form
- **Features**: Playlist name, description, public/private, add songs with URLs

#### 🎶 **List of Your Playlists**
- **Location**: "My Playlists" tab
- **What you'll see**: All your custom playlists with song counts
- **Actions**: Add songs, delete playlist, play songs

#### 🔗 **URL Input for Songs**
- **Location 1**: In "Create Playlist" modal → "Add Songs" section
- **Location 2**: In existing playlist → "Add Track" button
- **Supports**: YouTube, SoundCloud, any direct audio URL

#### 🎵 **List of Songs**
- **In Embedded Playlists**: Click any playlist in "Study Music" tab
- **In Your Playlists**: Songs shown directly in each playlist card
- **Player**: Bottom fixed player shows current song and controls

### Browser Compatibility
- Modern browsers support the HTML5 Audio API
- Some browsers require user interaction before audio can play
- Consider implementing autoplay policy handling

## Future Enhancements

- **Offline Support**: Cache audio files for offline playback
- **Social Features**: Share playlists with other users
- **Integration**: Connect with Spotify, Apple Music APIs
- **Analytics**: Track listening history and preferences
- **Mobile App**: React Native implementation
- **Voice Control**: Add voice commands for hands-free operation

## Contributing

When adding new features:
1. Update both frontend components and backend routes
2. Maintain consistent error handling patterns
3. Add proper TypeScript/PropTypes definitions
4. Test across different browsers and devices
5. Update this documentation

## License

This music player component is part of the CBRC Study Platform and follows the same licensing terms.
