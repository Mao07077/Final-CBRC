import { create } from "zustand";
import apiClient from "../../api/axios";
import useAuthStore from "../authStore";

const useMusicPlayerStore = create((set, get) => ({
  // Embedded playlists (default)
  playlists: {},
  
  // User custom playlists
  userPlaylists: [],
  
  // Current playback state
  activePlaylistId: null,
  activePlaylistType: "embedded", // "embedded" or "user"
  currentTrackIndex: 0,
  isPlaying: false,
  audio: null,
  audioPromise: null, // Track the current play promise
  isLoading: false,
  error: null,
  showPlayer: true, // Controls if the bottom player is visible
  
  // Playlist management
  isCreatingPlaylist: false,
  playlistError: null,
  lastTrackChangeTime: 0, // Throttle track changes

  fetchPlaylists: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/api/music/playlists');
      if (response.data.success) {
        const playlists = response.data.playlists;
        const firstPlaylistId = Object.keys(playlists)[0];
        const firstTrackUrl = firstPlaylistId && playlists[firstPlaylistId].tracks.length > 0 
          ? playlists[firstPlaylistId].tracks[0].url 
          : null;

        set({ 
          playlists,
          activePlaylistId: firstPlaylistId,
          activePlaylistType: "embedded",
          audio: firstTrackUrl && typeof Audio !== "undefined" ? new Audio(firstTrackUrl) : null,
          isLoading: false 
        });
      } else {
        throw new Error("Failed to fetch playlists");
      }
    } catch (error) {
      console.error("Music playlist fetch error:", error);
      set({ 
        playlists: {},
        activePlaylistId: null,
        audio: null,
        isLoading: false, 
        error: "Failed to load music playlists. Please try again later.",
        activePlaylistType: "embedded"
      });
    }
  },

  fetchUserPlaylists: async () => {
    const { userData: user } = useAuthStore.getState();
    
    // For development/testing, create a mock user if no user is logged in
    const currentUser = user || { id_number: 'test_user_123', firstname: 'Test', lastname: 'User' };
    
    if (!currentUser || !currentUser.id_number) return;

    set({ isLoading: true, playlistError: null });
    try {
      const response = await apiClient.get(`/api/music/user-playlists/${currentUser.id_number}`);
      if (response.data.success) {
        set({ 
          userPlaylists: response.data.playlists,
          isLoading: false 
        });
      } else {
        throw new Error("Failed to fetch user playlists");
      }
    } catch (error) {
      console.error("User playlist fetch error:", error);
      set({ 
        userPlaylists: [],
        isLoading: false, 
        playlistError: "Failed to load your playlists. Please try again later." 
      });
    }
  },

  createPlaylist: async (playlistData) => {
    const { userData: user } = useAuthStore.getState();
    console.log("Creating playlist with user:", user);
    console.log("Playlist data:", playlistData);
    
    // For development/testing, create a mock user if no user is logged in
    const currentUser = user || { id_number: 'test_user_123', firstname: 'Test', lastname: 'User' };
    
    if (!currentUser || !currentUser.id_number) {
      console.error("No user found for playlist creation");
      set({ 
        isCreatingPlaylist: false,
        playlistError: "You must be logged in to create playlists" 
      });
      return false;
    }

    set({ isCreatingPlaylist: true, playlistError: null });
    try {
      console.log("Making API call to create playlist...");
      const response = await apiClient.post('/api/music/user-playlists', playlistData, {
        params: { user_id: currentUser.id_number }
      });
      
      console.log("API response:", response.data);
      
      if (response.data.success) {
        // Refresh user playlists
        await get().fetchUserPlaylists();
        set({ isCreatingPlaylist: false });
        return true;
      } else {
        throw new Error(response.data.message || "Failed to create playlist");
      }
    } catch (error) {
      console.error("Create playlist error:", error);
      console.error("Error response:", error.response?.data);
      set({ 
        isCreatingPlaylist: false,
        playlistError: error.response?.data?.detail || error.message || "Failed to create playlist" 
      });
      return false;
    }
  },

  deletePlaylist: async (playlistId) => {
    set({ isLoading: true, playlistError: null });
    try {
      const response = await apiClient.delete(`/api/music/user-playlist/${playlistId}`);
      
      if (response.data.success) {
        // If the deleted playlist was active, clear it
        const state = get();
        if (state.activePlaylistId === playlistId && state.activePlaylistType === "user") {
          // Clean up audio properly
          if (state.audioPromise) {
            await state.audioPromise.catch(() => {});
          }
          if (state.audio) {
            state.audio.pause();
          }
          set({
            activePlaylistId: null,
            activePlaylistType: "embedded",
            currentTrackIndex: 0,
            isPlaying: false,
            audio: null,
            audioPromise: null
          });
        }
        
        // Refresh user playlists
        await get().fetchUserPlaylists();
        set({ isLoading: false });
        return true;
      } else {
        throw new Error(response.data.message || "Failed to delete playlist");
      }
    } catch (error) {
      console.error("Delete playlist error:", error);
      set({ 
        isLoading: false,
        playlistError: error.response?.data?.detail || "Failed to delete playlist" 
      });
      return false;
    }
  },

  addTrackToPlaylist: async (playlistId, trackData) => {
    set({ isLoading: true, playlistError: null });
    try {
      const response = await apiClient.post(`/api/music/user-playlist/${playlistId}/add-track`, trackData);
      
      if (response.data.success) {
        // Refresh user playlists
        await get().fetchUserPlaylists();
        set({ isLoading: false });
        return response.data.track;
      } else {
        throw new Error(response.data.message || "Failed to add track");
      }
    } catch (error) {
      console.error("Add track error:", error);
      set({ 
        isLoading: false,
        playlistError: error.response?.data?.detail || "Failed to add track" 
      });
      return null;
    }
  },

  removeTrackFromPlaylist: async (playlistId, trackIndex) => {
    set({ isLoading: true, playlistError: null });
    try {
      const response = await apiClient.delete(`/api/music/user-playlist/${playlistId}/track/${trackIndex}`);
      
      if (response.data.success) {
        // Refresh user playlists
        await get().fetchUserPlaylists();
        
        // If the removed track was currently playing, handle it
        const state = get();
        if (state.activePlaylistId === playlistId && 
            state.activePlaylistType === "user" && 
            state.currentTrackIndex === trackIndex) {
          // Clean up audio properly
          if (state.audioPromise) {
            await state.audioPromise.catch(() => {});
          }
          if (state.audio) {
            state.audio.pause();
          }
          set({
            currentTrackIndex: 0,
            isPlaying: false,
            audioPromise: null
          });
        }
        
        set({ isLoading: false });
        return true;
      } else {
        throw new Error(response.data.message || "Failed to remove track");
      }
    } catch (error) {
      console.error("Remove track error:", error);
      set({ 
        isLoading: false,
        playlistError: error.response?.data?.detail || "Failed to remove track" 
      });
      return false;
    }
  },

  play: async () => {
    const { audio, audioPromise } = get();
    if (!audio) return;

    try {
      // Cancel the previous play promise if it exists
      if (audioPromise) {
        await audioPromise.catch(() => {}); // Ignore errors from cancelled promise
      }

      // Create new play promise
      const playPromise = audio.play();
      set({ audioPromise: playPromise, isPlaying: true });
      
      await playPromise;
      set({ audioPromise: null });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Play error:", error);
        set({ error: "Failed to play audio", isPlaying: false, audioPromise: null });
      }
      set({ audioPromise: null });
    }
  },

  pause: async () => {
    const { audio, audioPromise } = get();
    if (!audio) return;

    try {
      // Wait for any pending play promise to resolve/reject before pausing
      if (audioPromise) {
        await audioPromise.catch(() => {}); // Ignore errors from cancelled promise
      }
      
      audio.pause();
      set({ isPlaying: false, audioPromise: null });
    } catch (error) {
      console.error("Pause error:", error);
      set({ isPlaying: false, audioPromise: null });
    }
  },

  selectTrack: async (playlistId, trackIndex, playlistType = "embedded") => {
    console.log("🎯 selectTrack called with:", { playlistId, trackIndex, playlistType });
    
    // Throttle track changes to prevent rapid switching
    const now = Date.now();
    const timeSinceLastChange = now - get().lastTrackChangeTime;
    if (timeSinceLastChange < 500) { // 500ms throttle
      console.log("⏱️ Throttled - too soon since last change:", timeSinceLastChange + "ms");
      return;
    }
    set({ lastTrackChangeTime: now });

    const { audio, audioPromise, playlists, userPlaylists } = get();
    
    // Cancel any pending audio promise and pause current audio
    if (audioPromise) {
      await audioPromise.catch(() => {}); // Ignore errors from cancelled promise
    }
    if (audio) {
      audio.pause();
    }
    
    // Get the appropriate playlist
    let playlist;
    if (playlistType === "embedded") {
      playlist = playlists[playlistId];
    } else {
      playlist = userPlaylists.find(p => p._id === playlistId);
    }
    
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
      console.error("Playlist or tracks not found");
      return;
    }
    
    const newTrack = playlist.tracks[trackIndex];
    if (!newTrack) {
      console.error("Track not found at index:", trackIndex, "in playlist:", playlist);
      return;
    }
    
    console.log("=== Attempting to play track ===");
    console.log("Track data:", JSON.stringify(newTrack, null, 2));
    console.log("Track URL:", newTrack.url);
    console.log("Track audio_url:", newTrack.audio_url);
    console.log("Track source:", newTrack.source);
    console.log("Has URL?", !!newTrack.url);
    console.log("Has audio_url?", !!newTrack.audio_url);
    console.log("Is YouTube?", newTrack.source === "youtube" || (newTrack.url && (newTrack.url.includes('youtube.com') || newTrack.url.includes('youtu.be'))));
    
    // Check if it's a YouTube URL and extract audio stream
    const isYouTubeTrack = newTrack.source === "youtube" || (newTrack.url && (newTrack.url.includes('youtube.com') || newTrack.url.includes('youtu.be')));
    const alreadyProcessed = isYouTubeTrack && newTrack.audio_url && !newTrack.url;
    
    // Use audio_url if url is not available (for already processed YouTube tracks)
    let audioUrl = newTrack.url || newTrack.audio_url;
    
    console.log("=== Track Analysis ===");
    console.log("isYouTubeTrack:", isYouTubeTrack);
    console.log("alreadyProcessed:", alreadyProcessed);
    console.log("Final audioUrl:", audioUrl);
    
    if (isYouTubeTrack && !alreadyProcessed) {
      if (!newTrack.url) {
        console.error("❌ YouTube URL is missing or undefined");
        set({ 
          error: "Invalid YouTube URL - URL is missing", 
          isPlaying: false, 
          audioPromise: null 
        });
        return;
      }
      
      console.log("🎵 YouTube URL detected, extracting audio stream for:", newTrack.url);
      set({ error: "Loading YouTube audio...", isPlaying: false });
      
      try {
        const response = await apiClient.get('/api/music/youtube-audio', {
          params: { url: newTrack.url }
        });
        
        if (response.data.success && response.data.audio_url) {
          audioUrl = response.data.audio_url;
          console.log("✓ YouTube audio stream extracted:", audioUrl);
          set({ error: null });
        } else {
          throw new Error("Failed to extract YouTube audio stream");
        }
      } catch (error) {
        console.error("YouTube audio extraction failed:", error);
        console.error("Request details:", {
          url: newTrack.url,
          params: { url: newTrack.url },
          track: newTrack
        });
        set({ 
          error: "Failed to load YouTube audio. The video might be restricted or unavailable.", 
          isPlaying: false, 
          audioPromise: null 
        });
        return;
      }
    } else if (alreadyProcessed) {
      console.log("✅ Using already processed YouTube audio_url:", newTrack.audio_url);
      set({ error: null });
    } else {
      // Validate regular URL format or use audio_url for processed tracks
      if (!audioUrl || (!audioUrl.startsWith('http') && !audioUrl.startsWith('blob:'))) {
        console.error("Invalid track URL:", newTrack.url);
        set({ 
          error: "Invalid track URL. Please use a valid HTTP/HTTPS URL to an audio file.", 
          isPlaying: false, 
          audioPromise: null 
        });
        return;
      }
      
      // Check if URL looks like an audio file
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
      const hasAudioExtension = audioExtensions.some(ext => newTrack.url.toLowerCase().includes(ext));
      
      if (!hasAudioExtension) {
        console.warn("URL doesn't appear to be a direct audio file:", newTrack.url);
        set({ 
          error: "This URL doesn't appear to be a direct audio file. Please use URLs ending in .mp3, .wav, .ogg, or other audio formats.", 
          isPlaying: false, 
          audioPromise: null 
        });
        return;
      }
    }
    
    console.log("✓ URL validation passed, creating Audio element...");
    console.log("Final audio URL:", audioUrl);
    
    // Create new audio instance
    const newAudio = new Audio(audioUrl);
    
    // Set up audio event listeners
    newAudio.addEventListener('ended', () => {
      get().nextTrack();
    });
    
    newAudio.addEventListener('error', (e) => {
      console.error("Audio playback error:", e);
      console.error("Failed URL:", audioUrl);
      console.error("Audio error details:", {
        error: e.target.error,
        networkState: e.target.networkState,
        readyState: e.target.readyState
      });
      
      let errorMessage = "Failed to play this track";
      if (e.target.error) {
        switch (e.target.error.code) {
          case 1: // MEDIA_ERR_ABORTED
            errorMessage = "Audio playback was aborted";
            break;
          case 2: // MEDIA_ERR_NETWORK
            errorMessage = "Network error while loading audio";
            break;
          case 3: // MEDIA_ERR_DECODE
            errorMessage = "Audio file is corrupted or not supported";
            break;
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            errorMessage = "Audio format not supported or file not found";
            break;
        }
      }
      
      set({ error: errorMessage, isPlaying: false, audioPromise: null });
    });

    newAudio.addEventListener('loadstart', () => {
      set({ error: null });
    });
    
    // Update state first
    set({
      activePlaylistId: playlistId,
      activePlaylistType: playlistType,
      currentTrackIndex: trackIndex,
      isPlaying: false,
      audio: newAudio,
      audioPromise: null,
      error: null,
      showPlayer: true
    });

    // Try to play the new track
    try {
      const playPromise = newAudio.play();
      set({ audioPromise: playPromise, isPlaying: true });
      await playPromise;
      set({ audioPromise: null });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Play error:", error);
        set({ error: "Failed to play this track", isPlaying: false });
      }
      set({ audioPromise: null });
    }
  },

  nextTrack: async () => {
    const { activePlaylistId, activePlaylistType, currentTrackIndex, playlists, userPlaylists } = get();
    
    let playlist;
    if (activePlaylistType === "embedded") {
      playlist = playlists[activePlaylistId];
    } else {
      playlist = userPlaylists.find(p => p._id === activePlaylistId);
    }
    
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % playlist.tracks.length;
    await get().selectTrack(activePlaylistId, nextIndex, activePlaylistType);
  },

  prevTrack: async () => {
    const { activePlaylistId, activePlaylistType, currentTrackIndex, playlists, userPlaylists } = get();
    
    let playlist;
    if (activePlaylistType === "embedded") {
      playlist = playlists[activePlaylistId];
    } else {
      playlist = userPlaylists.find(p => p._id === activePlaylistId);
    }
    
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) return;
    
    const prevIndex = (currentTrackIndex - 1 + playlist.tracks.length) % playlist.tracks.length;
    await get().selectTrack(activePlaylistId, prevIndex, activePlaylistType);
  },

  clearError: () => {
    set({ error: null, playlistError: null });
  },

  // Player visibility controls
  hidePlayer: () => 
    set((state) => ({ 
      ...state, 
      showPlayer: false 
    })),

  showPlayerWidget: () =>
    set((state) => ({
      ...state,
      showPlayer: true
    })),

  // Cleanup function for when components unmount
  cleanup: async () => {
    const { audio, audioPromise } = get();
    
    if (audioPromise) {
      await audioPromise.catch(() => {}); // Ignore errors from cancelled promise
    }
    
    if (audio) {
      audio.pause();
      // Remove all event listeners
      audio.removeEventListener('ended', () => {});
      audio.removeEventListener('error', () => {});
      audio.removeEventListener('loadstart', () => {});
    }
    
    set({ 
      audio: null, 
      audioPromise: null, 
      isPlaying: false,
      currentTime: 0,
      duration: 0
    });
  },
}));

export default useMusicPlayerStore;
