from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class SignupData(BaseModel):
    firstname: str
    middlename: Optional[str] = None
    lastname: str
    suffix: Optional[str] = None
    birthdate: str
    gender: str
    email: str
    password: str
    program: str
    id_number: str
    role: str

class LoginRequest(BaseModel):
    idNumber: str
    password: str

class ForgotPasswordData(BaseModel):
    id_number: str
    email: str

class ConfirmResetCodeData(BaseModel):
    id_number: str
    email: str
    reset_code: str

class ResetPasswordData(BaseModel):
    id_number: str
    reset_code: str
    new_password: str

class ProfileData(BaseModel):
    firstname: str
    lastname: str
    id_number: str
    program: str
    hoursActivity: int = 0
    profileImageUrl: str = ""

class Question(BaseModel):
    question: str
    options: List[str]
    correctAnswer: str

class QuestionWithAnswers(BaseModel):
    question: str
    options: List[str]
    correctAnswer: str
    wrongAnswers: List[str] = []

class PreTestResponse(BaseModel):
    pre_test_id: str
    module_id: str
    title: str
    questions: List[QuestionWithAnswers]

class PostTestResponse(BaseModel):
    post_test_id: str
    module_id: str
    title: str
    questions: List[QuestionWithAnswers]

class PostTestRequest(BaseModel):
    title: str
    questions: List[Question]

class PostTestSubmission(BaseModel):
    answers: Dict[str, str]
    user_id: str
    time_spent: int

class ScoreData(BaseModel):
    module_id: str
    user_id: str
    correct: int
    incorrect: int
    total_questions: int
    user_answers: Dict[str, str]
    time_spent: int
    test_type: str = "posttest"

class UserSettings(BaseModel):
    firstname: Optional[str] = None
    middlename: Optional[str] = None
    lastname: Optional[str] = None
    suffix: Optional[str] = None
    birthdate: Optional[str] = None
    email: Optional[str] = None
    program: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class Module(BaseModel):
    id: str
    title: str
    image_url: str
    instructor_id: str
    file: str

class Account(BaseModel):
    id: str
    profile: str
    accountNo: str
    name: str
    role: str

class AccountResponse(BaseModel):
    id: str
    profile: str
    accountNo: str
    name: str
    role: str

class AccountResponses(BaseModel):
    id: str
    profile: str
    studentNo: str
    name: str
    role: str
    program: str

class ParaphraseRequest(BaseModel):
    input: str

class ParaphraseResponse(BaseModel):
    paraphrased: str

class SurveyData(BaseModel):
    id_number: str
    categoryScores: Dict[str, int]
    top3Habits: List[str]
    surveyCompleted: bool

class Message(BaseModel):
    sender: str
    receiver: str
    text: str

class Instructor(BaseModel):
    id_number: str
    firstname: str
    lastname: str
    email: str

class ScheduleEntry(BaseModel):
    id_number: str
    schedule: List[List[str]]
    times: List[str]

class NoteModel(BaseModel):
    title: str
    content: str

class SaveNoteRequest(BaseModel):
    id_number: str
    note: NoteModel

class UpdateNoteRequest(BaseModel):
    id_number: str
    index: int
    note: NoteModel

class DeleteNoteRequest(BaseModel):
    id_number: str
    index: int

class Flashcard(BaseModel):
    module_id: str
    content: str
    answer: str
    unique: str

class IntroData(BaseModel):
    header: str
    subHeader: str
    introImage: Optional[str]

class NewsData(BaseModel):
    content: str
    newsImage: Optional[str] = None

class CourseImageData(BaseModel):
    images: List[Optional[str]]

class ChatMessage(BaseModel):
    call_id: str
    sender_id: str
    sender_name: str
    message: str
    timestamp: datetime

class PostData(BaseModel):
    intro: Optional[IntroData] = None
    news: Optional[NewsData] = None
    courseImages: Optional[CourseImageData] = None

class ReportCreate(BaseModel):
    id_number: str
    title: str
    content: str

class ReportStatusUpdate(BaseModel):
    status: str

class ReportResponse(BaseModel):
    id: str
    student: str
    issue: str
    date: str
    status: str
    content: Optional[str] = None
    screenshot: Optional[str] = None