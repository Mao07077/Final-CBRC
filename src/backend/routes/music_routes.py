from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
from database import db
from bson import ObjectId
from datetime import datetime
import re
import requests
import yt_dlp
import json

router = APIRouter()

# Collections
playlists_collection = db.playlists
user_playlists_collection = db.user_playlists

# Pydantic models
class Track(BaseModel):
    id: str
    title: str
    artist: str
    url: str
    duration: str
    thumbnail: Optional[str] = None
    source: str = "embedded"  # "embedded", "youtube", "custom"

class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    is_public: bool = True
    tracks: List[Track] = []

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class AddTrackRequest(BaseModel):
    url: str
    title: Optional[str] = None
    artist: Optional[str] = None

# Helper function to extract YouTube video info
def extract_youtube_info(url: str) -> Dict[str, Any]:
    """Extract basic info from YouTube URL"""
    youtube_patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/watch\?.*v=([^&\n?#]+)'
    ]
    
    video_id = None
    for pattern in youtube_patterns:
        match = re.search(pattern, url)
        if match:
            video_id = match.group(1)
            break
    
    if not video_id:
        return None
    
    try:
        # Use yt-dlp to extract video info and audio stream
        ydl_opts = {
            'format': 'bestaudio/best',
            'noplaylist': True,
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'ignoreerrors': False,
            'cookies': 'youtube_cookies.txt',  # Path to your cookies file in backend directory
        }
        
        print(f"Attempting to extract info for URL: {url}")
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if not info:
                print("No info extracted from yt-dlp")
                return None
            
            print(f"Video title: {info.get('title', 'Unknown')}")
            print(f"Available formats: {len(info.get('formats', []))}")
            
            # Find the best audio format
            audio_url = None
            if 'formats' in info and info['formats']:
                # Look for audio-only formats first
                audio_formats = [f for f in info['formats'] if f.get('acodec') != 'none' and f.get('vcodec') == 'none']
                print(f"Audio-only formats found: {len(audio_formats)}")
                
                if audio_formats:
                    # Get the best quality audio-only format (handle None values)
                    audio_formats.sort(key=lambda x: x.get('abr') or 0, reverse=True)
                    audio_url = audio_formats[0]['url']
                    print(f"Selected audio-only format with bitrate: {audio_formats[0].get('abr', 'unknown')}")
                else:
                    # Fallback to best format with audio
                    audio_formats = [f for f in info['formats'] if f.get('acodec') != 'none']
                    print(f"Audio formats (with video) found: {len(audio_formats)}")
                    if audio_formats:
                        audio_formats.sort(key=lambda x: x.get('abr') or 0, reverse=True)
                        audio_url = audio_formats[0]['url']
                        print(f"Selected audio format with bitrate: {audio_formats[0].get('abr', 'unknown')}")
            
            # Fallback to the main URL if no specific audio format found
            if not audio_url:
                audio_url = info.get('url')
                print("Using main URL as fallback")
            
            if not audio_url:
                print("No audio URL could be extracted")
                return None
            
            print(f"Final audio URL length: {len(audio_url) if audio_url else 0}")
            
            result = {
                'id': video_id,
                'title': info.get('title', 'Unknown Title'),
                'artist': info.get('uploader', 'YouTube'),
                'duration': str(info.get('duration', 0)) + 's',
                'thumbnail': info.get('thumbnail'),
                'audio_url': audio_url,
                'original_url': url
            }
            
            print(f"Successfully extracted info for: {result['title']}")
            return result
            
    except Exception as e:
        print(f"Error extracting YouTube info: {e}")
        import traceback
        traceback.print_exc()
        return None

# Fallback YouTube info extraction (basic)
def extract_youtube_info_basic(url: str) -> Dict[str, Any]:
    """Fallback method for YouTube info extraction"""
    youtube_patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/watch\?.*v=([^&\n?#]+)'
    ]
    
    video_id = None
    for pattern in youtube_patterns:
        match = re.search(pattern, url)
        if match:
            video_id = match.group(1)
            break
    
    if not video_id:
        raise ValueError("Invalid YouTube URL")
    
    # For now, return basic info. In production, you'd use YouTube API
    return {
        "id": video_id,
        "title": f"YouTube Video {video_id}",
        "artist": "YouTube",
        "url": url,
        "duration": "0:00",
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/default.jpg",
        "source": "youtube"
    }

# Sample music playlists for study - you can expand this with a music database later
STUDY_PLAYLISTS = {
    "lofi-beats": {
        "name": "Lofi Beats for Focus",
        "description": "Relaxing lofi beats to help you focus while studying",
        "tracks": [
            {
                "id": "lofi1",
                "title": "Midnight Study",
                "artist": "Chillhop Music",
                "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                "duration": "3:45"
            },
            {
                "id": "lofi2",
                "title": "Rainy Day Coding",
                "artist": "The Jazz Hop Cafe",
                "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                "duration": "4:20"
            },
            {
                "id": "lofi3",
                "title": "Coffee Shop Vibes",
                "artist": "Study Music Project",
                "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
                "duration": "3:30"
            }
        ]
    },
    "ambient-soundscapes": {
        "name": "Ambient Soundscapes",
        "description": "Nature sounds and ambient music for deep concentration",
        "tracks": [
            {
                "id": "amb1",
                "title": "Forest Awakening",
                "artist": "Nature Sounds Collective",
                "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                "duration": "5:15"
            },
            {
                "id": "amb2",
                "title": "Ocean Waves",
                "artist": "Relaxation Station",
                "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
                "duration": "4:45"
            },
            {
                "id": "amb3",
                "title": "Mountain Breeze",
                "artist": "Zen Garden Music",
                "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
                "duration": "6:00"
            }
        ]
    },
    "classical-focus": {
        "name": "Classical for Focus",
        "description": "Classical music pieces that enhance concentration",
        "tracks": [
            {
                "id": "cls1",
                "title": "Peaceful Piano",
                "artist": "Classical Study Music",
                "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
                "duration": "3:20"
            },
            {
                "id": "cls2",
                "title": "Gentle Strings",
                "artist": "Focus Orchestra",
                "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
                "duration": "4:10"
            }
        ]
    }
}

@router.get("/api/music/youtube-audio")
def get_youtube_audio_url(url: str):
    """Extract audio stream URL from YouTube video"""
    try:
        print(f"Received YouTube URL: {url}")
        
        # Clean and normalize the URL
        # Remove playlist parameters and other query params except video ID
        import urllib.parse
        
        # Parse the URL to clean it
        parsed_url = urllib.parse.urlparse(url)
        
        # Extract video ID from different YouTube URL formats
        video_id = None
        
        if 'youtu.be' in parsed_url.netloc:
            # Format: https://youtu.be/VIDEO_ID
            video_id = parsed_url.path.lstrip('/')
        elif 'youtube.com' in parsed_url.netloc:
            # Format: https://youtube.com/watch?v=VIDEO_ID
            query_params = urllib.parse.parse_qs(parsed_url.query)
            video_id = query_params.get('v', [None])[0]
        
        if not video_id:
            print(f"Could not extract video ID from URL: {url}")
            raise HTTPException(status_code=400, detail="Invalid YouTube URL format")
        
        # Clean the video ID (remove any additional parameters)
        video_id = video_id.split('&')[0].split('?')[0]
        print(f"Extracted video ID: {video_id}")
        
        # Create a clean YouTube URL
        clean_url = f"https://www.youtube.com/watch?v={video_id}"
        print(f"Clean YouTube URL: {clean_url}")
        
        # Validate the video ID format (YouTube video IDs are 11 characters)
        if len(video_id) != 11:
            print(f"Invalid video ID length: {len(video_id)}")
            raise HTTPException(status_code=400, detail="Invalid YouTube video ID")
        
        # Extract video info and audio stream
        video_info = extract_youtube_info(clean_url)
        if not video_info:
            print("Failed to extract video info")
            raise HTTPException(status_code=400, detail="Failed to extract video information. Video might be private, deleted, or region-restricted.")
        
        print(f"Successfully extracted video info: {video_info.get('title', 'Unknown')}")
        
        return {
            "success": True,
            "video_info": video_info,
            "audio_url": video_info.get('audio_url'),
            "title": video_info.get('title'),
            "artist": video_info.get('artist'),
            "duration": video_info.get('duration'),
            "thumbnail": video_info.get('thumbnail')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"YouTube audio extraction error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to extract audio from YouTube video: {str(e)}")

@router.get("/api/music/playlists")
def get_music_playlists():
    """Get all available study music playlists"""
    return {
        "success": True,
        "playlists": STUDY_PLAYLISTS
    }

@router.get("/api/music/playlist/{playlist_id}")
def get_playlist(playlist_id: str):
    """Get a specific playlist by ID"""
    if playlist_id not in STUDY_PLAYLISTS:
        return {
            "success": False,
            "message": "Playlist not found"
        }
    
    return {
        "success": True,
        "playlist": STUDY_PLAYLISTS[playlist_id]
    }

# User playlist endpoints
@router.post("/api/music/user-playlists")
def create_user_playlist(playlist: PlaylistCreate, user_id: str):
    """Create a new user playlist"""
    try:
        playlist_data = {
            "user_id": user_id,
            "name": playlist.name,
            "description": playlist.description,
            "is_public": playlist.is_public,
            "tracks": [track.dict() for track in playlist.tracks],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = user_playlists_collection.insert_one(playlist_data)
        
        return {
            "success": True,
            "playlist_id": str(result.inserted_id),
            "message": "Playlist created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/music/user-playlists/{user_id}")
def get_user_playlists(user_id: str):
    """Get all playlists for a specific user"""
    try:
        playlists = list(user_playlists_collection.find({"user_id": user_id}))
        
        # Convert ObjectId to string
        for playlist in playlists:
            playlist["_id"] = str(playlist["_id"])
        
        return {
            "success": True,
            "playlists": playlists
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/music/user-playlist/{playlist_id}")
def get_user_playlist(playlist_id: str):
    """Get a specific user playlist"""
    try:
        if not ObjectId.is_valid(playlist_id):
            raise HTTPException(status_code=400, detail="Invalid playlist ID")
            
        playlist = user_playlists_collection.find_one({"_id": ObjectId(playlist_id)})
        
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        playlist["_id"] = str(playlist["_id"])
        
        return {
            "success": True,
            "playlist": playlist
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api/music/user-playlist/{playlist_id}")
def update_user_playlist(playlist_id: str, playlist_update: PlaylistUpdate):
    """Update a user playlist"""
    try:
        if not ObjectId.is_valid(playlist_id):
            raise HTTPException(status_code=400, detail="Invalid playlist ID")
        
        update_data = {k: v for k, v in playlist_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = user_playlists_collection.update_one(
            {"_id": ObjectId(playlist_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        return {
            "success": True,
            "message": "Playlist updated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/music/user-playlist/{playlist_id}")
def delete_user_playlist(playlist_id: str):
    """Delete a user playlist"""
    try:
        if not ObjectId.is_valid(playlist_id):
            raise HTTPException(status_code=400, detail="Invalid playlist ID")
        
        result = user_playlists_collection.delete_one({"_id": ObjectId(playlist_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        return {
            "success": True,
            "message": "Playlist deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/music/user-playlist/{playlist_id}/add-track")
def add_track_to_playlist(playlist_id: str, track_request: AddTrackRequest):
    """Add a track to a user playlist"""
    import logging
    logger = logging.getLogger("music_routes")
    try:
        logger.info(f"Add track request: playlist_id={playlist_id}, track_request={track_request}")
        if not ObjectId.is_valid(playlist_id):
            logger.error(f"Invalid playlist ID: {playlist_id}")
            raise HTTPException(status_code=400, detail="Invalid playlist ID")

        playlist = user_playlists_collection.find_one({"_id": ObjectId(playlist_id)})
        if not playlist:
            logger.error(f"Playlist not found: {playlist_id}")
            raise HTTPException(status_code=404, detail="Playlist not found")

        track_info = None
        url = track_request.url.strip()
        logger.info(f"Track URL: {url}")

        if "youtube.com" in url or "youtu.be" in url:
            track_info = extract_youtube_info(url)
            if track_info is None:
                logger.error("YouTube extraction failed: track_info is None")
                raise HTTPException(status_code=400, detail="YouTube extraction failed: Unable to extract info. This may require authentication/cookies.")
            track_info["source"] = "youtube"
            logger.info(f"Extracted YouTube track info: {track_info}")
        else:
            track_info = {
                "id": f"custom_{len(playlist.get('tracks', []))}_{int(datetime.utcnow().timestamp())}",
                "title": track_request.title or "Custom Track",
                "artist": track_request.artist or "Unknown Artist",
                "url": url,
                "duration": "0:00",
                "thumbnail": None,
                "source": "custom"
            }
            logger.info(f"Custom track info: {track_info}")

        result = user_playlists_collection.update_one(
            {"_id": ObjectId(playlist_id)},
            {
                "$push": {"tracks": track_info},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        logger.info(f"MongoDB update result: {result.raw_result}")

        return {
            "success": True,
            "message": "Track added successfully",
            "track": track_info
        }
    except HTTPException as e:
        # Propagate HTTPException so FastAPI returns the correct status
        raise
    except Exception as e:
        logger.error(f"Error in add_track_to_playlist: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/music/user-playlist/{playlist_id}/track/{track_index}")
def remove_track_from_playlist(playlist_id: str, track_index: int):
    """Remove a track from a user playlist"""
    try:
        if not ObjectId.is_valid(playlist_id):
            raise HTTPException(status_code=400, detail="Invalid playlist ID")
        
        # Get playlist to check track exists
        playlist = user_playlists_collection.find_one({"_id": ObjectId(playlist_id)})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        tracks = playlist.get("tracks", [])
        if track_index < 0 or track_index >= len(tracks):
            raise HTTPException(status_code=400, detail="Invalid track index")
        
        # Remove track
        tracks.pop(track_index)
        
        result = user_playlists_collection.update_one(
            {"_id": ObjectId(playlist_id)},
            {
                "$set": {
                    "tracks": tracks,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "success": True,
            "message": "Track removed successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
