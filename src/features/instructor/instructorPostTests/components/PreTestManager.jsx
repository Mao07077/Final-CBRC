import React, { useEffect, useState } from "react";
import usePreTestStore from "../../../../store/instructor/preTestStore";
import Toast from "../../../components/common/Toast";

const PreTestManager = ({ moduleId }) => {
  const { preTests, fetchPreTest, updatePreTest, isLoading, error, success } = usePreTestStore();
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (moduleId) fetchPreTest(moduleId);
  }, [moduleId]);

  useEffect(() => {
    if (preTests[moduleId]) {
      setTitle(preTests[moduleId].title || "");
      setQuestions(preTests[moduleId].questions || []);
    }
  }, [preTests, moduleId]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => setEditMode(false);

  const handleSave = () => {
    updatePreTest(moduleId, { title, questions });
    setEditMode(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
      <Toast message={success} onClose={() => usePreTestStore.setState({ success: null })} />
      <h2 className="text-xl font-bold mb-4">Pre-Test Management</h2>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {preTests[moduleId] ? (
        <div>
          {editMode ? (
            <>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="form-input mb-4"
                placeholder="Pre-Test Title"
              />
              {questions.map((q, i) => (
                <div key={i} className="mb-4">
                  <input
                    type="text"
                    value={q.question}
                    onChange={e => {
                      const newQuestions = [...questions];
                      newQuestions[i].question = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="form-input mb-2"
                    placeholder={`Question ${i + 1}`}
                  />
                  {q.options.map((opt, j) => (
                    <input
                      key={j}
                      type="text"
                      value={opt}
                      onChange={e => {
                        const newQuestions = [...questions];
                        newQuestions[i].options[j] = e.target.value;
                        setQuestions(newQuestions);
                      }}
                      className="form-input mb-1"
                      placeholder={`Option ${j + 1}`}
                    />
                  ))}
                  <input
                    type="text"
                    value={q.correctAnswer}
                    onChange={e => {
                      const newQuestions = [...questions];
                      newQuestions[i].correctAnswer = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="form-input mb-1"
                    placeholder="Correct Answer"
                  />
                </div>
              ))}
              <button onClick={handleSave} className="btn btn-primary mr-2">Save</button>
              <button onClick={handleCancel} className="btn btn-secondary">Cancel</button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              {questions.map((q, i) => (
                <div key={i} className="mb-4">
                  <div className="font-medium">Q{i + 1}: {q.question}</div>
                  <ul className="ml-4">
                    {q.options.map((opt, j) => (
                      <li key={j}>{opt}</li>
                    ))}
                  </ul>
                  <div className="text-green-600">Correct: {q.correctAnswer}</div>
                </div>
              ))}
              <button onClick={handleEdit} className="btn btn-primary">Edit Pre-Test</button>
            </>
          )}
        </div>
      ) : (
        <p>No pre-test found for this module.</p>
      )}
    </div>
  );
};

export default PreTestManager;
