# Script to migrate playlist tracks: set source to 'youtube' for tracks with YouTube URLs

import pymongo
from bson import ObjectId

MONGO_URI = "mongodb+srv://Admin:CBRCLP@cluster0.xjrey3k.mongodb.net/"
DB_NAME = "cbrc"
COLLECTION_NAME = "user_playlists"

def is_youtube_url(url):
    return url and ("youtube.com" in url or "youtu.be" in url)

def migrate():
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    playlists = db[COLLECTION_NAME]
    
    updated_count = 0
    for playlist in playlists.find({"tracks": {"$exists": True, "$ne": []}}):
        tracks = playlist["tracks"]
        changed = False
        for track in tracks:
            if is_youtube_url(track.get("url")) and track.get("source") == "custom":
                track["source"] = "youtube"
                changed = True
        if changed:
            playlists.update_one({"_id": playlist["_id"]}, {"$set": {"tracks": tracks}})
            updated_count += 1
    print(f"Migration complete. Updated {updated_count} playlists.")

if __name__ == "__main__":
    migrate()
