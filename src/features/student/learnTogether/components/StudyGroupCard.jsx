import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useLearnTogetherStore from "../../../../store/student/learnTogetherStore";

const StudyGroupCard = ({ group }) => {
  const navigate = useNavigate();
  const { joinGroup, startSession, joinSession, verifyGroupPassword } = useLearnTogetherStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const handlePasswordVerification = async () => {
    if (!password.trim()) {
      setPasswordError("Password is required");
      return;
    }

    setIsVerifyingPassword(true);
    setPasswordError("");

    try {
      const success = await verifyGroupPassword(group.id, password);
      if (success) {
        setShowPasswordModal(false);
        setPassword("");
        // Navigate to the study session
        navigate(`/student/study-session/${group.id}`);
      } else {
        setPasswordError("Incorrect password");
      }
    } catch (error) {
      console.error("Password verification failed:", error);
      setPasswordError("Failed to verify password");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleJoinSessionClick = () => {
    // Check if group has password protection
    if (group.password) {
      setShowPasswordModal(true);
    } else {
      handleJoinSession();
    }
  };

  const handleJoinGroup = async () => {
    try {
      await joinGroup(group.id);
      // Navigate to the study session
      navigate(`/student/study-session/${group.id}`);
    } catch (error) {
      console.error("Failed to join group:", error);
    }
  };

  const handleStartSession = async () => {
    try {
      const success = await startSession(group.id);
      if (success) {
        // Navigate to the study session
        navigate(`/student/study-session/${group.id}`);
      }
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handleJoinSession = async () => {
    try {
      if (group.is_session_active) {
        await joinSession(group.id);
      }
      // Navigate to the study session regardless
      navigate(`/student/study-session/${group.id}`);
    } catch (error) {
      console.error("Failed to join session:", error);
    }
  };

  const isSessionActive = group.is_session_active;
  const participantCount = group.active_participants?.length || 0; // Show actual count, 0 if empty

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-green-500">
      {/* Live Session Indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-semibold text-green-600">
          LIVE NOW • {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-primary-dark mb-2">
        {group.title}
      </h3>
      <p className="text-sm font-semibold text-gray-500 mb-4">
        {group.subject}
      </p>
      
      {group.schedule && (
        <div className="mb-4">
          <p className="font-bold">Topic:</p>
          <p className="text-sm text-gray-600">{group.schedule}</p>
        </div>
      )}
      
      <div className="mb-4">
        <p className="font-bold">Currently in session:</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {group.active_participants?.slice(0, 3).map((participant, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
            >
              {participant}
            </span>
          ))}
          {group.active_participants?.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              +{group.active_participants.length - 3} more
            </span>
          )}
        </div>
      </div>
      
      <button 
        onClick={handleJoinSessionClick}
        className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
      >
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        Join Live Session
        {group.password && <span className="text-xs">🔒</span>}
      </button>
      
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Password Required
            </h3>
            <p className="text-gray-600 mb-4">
              This study group requires a password to join.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordVerification()}
              placeholder="Enter group password"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-green-500"
              disabled={isVerifyingPassword}
            />
            {passwordError && (
              <p className="text-red-500 text-sm mb-4">{passwordError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                  setPasswordError("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={isVerifyingPassword}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordVerification}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                disabled={isVerifyingPassword || !password.trim()}
              >
                {isVerifyingPassword ? "Verifying..." : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGroupCard;