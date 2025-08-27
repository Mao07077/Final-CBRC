import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudySessionRoom from "../../features/student/learnTogether/components/StudySessionRoom";
import useAuthStore from "../../store/authStore";
import apiClient from "../../api/axios";

const StudySessionPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuthStore();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        if (!userData?.id_number) {
          setError("User not authenticated");
          return;
        }

        const response = await apiClient.get(`/api/study-groups/${groupId}/session-info`);
        
        if (response.data.success) {
          setSessionInfo(response.data);
        } else {
          setError("Failed to load study session");
        }
      } catch (error) {
        console.error("Session info fetch error:", error);
        if (error.response?.status === 404) {
          setError("Study group not found");
        } else {
          setError("Failed to load study session");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSessionInfo();
  }, [groupId, userData]);

  const handleLeaveSession = () => {
    navigate("/student/learn-together");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading study session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error}</p>
            <button 
              onClick={handleLeaveSession}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Study Groups
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <StudySessionRoom 
        sessionInfo={sessionInfo}
        userId={userData.id_number}
        userName={`${userData.firstname} ${userData.lastname}`.trim()}
        onLeaveSession={handleLeaveSession}
      />
    </div>
  );
};

export default StudySessionPage;
