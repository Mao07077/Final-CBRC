import { useState, useEffect } from "react";
import usePostTestStore from "../../../../store/instructor/postTestStore";
import Toast from "../../../../components/common/Toast";
import QuestionBuilder from "./QuestionBuilder";

const TestBuilderForm = ({ moduleId }) => {
  const { saveTest, editingTest, closeModal, isLoading, success, error } = usePostTestStore();
  // Clear success after showing
  const handleToastClose = () => {
    // Zustand exposes setState as a static property
    if (typeof usePostTestStore.setState === "function") {
      usePostTestStore.setState({ success: null });
    }
  };
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (editingTest) {
      setTitle(editingTest.title);
      setQuestions(editingTest.questions);
    } else {
      setTitle("");
      setQuestions([
        { question: "", options: ["", "", "", ""], correctAnswer: "" },
      ]);
    }
  }, [editingTest]);

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].question = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerChange = (qIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctAnswer = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () =>
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], correctAnswer: "" },
    ]);
  const removeQuestion = (index) =>
    setQuestions(questions.filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();
    saveTest({ title, questions, module_id: moduleId });
  };

  return (
    <>
      <Toast message={success} onClose={handleToastClose} />
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        {editingTest ? "Edit Pre-Test" : "Create New Pre-Test"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Test Title<span className="text-red-500"> *</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cardiovascular Basics Pre-Test"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-3 py-2"
            required
          />
        </div>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <QuestionBuilder
              key={i}
              q={q}
              qIndex={i}
              onQuestionChange={handleQuestionChange}
              onOptionChange={handleOptionChange}
              onCorrectAnswerChange={handleCorrectAnswerChange}
              onRemoveQuestion={removeQuestion}
            />
          ))}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-100"
          >
            + Add Question
          </button>
          <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={closeModal}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? "Saving..." : "Save Test"}
          </button>
          </div>
        </div>
      </form>
    </div>
    </>
  );
};

export default TestBuilderForm;
