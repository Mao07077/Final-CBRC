from fastapi import Body

from fastapi import APIRouter, HTTPException
from models import PostTestRequest, PostTestSubmission, PreTestResponse, PostTestResponse, ScoreData, QuestionWithAnswers
from database import modules_collection, pre_test_collection, post_test_collection, scores_collection
from bson import ObjectId
from datetime import datetime
from utils import paraphrase_all_questions_batch, paraphrase_all_questions, paraphrase_all_questions_batch_groq
import os
import asyncio

router = APIRouter()

@router.post("/createposttest/{module_id}")
async def create_posttest(module_id: str, post_test_request: PostTestRequest):
    if not ObjectId.is_valid(module_id):
        raise HTTPException(status_code=400, detail="Invalid module ID format")
    module = modules_collection.find_one({"_id": ObjectId(module_id)})
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    if post_test_collection.find_one({"module_id": module_id}):
        raise HTTPException(status_code=400, detail="Post-test already exists")
    if not post_test_request.questions:
        raise HTTPException(status_code=400, detail="At least one question required")
    post_test_data = {
        "module_id": module_id,
        "title": post_test_request.title,
        "questions": [
            {
                "question": q.question,
                "options": q.options,
                "correctAnswer": q.correctAnswer
            } for q in post_test_request.questions
        ],
        "created_at": datetime.utcnow()
    }
    post_test_result = post_test_collection.insert_one(post_test_data)
    pre_test_data = {
        "module_id": module_id,
        "title": f"Pre-Test for {post_test_request.title}",
        "questions": post_test_data["questions"],
        "created_at": datetime.utcnow()
    }
    pre_test_result = pre_test_collection.insert_one(pre_test_data)
    return {
        "success": True,
        "post_test_id": str(post_test_result.inserted_id),
        "pre_test_id": str(pre_test_result.inserted_id)
    }

@router.get("/api/pre-test/{module_id}", response_model=PreTestResponse)
def get_pre_test(module_id: str):
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from utils import randomize_quiz_questions
    
    pre_test = pre_test_collection.find_one({"module_id": module_id})
    if not pre_test:
        raise HTTPException(status_code=404, detail="Pre-test not found")
    
    # Apply randomization to questions order and answer choices
    pre_test_data = randomize_quiz_questions(pre_test)
    
    questions_with_answers = []
    for question in pre_test_data['questions']:
        wrong_answers = [opt for opt in question['options'] if opt != question['correctAnswer']]
        questions_with_answers.append(QuestionWithAnswers(
            question=question['question'],
            options=question['options'],
            correctAnswer=question['correctAnswer'],
            wrongAnswers=wrong_answers
        ))
    return PreTestResponse(
        pre_test_id=str(pre_test_data['_id']),
        module_id=pre_test_data['module_id'],
        title=pre_test_data['title'],
        questions=questions_with_answers
    )

@router.post("/api/pre-test/submit/{module_id}")
def submit_pre_test(module_id: str, submission: PostTestSubmission):
    # Block duplicate attempt per user/module for pre-test
    existing = scores_collection.find_one({
        "module_id": module_id,
        "user_id": submission.user_id,
        "test_type": "pretest"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Pre-test already submitted for this module.")
    pre_test = pre_test_collection.find_one({"module_id": module_id})
    if not pre_test:
        raise HTTPException(status_code=404, detail="Pre-test not found for this module")
    correct_answers = {str(index): question["correctAnswer"] for index, question in enumerate(pre_test["questions"])}
    correct_count = 0
    incorrect_count = 0
    for question, user_answer in submission.answers.items():
        correct_answer = correct_answers.get(question)
        if correct_answer and user_answer == correct_answer:
            correct_count += 1
        elif user_answer:
            incorrect_count += 1
    score_data = {
        "module_id": module_id,
        "user_id": submission.user_id,
        "correct": correct_count,
        "incorrect": incorrect_count,
        "total_questions": len(pre_test["questions"]),
        "user_answers": submission.answers,
        "test_type": "pretest",
        "time_spent": submission.time_spent,
        "submitted_at": datetime.utcnow()
    }
    result = scores_collection.insert_one(score_data)
    print(f"[DEBUG] Pre-test score saved: {score_data}, Inserted ID: {result.inserted_id}")
    return {
        "success": True,
        "message": "Pre-test submitted successfully!",
        "correct": correct_count,
        "incorrect": incorrect_count,
        "total_questions": len(pre_test["questions"])
    }

@router.get("/api/post-test/{module_id}", response_model=PostTestResponse)
async def get_post_test(module_id: str):
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from utils import paraphrase_all_questions_batch, randomize_quiz_questions
    import logging
    logger = logging.getLogger(__name__)
    
    # Get the pre-test for this module (we always use pre-test as base)
    pre_test = pre_test_collection.find_one({"module_id": module_id})
    if not pre_test:
        raise HTTPException(status_code=404, detail="Pre-test not found for this module")
    
    # Always generate fresh paraphrased questions for post-test
    logger.info(f"Generating paraphrased post-test for module: {module_id}")
    
    try:
        # First, paraphrase the questions
        # Prefer Groq if API key is configured, otherwise use existing paraphrase functions
        if os.getenv('GROQ_API_KEY'):
            paraphrased_questions = await paraphrase_all_questions_batch_groq(pre_test['questions'])
        else:
            paraphrased_questions = await paraphrase_all_questions_batch(pre_test['questions'])
        
        # Create post-test data structure
        post_test_data = {
            'title': f"Post-Test: {pre_test.get('title', 'Module Test').replace('Pre-Test', '').replace(':', '').strip()}",
            'questions': paraphrased_questions,
            'module_id': module_id,
            '_id': pre_test['_id']
        }
        
        logger.info(f"Successfully generated paraphrased post-test with {len(post_test_data['questions'])} questions")
        
    except Exception as e:
        logger.error(f"Error generating paraphrased post-test: {e}")
        # Fallback: use original pre-test
        post_test_data = {
            'title': f"Post-Test: {pre_test.get('title', 'Module Test').replace('Pre-Test', '').replace(':', '').strip()}",
            'questions': pre_test['questions'],
            'module_id': module_id,
            '_id': pre_test['_id']
        }

    # Apply randomization to both questions order and answer choices
    post_test_data = randomize_quiz_questions(post_test_data)

    # Convert to response format
    questions_with_answers = []
    for question in post_test_data['questions']:
        wrong_answers = [opt for opt in question['options'] if opt != question['correctAnswer']]
        questions_with_answers.append(QuestionWithAnswers(
            question=question['question'],
            options=question['options'],
            correctAnswer=question['correctAnswer'],
            wrongAnswers=wrong_answers
        ))
    
    return PostTestResponse(
        post_test_id=str(post_test_data['_id']),
        module_id=post_test_data['module_id'],
        title=post_test_data['title'],
        questions=questions_with_answers
    )

@router.post("/api/post-test/submit/{module_id}")
async def submit_post_test(module_id: str, submission: PostTestSubmission):
    # Block duplicate attempt per user/module for post-test
    existing = scores_collection.find_one({
        "module_id": module_id,
        "user_id": submission.user_id,
        "test_type": "posttest"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Post-test already submitted for this module.")
    # For post-test submission, we need to get the correct answers from the pre-test
    # since the post-test is dynamically generated with paraphrased questions
    pre_test = pre_test_collection.find_one({"module_id": module_id})
    if not pre_test:
        raise HTTPException(status_code=404, detail="Pre-test not found for this module")
    
    # Use pre-test correct answers since post-test has the same answers, just paraphrased questions
    correct_answers = {str(index): question["correctAnswer"] for index, question in enumerate(pre_test["questions"])}
    
    correct_count = 0
    incorrect_count = 0
    for question, user_answer in submission.answers.items():
        correct_answer = correct_answers.get(question)
        if correct_answer and user_answer == correct_answer:
            correct_count += 1
        elif user_answer:
            incorrect_count += 1
    
    score_data = ScoreData(
        module_id=module_id,
        user_id=submission.user_id,
        correct=correct_count,
        incorrect=incorrect_count,
        total_questions=len(pre_test["questions"]),
        user_answers=submission.answers,
        time_spent=submission.time_spent,
        test_type="posttest"
    )
    doc = score_data.dict()
    doc["submitted_at"] = datetime.utcnow()
    scores_collection.insert_one(doc)
    
    return {
        "success": True,
        "message": "Post-test submitted successfully!",
        "correct": correct_count,
        "incorrect": incorrect_count,
        "total_questions": len(pre_test["questions"])
    }

@router.get("/api/module-status/{module_id}/{user_id}")
def get_module_status(module_id: str, user_id: str):
    pre_test_score = scores_collection.find_one({
        "module_id": module_id,
        "user_id": user_id,
        "test_type": "pretest"
    })
    post_test_score = scores_collection.find_one({
        "module_id": module_id,
        "user_id": user_id,
        "test_type": "posttest"
    })
    module_completed = bool(pre_test_score) and bool(post_test_score)
    # Compute whether all modules are completed (both pre and post)
    total_modules = modules_collection.count_documents({})
    user_scores = scores_collection.find({"user_id": user_id})
    per_module = {}
    for s in user_scores:
        mid = s.get("module_id")
        if not mid:
            continue
        entry = per_module.setdefault(mid, {"pre": False, "post": False})
        if s.get("test_type") == "pretest":
            entry["pre"] = True
        elif s.get("test_type") == "posttest":
            entry["post"] = True
    completed_count = sum(1 for v in per_module.values() if v["pre"] and v["post"])
    all_modules_completed = total_modules > 0 and (completed_count >= total_modules)
    return {
        "pre_test_completed": bool(pre_test_score),
        "post_test_completed": bool(post_test_score),
        "module_completed": module_completed,
        "all_modules_completed": all_modules_completed,
        "retake_allowed": False
    }

@router.get("/api/all-modules-completed/{user_id}")
def all_modules_completed_status(user_id: str):
    total_modules = modules_collection.count_documents({})
    user_scores = scores_collection.find({"user_id": user_id})
    per_module = {}
    for s in user_scores:
        mid = s.get("module_id")
        if not mid:
            continue
        entry = per_module.setdefault(mid, {"pre": False, "post": False})
        if s.get("test_type") == "pretest":
            entry["pre"] = True
        elif s.get("test_type") == "posttest":
            entry["post"] = True
    completed_count = sum(1 for v in per_module.values() if v["pre"] and v["post"])
    return {
        "totalModules": total_modules,
        "completedModules": completed_count,
        "allModulesCompleted": total_modules > 0 and (completed_count >= total_modules)
    }

@router.post("/api/reset-all-modules/{user_id}")
def reset_all_modules(user_id: str):
    # Only allow reset if all modules completed
    status = all_modules_completed_status(user_id)
    if not status.get("allModulesCompleted"):
        raise HTTPException(status_code=400, detail="Cannot reset: Not all modules are completed yet.")
    res = scores_collection.delete_many({"user_id": user_id})
    return {"success": True, "deleted": res.deleted_count}

@router.get("/api/students/{user_id}/module-attempts")
def get_module_attempts(user_id: str):
    # Build attempts summary per module
    modules = list(modules_collection.find({}))
    attempts = []
    from bson import ObjectId as _ObjectId
    import datetime as _dt
    def _score_percent(doc):
        try:
            return (doc.get("correct", 0) / max(doc.get("total_questions", 1), 1)) * 100
        except Exception:
            return 0.0
    for m in modules:
        mid = str(m.get("_id"))
        title = m.get("title", f"Module {mid}")
        pre_scores = list(scores_collection.find({"user_id": user_id, "module_id": mid, "test_type": "pretest"}))
        post_scores = list(scores_collection.find({"user_id": user_id, "module_id": mid, "test_type": "posttest"}))
        def _key(doc):
            ts = doc.get("submitted_at") or doc.get("created_at") or doc.get("date_taken") or doc.get("createdAt")
            if isinstance(ts, _dt.datetime):
                return ts
            if isinstance(ts, str):
                try:
                    return _dt.datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except Exception:
                    return doc.get("_id").generation_time if isinstance(doc.get("_id"), _ObjectId) else _dt.datetime.min
            return doc.get("_id").generation_time if isinstance(doc.get("_id"), _ObjectId) else _dt.datetime.min
        pre_scores_sorted = sorted(pre_scores, key=_key)
        post_scores_sorted = sorted(post_scores, key=_key)
        pre_attempts = len(pre_scores_sorted)
        post_attempts = len(post_scores_sorted)
        last_pre = pre_scores_sorted[-1] if pre_scores_sorted else None
        last_post = post_scores_sorted[-1] if post_scores_sorted else None
        best_pre = max(((_score_percent(d), d) for d in pre_scores_sorted), default=(0, None))[1]
        best_post = max(((_score_percent(d), d) for d in post_scores_sorted), default=(0, None))[1]
        attempts.append({
            "moduleId": mid,
            "title": title,
            "preAttempts": pre_attempts,
            "postAttempts": post_attempts,
            "lastPrePercent": round(_score_percent(last_pre), 2) if last_pre else 0,
            "lastPostPercent": round(_score_percent(last_post), 2) if last_post else 0,
            "bestPrePercent": round(_score_percent(best_pre), 2) if best_pre else 0,
            "bestPostPercent": round(_score_percent(best_post), 2) if best_post else 0,
        })
    return {"moduleAttempts": attempts}

@router.get("/api/students/{user_id}/module-attempts-history")
def get_module_attempts_history(user_id: str):
    """Return per-module attempt history with date and percent for both pre and post tests."""
    import datetime as _dt
    # Build module title map
    modules = list(modules_collection.find({}))
    title_map = {str(m.get("_id")): m.get("title", f"Module {m.get('_id')}") for m in modules}
    # Fetch all scores for user
    scores = list(scores_collection.find({"user_id": user_id}))
    def _percent(s):
        try:
            return (s.get("correct", 0) / max(s.get("total_questions", 1), 1)) * 100
        except Exception:
            return 0.0
    def _dt_key(s):
        ts = s.get("submitted_at") or s.get("created_at") or s.get("date_taken") or s.get("createdAt")
        if isinstance(ts, _dt.datetime):
            return ts
        if isinstance(ts, str):
            try:
                return _dt.datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                pass
        try:
            return s.get("_id").generation_time
        except Exception:
            return _dt.datetime.min
    grouped = {}
    for s in scores:
        mid = s.get("module_id")
        if not mid:
            continue
        arr = grouped.setdefault(mid, [])
        arr.append({
            "type": s.get("test_type"),
            "submittedAt": (_dt_key(s).isoformat()),
            "percent": round(_percent(s), 2)
        })
    # Sort each module's attempts by date
    for mid, arr in grouped.items():
        arr.sort(key=lambda x: x["submittedAt"])  # ISO sorts lexicographically by date correctly
    # Format response
    result = []
    for mid, arr in grouped.items():
        result.append({
            "moduleId": mid,
            "title": title_map.get(mid, f"Module {mid}"),
            "attempts": arr
        })
    return {"history": result}
@router.put("/api/pre-test/{module_id}")
def update_pre_test(module_id: str, data: dict = Body(...)):
    pre_test = pre_test_collection.find_one({"module_id": module_id})
    if not pre_test:
        raise HTTPException(status_code=404, detail="Pre-test not found")
    update_data = {}
    if "title" in data:
        update_data["title"] = data["title"]
    if "questions" in data:
        update_data["questions"] = data["questions"]
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    pre_test_collection.update_one({"module_id": module_id}, {"$set": update_data})
    return {"success": True, "message": "Pre-test updated successfully!"}