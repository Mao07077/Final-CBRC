import { useState } from "react";
import Modal from "../../../../components/common/Modal";

const EditPreTestModal = ({ isOpen, onClose, preTest, onSave }) => {
  const [title, setTitle] = useState(preTest?.title || "");
  const [questions, setQuestions] = useState(preTest?.questions || []);

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleSave = () => {
    onSave({ title, questions });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Pre-Test">
      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Test Title"
          className="form-input mb-4"
        />
        {questions.map((q, i) => (
          <div key={i} className="mb-2">
            <input
              type="text"
              value={q.question}
              onChange={e => handleQuestionChange(i, "question", e.target.value)}
              placeholder={`Question ${i + 1}`}
              className="form-input mb-2"
            />
            {q.options.map((opt, j) => (
              <input
                key={j}
                type="text"
                value={opt}
                onChange={e => {
                  const opts = [...q.options];
                  opts[j] = e.target.value;
                  handleQuestionChange(i, "options", opts);
                }}
                placeholder={`Option ${j + 1}`}
                className="form-input mb-1"
              />
            ))}
            <input
              type="text"
              value={q.correctAnswer}
              onChange={e => handleQuestionChange(i, "correctAnswer", e.target.value)}
              placeholder="Correct Answer"
              className="form-input mb-1"
            />
          </div>
        ))}
        <button
          onClick={handleSave}
          className="btn btn-primary mt-4"
        >
          Save Changes
        </button>
      </div>
    </Modal>
  );
};

export default EditPreTestModal;
