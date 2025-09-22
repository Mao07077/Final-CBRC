import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moduleService from "../../services/moduleService";
import paraphraseService from "../../services/paraphraseService";
import useAuthStore from "../../store/authStore";

const PostTestPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuthStore();
  const [postTest, setPostTest] = useState(null);
  const [paraphrasedQuestions, setParaphrasedQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Fetch pre-test questions, paraphrase, and randomize
    const fetchAndParaphrase = async () => {
      try {
        setIsLoading(true);
        // Get pre-test questions for this module
        const preTest = await moduleService.getPreTest(moduleId);
        if (!preTest || !preTest.questions) throw new Error("No pre-test found");
        // Paraphrase each question
        const paraphrased = await Promise.all(
          preTest.questions.map(async (q) => {
            let paraphrasedQ;
            try {
              paraphrasedQ = await paraphraseService.paraphrase(q.question);
            } catch {
              paraphrasedQ = q.question; // fallback
            }
            // Randomize options
            const shuffledOptions = q.options
              .map((opt) => ({ opt, sort: Math.random() }))
              .sort((a, b) => a.sort - b.sort)
              .map(({ opt }) => opt);
            return {
              ...q,
              question: paraphrasedQ,
              options: shuffledOptions,
              originalQuestion: q.question // <-- Save original for debug
            };
          })
        );
        // Randomize question order
        const shuffledQuestions = paraphrased
          .map((q) => ({ q, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ q }) => q);
        setParaphrasedQuestions(shuffledQuestions);
        setPostTest({ title: `Post-Test for ${preTest.title || "Module"}`, questions: shuffledQuestions });
      } catch (error) {
        console.error("Failed to load post-test:", error);
        setError("Failed to load post-test. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndParaphrase();
  }, [moduleId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl mb-4">{error}</div>
        <button
          onClick={() => navigate("/student/dashboard")}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!postTest || !postTest.questions || postTest.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-gray-600 text-xl mb-4">No post-test available for this module.</div>
        <button
          onClick={() => navigate("/student/dashboard")}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestionData = postTest.questions[currentQuestion];
  const isLastQuestion = currentQuestion === postTest.questions.length - 1;
  const allQuestionsAnswered = postTest.questions.every((_, index) => 
    answers.hasOwnProperty(index)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary-dark mb-2">{postTest.title}</h1>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Question {currentQuestion + 1} of {postTest.questions.length}</span>
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / postTest.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            {/* DEBUG: Show original and paraphrased question */}
            <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', color: '#b8860b', marginBottom: '4px' }}><strong>Original:</strong> {currentQuestionData.originalQuestion}</div>
              <div style={{ fontSize: '16px', color: '#333' }}><strong>Paraphrased:</strong> {currentQuestionData.question}</div>
            </div>
            <div className="space-y-3">
              {currentQuestionData.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    answers[currentQuestion] === option
                      ? "border-primary bg-primary-light"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={option}
                    checked={answers[currentQuestion] === option}
                    onChange={() => handleAnswerSelect(currentQuestion, option)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    answers[currentQuestion] === option
                      ? "border-primary bg-primary"
                      : "border-gray-300"
                  }`}>
                    {answers[currentQuestion] === option && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex gap-2">
              {postTest.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-8 h-8 rounded-full text-sm ${
                    index === currentQuestion
                      ? "bg-primary text-white"
                      : answers.hasOwnProperty(index)
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered || isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Test"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!answers.hasOwnProperty(currentQuestion)}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ...existing code...

// Add missing handlePrevious function
function handlePrevious() {
  setCurrentQuestion((prev) => Math.max(prev - 1, 0));
}

export default PostTestPage;
