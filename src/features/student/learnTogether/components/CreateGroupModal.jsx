import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useLearnTogetherStore from "../../../../store/student/learnTogetherStore";

const CreateGroupModal = () => {
  const navigate = useNavigate();
  const { isModalOpen, closeModal, addGroup, startSession } = useLearnTogetherStore();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [schedule, setSchedule] = useState("");
  const [password, setPassword] = useState("");
  const [requirePassword, setRequirePassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!isModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      // Create the group (it will automatically start as a live session)
      const groupData = { title, subject, schedule };
      if (requirePassword && password.trim()) {
        groupData.password = password.trim();
      }
      
      const group = await addGroup(groupData);
      
      if (group && group.id) {
        // Navigate directly to the live session (no need to call startSession)
        navigate(`/student/study-session/${group.id}`);
      }
      
      // Close modal and reset form
      closeModal();
      setTitle("");
      setSubject("");
      setSchedule("");
      setPassword("");
      setRequirePassword(false);
    } catch (error) {
      console.error("Failed to create live session:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">Start a New Live Study Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Session Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., Calculus Study Session"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., Mathematics"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Topic/Description
            </label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., Chapter 5 - Derivatives"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center text-gray-700 font-bold mb-2">
              <input
                type="checkbox"
                checked={requirePassword}
                onChange={(e) => setRequirePassword(e.target.checked)}
                className="mr-2"
              />
              Password protect this session
            </label>
            {requirePassword && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded mt-2"
                placeholder="Enter a password for your session"
                required={requirePassword}
              />
            )}
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={closeModal}
              disabled={isCreating}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Starting...
                </>
              ) : (
                <>
                  🎥 Start Live Session
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
