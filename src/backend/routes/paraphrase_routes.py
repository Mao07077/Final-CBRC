



from fastapi import APIRouter, HTTPException, Body

router = APIRouter()

@router.post("/api/paraphrase")
def paraphrase_question(data: dict = Body(...)):
    raise HTTPException(status_code=501, detail="Paraphrasing is now handled by the frontend using Hugging Face API. Please update your frontend code.")
