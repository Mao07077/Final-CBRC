import React, { useEffect, useState, useRef } from "react";
import useLearnTogetherStore from "../../store/student/learnTogetherStore";
import StudyGroupCard from "../../features/student/learnTogether/components/StudyGroupCard";
import CreateGroupModal from "../../features/student/learnTogether/components/CreateGroupModal";

const LearnTogetherPage = () => {
  const { 
    groups, 
    openModal, 
    fetchGroups, 
    cleanupInactiveGroups,
    setGroups, // Add this to update groups from WebSocket
    isLoading, 
    error
  } = useLearnTogetherStore();

  const [cleanupResult, setCleanupResult] = useState(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const websocketRef = useRef(null);

  // Always fetch only active sessions (live meetings)
  useEffect(() => {
    fetchGroups(true); // true = activeOnly
  }, [fetchGroups]);

  // WebSocket connection for live participant count updates
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const baseUrl = (import.meta.env.VITE_API_URL || "https://cbrcs-final.onrender.com").replace(/\/$/, '');
        const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
        const wsUrl = `${wsBaseUrl}/ws/dashboard`;
        
        console.log("🔗 Connecting to dashboard WebSocket:", wsUrl);
        websocketRef.current = new WebSocket(wsUrl);
        
        websocketRef.current.onopen = () => {
          console.log("✅ Dashboard WebSocket connected");
          setIsLiveConnected(true);
        };
        
        websocketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "dashboard_update") {
              console.log("📊 Live participant update received:", data.groups);
              // Update the groups with new participant counts
              setGroups(data.groups);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
        
        websocketRef.current.onclose = () => {
          console.log("🔌 Dashboard WebSocket disconnected, reconnecting...");
          setIsLiveConnected(false);
          // Reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
        
        websocketRef.current.onerror = (error) => {
          console.error("❌ Dashboard WebSocket error:", error);
          setIsLiveConnected(false);
        };
        
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
        setIsLiveConnected(false);
        // Retry after 5 seconds
        setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [setGroups]);

  // Reduced auto-refresh interval since we have live updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if WebSocket is not connected
      if (!isLiveConnected) {
        fetchGroups(true);
      }
    }, 30000); // Refresh every 30 seconds as backup

    return () => clearInterval(interval);
  }, [fetchGroups, isLiveConnected]);

  const handleRefresh = () => {
    fetchGroups(true); // Manual refresh for active sessions
  };

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    setCleanupResult(null);
    
    const result = await cleanupInactiveGroups();
    setCleanupResult(result);
    setIsCleaningUp(false);
    
    // Clear the result message after 5 seconds
    setTimeout(() => {
      setCleanupResult(null);
    }, 5000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading study groups...</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {cleanupResult && (
        <div className={`border px-4 py-3 rounded mb-4 ${
          cleanupResult.success 
            ? 'bg-green-100 border-green-400 text-green-700' 
            : 'bg-red-100 border-red-400 text-red-700'
        }`}>
          {cleanupResult.success 
            ? `✅ ${cleanupResult.message}` 
            : `❌ ${cleanupResult.error}`}
          {cleanupResult.deletedGroups && cleanupResult.deletedGroups.length > 0 && (
            <div className="mt-2 text-sm">
              <strong>Deleted groups:</strong> {cleanupResult.deletedGroups.map(g => g.title).join(', ')}
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Live Study Sessions
            </h1>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isLiveConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isLiveConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              {isLiveConnected ? 'LIVE UPDATES' : 'OFFLINE'}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {isLiveConnected 
              ? 'Participant counts update automatically in real-time' 
              : 'Currently active study sessions you can join right now'
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors"
          >
            🔄 Refresh Participants
          </button>
          <button
            onClick={handleCleanup}
            disabled={isCleaningUp}
            className={`px-4 py-2 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-colors ${
              isCleaningUp 
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
            }`}
          >
            {isCleaningUp ? '🧹 Cleaning...' : '🧹 Cleanup Inactive'}
          </button>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors"
          >
            Start New Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length > 0 ? (
          groups.map((group) => (
            <StudyGroupCard key={group.id} group={group} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              📡
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No live sessions right now
            </h3>
            <p className="text-gray-500 mb-4">
              No one is currently hosting a study session. Be the first to start one!
            </p>
            <button
              onClick={openModal}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start New Session
            </button>
          </div>
        )}
      </div>
      
      <CreateGroupModal />
    </div>
  );
};

export default LearnTogetherPage;
