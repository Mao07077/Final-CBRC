
from fastapi import APIRouter, HTTPException
from database import posts_collection

router = APIRouter()

@router.get("/api/landing-page")
async def get_landing_page_data():
    """Get landing page data, including posts and Cloudinary images"""
    # Default fallback data
    data = {
        "intro": {
            "header": "Unlock Your Ultimate Review Experience",
            "subHeader": "Your all-in-one platform for interactive learning, progress tracking, and community collaboration. Let's start your journey to success.",
            "introImage": None,
        },
        "about": {
            "header": "Dr. Carl Balita Review Center",
            "content": "CBRC, popularly known as the Dr. Carl E. Balita Review Center, stands as the biggest, most awarded, and the only ISO 9001-2015 certified business of its kind.",
        },
        "news": {
            "header": "Latest News",
            "title": "Announcement",
            "content": "CBRC is proud to announce the launch of its new online learning platform, designed to make education accessible to everyone!",
            "newsImage": None,
        },
        "featuredCourses": [],
        "posts": [],
    }
    try:
        post = posts_collection.find_one()
        if post:
            # Intro
            if "intro" in post:
                data["intro"].update(post["intro"])
            # News
            if "news" in post:
                data["news"].update(post["news"])
            # Featured Courses images
            if "courseImages" in post and "images" in post["courseImages"]:
                images = post["courseImages"]["images"]
                course_titles = [
                    "Nursing Licensure Examination",
                    "Criminology Licensure Examination",
                    "Professional Teacher Licensure Examination",
                ]
                course_labels = ["Top Rated", "Recommended", "Most Popular"]
                data["featuredCourses"] = [
                    {"title": t, "label": l, "image": img}
                    for t, l, img in zip(course_titles, course_labels, images)
                ]
            # Posts array (if present)
            if "posts" in post:
                data["posts"] = post["posts"]
        return data
    except Exception as e:
        return data
