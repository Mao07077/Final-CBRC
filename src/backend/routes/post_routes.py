
from fastapi import APIRouter, HTTPException, Form, File, UploadFile, Body
from database import posts_collection
from config import logger
import os
import shutil
from typing import Optional
from fastapi import UploadFile, File
from bson import ObjectId

router = APIRouter()
@router.get("/api/admin/posts")
async def get_admin_posts():
    posts = list(posts_collection.find({}))
    for post in posts:
        post["_id"] = str(post["_id"])
    return posts



# Admin: Create a new post (accept FormData, all fields optional)

from typing import Optional



@router.post("/api/admin/posts")
async def create_admin_post(
    title: Optional[str] = Form("") ,
    content: Optional[str] = Form("") ,
    image: Optional[UploadFile] = File(None),
    images: Optional[list] = File(None)
):
    # Accept either a single 'image' file or multiple 'images' files
    print(f"DEBUG POST /api/admin/posts: title={title!r}, content={content!r}, image={image}, images={images}")
    image_url = ""
    images_urls = []
    import cloudinary.uploader, io
    # handle single image file
    if image:
        image_bytes = await image.read()
        result = cloudinary.uploader.upload(io.BytesIO(image_bytes), folder="post_images")
        image_url = result["secure_url"]
        images_urls.append(image_url)
    # handle multiple images (if provided)
    if images:
        # FastAPI may provide a list of UploadFile objects here
        try:
            for f in images:
                if f is None:
                    continue
                img_bytes = await f.read()
                r = cloudinary.uploader.upload(io.BytesIO(img_bytes), folder="post_images")
                images_urls.append(r.get("secure_url"))
        except Exception:
            # if 'images' is not iterable (e.g., a single UploadFile), handle it
            if hasattr(images, 'file') or hasattr(images, 'filename'):
                img_bytes = await images.read()
                r = cloudinary.uploader.upload(io.BytesIO(img_bytes), folder="post_images")
                images_urls.append(r.get("secure_url"))

    post_data = {
        "title": title or "",
        "content": content or "",
        "createdAt": None,
        # keep legacy single 'image' field for backward compatibility
        "image": images_urls[0] if images_urls else image_url,
        # store all images in an array
        "images": images_urls if images_urls else ([] if not image_url else [image_url]),
    }
    from datetime import datetime
    post_data["createdAt"] = datetime.utcnow()
    result = posts_collection.insert_one(post_data)
    post_data["_id"] = str(result.inserted_id)
    return post_data


# Admin: Update a post (accept FormData, all fields optional)
@router.put("/api/admin/posts/{post_id}")
async def update_admin_post(
    post_id: str,
    title: str = Form(None),
    content: str = Form(None),
    image_url: str = Form(None),
    image_file: Optional[UploadFile] = File(None),
    images: Optional[list] = File(None)
):
    update_data = {}
    import cloudinary.uploader, io
    images_urls = []

    # upload new image_file if present
    if image_file:
        img_bytes = await image_file.read()
        r = cloudinary.uploader.upload(io.BytesIO(img_bytes), folder="post_images")
        images_urls.append(r.get("secure_url"))

    # upload multiple images if present
    if images:
        try:
            for f in images:
                if f is None:
                    continue
                img_bytes = await f.read()
                r = cloudinary.uploader.upload(io.BytesIO(img_bytes), folder="post_images")
                images_urls.append(r.get("secure_url"))
        except Exception:
            if hasattr(images, 'file') or hasattr(images, 'filename'):
                img_bytes = await images.read()
                r = cloudinary.uploader.upload(io.BytesIO(img_bytes), folder="post_images")
                images_urls.append(r.get("secure_url"))

    if title is not None:
        update_data["title"] = title
    if content is not None:
        update_data["content"] = content
    # if explicit image_url provided as form string, use it
    if image_url is not None:
        update_data["image"] = image_url
        # also set images array if missing
        update_data.setdefault("images", [image_url])
    # if we uploaded files, save them
    if images_urls:
        update_data["images"] = images_urls
        update_data["image"] = images_urls[0]

    if not update_data:
        return {"success": False, "error": "No fields to update"}
    result = posts_collection.update_one({"_id": ObjectId(post_id)}, {"$set": update_data})
    if result.modified_count > 0:
        return {"success": True}
    else:
        return {"success": False, "error": "Post not found"}

# Admin: Delete a post
@router.delete("/api/admin/posts/{post_id}")
async def delete_admin_post(post_id: str):
    result = posts_collection.delete_one({"_id": ObjectId(post_id)})
    if result.deleted_count > 0:
        return {"success": True}
    else:
        return {"success": False, "error": "Post not found"}

@router.post("/api/save_post")
async def save_post(
    intro_header: Optional[str] = Form(None),
    intro_subHeader: Optional[str] = Form(None),
    intro_image: Optional[UploadFile] = File(None),
    news_content: Optional[str] = Form(None),
    news_image: Optional[UploadFile] = File(None),
    course_image_1: Optional[UploadFile] = File(None),
    course_image_2: Optional[UploadFile] = File(None),
    course_image_3: Optional[UploadFile] = File(None)
):
    import cloudinary.uploader, io
    try:
        post_data = {}
        if intro_header and intro_subHeader:
            intro_data = {"header": intro_header, "subHeader": intro_subHeader}
            if intro_image:
                intro_bytes = await intro_image.read()
                intro_result = cloudinary.uploader.upload(io.BytesIO(intro_bytes), folder="post_images")
                intro_data["introImage"] = intro_result["secure_url"]
            post_data["intro"] = intro_data
        if news_content:
            news_data = {"content": news_content}
            if news_image:
                news_bytes = await news_image.read()
                news_result = cloudinary.uploader.upload(io.BytesIO(news_bytes), folder="post_images")
                news_data["newsImage"] = news_result["secure_url"]
            post_data["news"] = news_data
        course_images = []
        for img, idx in [(course_image_1, 1), (course_image_2, 2), (course_image_3, 3)]:
            if img:
                img_bytes = await img.read()
                img_result = cloudinary.uploader.upload(io.BytesIO(img_bytes), folder="post_images")
                course_images.append(img_result["secure_url"])
            else:
                course_images.append(None)
        post_data["courseImages"] = {"images": course_images}
        existing_post = posts_collection.find_one()
        if existing_post:
            posts_collection.update_one({}, {"$set": post_data})
        else:
            posts_collection.insert_one(post_data)
        return {"success": True, "message": "Post saved successfully!"}
    except Exception as e:
        logger.error(f"Error saving post: {e}")
        raise HTTPException(status_code=500, detail="Failed to save post")

@router.get("/api/get_post")
async def get_post():
    try:
        post = posts_collection.find_one()
        if not post:
            return {
                "success": True,
                "data": {
                    "intro": {"header": "", "subHeader": "", "introImage": None},
                    "news": {"content": "", "newsImage": None},
                    "courseImages": {"images": [None, None, None]}
                }
            }
        post["_id"] = str(post["_id"])
        return {"success": True, "data": post}
    except Exception as e:
        logger.error(f"Error fetching post: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch post")