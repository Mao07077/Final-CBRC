import { useState, useEffect } from "react";
import usePostTestStore from "../../../../store/instructor/postTestStore";
import QuestionBuilder from "./QuestionBuilder";

const TestBuilderForm = ({ moduleId }) => {
  const { saveTest, editingTest, closeModal, isLoading } = usePostTestStore();
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
    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">
        {editingTest ? "Edit Post-Test" : "Create New Post-Test"}
      </h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Test Title"
          className="form-input mb-4"
          required
        />
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
        <button
          type="button"
          onClick={addQuestion}
          className="btn btn-secondary mt-4"
        >
          + Add Question
        </button>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={closeModal}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? "Saving..." : "Save Test"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestBuilderForm;
