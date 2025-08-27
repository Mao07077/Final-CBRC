import { FiTrash } from "react-icons/fi";

const QuestionBuilder = ({
  q,
  qIndex,
  onQuestionChange,
  onOptionChange,
  onCorrectAnswerChange,
  onRemoveQuestion,
}) => {
  return (
    <div className="question-builder-card mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="font-semibold">Question {qIndex + 1}</label>
        <button
          type="button"
          onClick={() => onRemoveQuestion(qIndex)}
          className="btn-ghost-danger"
        >
          <FiTrash />
        </button>
      </div>
      <input
        type="text"
        value={q.question}
        onChange={(e) => onQuestionChange(qIndex, e.target.value)}
        placeholder="Enter the question..."
        className="form-input mb-2"
      />
      {q.options.map((opt, oIndex) => (
        <input
          key={oIndex}
          type="text"
          value={opt}
          onChange={(e) => onOptionChange(qIndex, oIndex, e.target.value)}
          placeholder={`Option ${oIndex + 1}`}
          className="form-input mb-2"
        />
      ))}
      <select
        value={q.correctAnswer}
        onChange={(e) => onCorrectAnswerChange(qIndex, e.target.value)}
        className="form-select"
      >
        <option value="">Select Correct Answer</option>
        {q.options.map(
          (opt, oIndex) =>
            opt && (
              <option key={oIndex} value={opt}>{`Option ${oIndex + 1}`}</option>
            )
        )}
      </select>
    </div>
  );
};

export default QuestionBuilder;
