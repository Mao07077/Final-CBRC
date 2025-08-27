import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useSurveyStore from "../../../store/student/surveyStore";
import useAuthStore from "../../../store/authStore";

const SurveyForm = () => {
  const navigate = useNavigate();
  const { userData } = useAuthStore();
  const {
    questions,
    currentPage,
    answers,
    isLoading,
    error,
    handleAnswer,
    nextPage,
    prevPage,
    submitSurvey,
    isCurrentPageCompleted,
  } = useSurveyStore();

  useEffect(() => {
    if (userData?.surveyCompleted) {
      navigate("/student/dashboard");
    }
  }, [navigate, userData]);

  const currentQuestionSet = questions[currentPage];

  const handleSubmit = () => {
    if (userData?.id_number) {
      submitSurvey(userData.id_number, navigate);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-primary-dark mb-2">
          Study Habits Survey
        </h2>
        <p className="text-gray-600 mb-6">
          Please answer honestly to help us understand your preferences.
        </p>

        {error && (
          <p className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</p>
        )}

        <div>
          <h3 className="text-xl font-semibold text-primary-dark mb-4">
            {currentQuestionSet.category}
          </h3>
          {currentQuestionSet.questions.map((q, index) => (
            <div key={index} className="mb-6">
              <p className="font-medium text-gray-800 mb-2">{q.question}</p>
              <div className="space-y-2">
                {q.choices.map((choice, choiceIndex) => (
                  <label
                    key={choiceIndex}
                    className="flex items-center p-3 rounded-lg hover:bg-light-blue cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={`${currentPage}-${index}`}
                      className="h-5 w-5 text-accent-medium focus:ring-accent-light border-gray-300"
                      onChange={() => handleAnswer(index, choiceIndex)}
                      checked={
                        answers[`${currentPage}-${index}`]?.score ===
                        q.choices.length - choiceIndex
                      }
                      disabled={isLoading}
                    />
                    <span className="ml-3 text-gray-700">{choice}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Page {currentPage + 1} of {questions.length}
          </p>
          <div className="flex items-center gap-4">
            {currentPage > 0 && (
              <button
                onClick={prevPage}
                disabled={isLoading}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            )}
            {currentPage < questions.length - 1 ? (
              <button
                onClick={nextPage}
                disabled={isLoading || !isCurrentPageCompleted()}
                className="px-6 py-2 bg-primary-dark text-white font-semibold rounded-lg hover:bg-primary-darker transition-colors disabled:bg-gray-400"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading || !isCurrentPageCompleted()}
                className="px-6 py-2 bg-accent-medium text-white font-semibold rounded-lg hover:bg-accent-dark transition-colors disabled:bg-gray-400"
              >
                {isLoading ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyForm;
