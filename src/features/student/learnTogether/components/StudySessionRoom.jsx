// The code you posted contains two separate return blocks and duplicate UI logic.
// To fix: Remove the duplicate return block and keep only the Google Meet-like responsive UI (the first big return).
// Also, remove any unreachable code after the first return statement.
// Here is the corrected version (keep only the first main return block):

import React, { useState, useEffect, useRef, useCallback } from "react";
// ...other imports...

const StudySessionRoom = (props) => {
  // ...all your hooks and logic...

  // --- Responsive Google Meet-like UI ---
  // Find the main participant to pin (screen sharer > speaker > self)
  let mainParticipant = participants.find((p) => p.is_screen_sharing);
  if (!mainParticipant) {
    const speaking = participants.filter((p) => speakingParticipants.has(p.user_id));
    mainParticipant = speaking.length > 0 ? speaking[0] : participants.find((p) => p.user_id === userId);
  }
  const otherParticipants = participants.filter((p) => p.id !== mainParticipant?.id);

  if (connectionStatus === "connecting") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Connecting to study session...</p>
        </div>
      </div>
    );
  }

  if (connectionStatus === "error") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
          <p className="mb-4">Failed to connect to the study session.</p>
          <button 
            onClick={handleLeaveSession}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Study Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">{roomInfo?.group_title}</h1>
          <p className="text-sm text-gray-300">{roomInfo?.group_subject}</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>{participants.length} participants</span>
          </div>
          {mediaError && (
            <div className="text-red-400 text-sm max-w-xs">{mediaError}</div>
          )}
          <button
            onClick={handleLeaveSession}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Leave Session
          </button>
        </div>
      </div>

      {/* Main video area */}
      <div className="flex-1 flex flex-col sm:flex-row relative">
        {/* Main participant video (pinned) */}
        <div className="flex-1 flex items-center justify-center p-2 sm:p-6">
          <div className="relative w-full max-w-2xl aspect-video bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
            {!mainParticipant.camera_off || mainParticipant.is_screen_sharing ? (
              <video
                ref={mainParticipant.user_id === userId ? localVideoRef : (el) => {
                  if (el && remoteVideosRef.current) remoteVideosRef.current.set(mainParticipant.id, el);
                }}
                autoPlay
                muted={mainParticipant.user_id === userId}
                playsInline
                className="w-full h-full object-cover bg-gray-800"
                style={{ minHeight: '200px' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white bg-gray-700">
                <div className="text-center">
                  <VideoOff className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">{mainParticipant.name} (Camera Off)</p>
                </div>
              </div>
            )}
            {/* Speaker/Screen Share Indicator */}
            {mainParticipant.is_screen_sharing && (
              <div className="absolute top-2 left-2 bg-blue-500 bg-opacity-90 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                <Monitor className="w-4 h-4" />
                <span>Screen Sharing</span>
              </div>
            )}
            {speakingParticipants.has(mainParticipant.user_id) && !mainParticipant.is_screen_sharing && (
              <div className="absolute top-2 left-2 bg-green-500 bg-opacity-90 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                <Volume2 className="w-3 h-3" />
                <span>Speaking</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm flex items-center space-x-2">
              <span>{mainParticipant.name} {mainParticipant.muted && <span className="text-red-400">(Muted)</span>} {!mainParticipant.camera_off && <span className="text-green-400 ml-1">(Camera On)</span>} {mainParticipant.is_screen_sharing && <span className="text-blue-400 ml-1">(Sharing)</span>} {mainParticipant.hand_raised && <span className="text-yellow-400 ml-1">✋</span>}</span>
              {!mainParticipant.muted && (
                <SpeakingIndicator isActive={speakingParticipants.has(mainParticipant.user_id)} audioLevel={mainParticipant.user_id === userId ? localAudioLevel : 50} />
              )}
            </div>
          </div>
        </div>

        {/* Other participants as thumbnails */}
        <div className="hidden sm:flex flex-col gap-2 w-40 p-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {otherParticipants.map((participant) => (
            <div key={participant.id} className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
              {!participant.camera_off ? (
                <video
                  ref={(el) => { if (el && remoteVideosRef.current) remoteVideosRef.current.set(participant.id, el); }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white bg-gray-700">
                  <div className="text-center">
                    <VideoOff className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">{participant.name}</p>
                  </div>
                </div>
              )}
              {speakingParticipants.has(participant.user_id) && (
                <div className="absolute top-2 left-2 bg-green-500 bg-opacity-90 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                  <Volume2 className="w-3 h-3" />
                  <span>Speaking</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center space-x-2">
                <span>{participant.name} {participant.muted && <span className="text-red-400">(Muted)</span>} {!participant.camera_off && <span className="text-green-400 ml-1">(Camera On)</span>} {participant.is_screen_sharing && <span className="text-blue-400 ml-1">(Sharing)</span>} {participant.hand_raised && <span className="text-yellow-400 ml-1">✋</span>}</span>
                {!participant.muted && (
                  <SpeakingIndicator isActive={speakingParticipants.has(participant.user_id)} audioLevel={50} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Chat as slide-over panel */}
        {showChat && (
          <div className="fixed inset-0 sm:static sm:w-80 bg-gray-900 bg-opacity-90 sm:bg-gray-800 text-white flex flex-col z-50" style={{ maxWidth: '100vw', width: '100%', height: '100%', top: 0, right: 0 }}>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-bold">Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 160px)' }}>
              {chatMessages.map((message) => (
                <div key={message.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">{message.sender_name}</span>
                    <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                  </div>
                  <p className="text-sm break-words">{message.message}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleMessageKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom controls for mobile */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-800 p-2 flex justify-center items-center gap-2 z-40 sm:static sm:p-4 sm:gap-4">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>
        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full ${isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={isCameraOff ? "Turn camera on" : "Turn camera off"}
        >
          {isCameraOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
        </button>
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${isScreenSharing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          {isScreenSharing ? <MonitorOff className="w-6 h-6 text-white" /> : <Monitor className="w-6 h-6 text-white" />}
        </button>
        <button
          onClick={toggleHandRaise}
          className={`p-3 rounded-full ${handRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={handRaised ? "Lower hand" : "Raise hand"}
        >
          <Hand className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-3 rounded-full ${showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title="Toggle chat"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-full bg-gray-600 hover:bg-gray-700"
          title="Settings"
        >
          <Settings className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Session end notification */}
      <SessionEndNotification
        isVisible={showEndNotification}
        message={endNotificationMessage}
        type={endNotificationType}
        onClose={handleEndNotificationClose}
      />
    </div>
  );
};

export default StudySessionRoom;
