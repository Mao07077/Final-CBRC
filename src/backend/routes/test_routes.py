from fastapi import Body
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
from fastapi import APIRouter, HTTPException
from models import PostTestRequest, PostTestSubmission, PreTestResponse, PostTestResponse, ScoreData, QuestionWithAnswers
from database import modules_collection, pre_test_collection, post_test_collection, scores_collection
from bson import ObjectId
from datetime import datetime
from utils import paraphrase_all_questions_batch, paraphrase_all_questions
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
    scores_collection.insert_one(score_data.dict())
    
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
    return {
        "pre_test_completed": bool(pre_test_score),
        "post_test_completed": bool(post_test_score)
    }