import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  MessageSquare, 
  Users, 
  Hand,
  Monitor,
  MonitorOff,
  Settings,
  Send,
  Volume2
} from "lucide-react";
import useLearnTogetherStore from "../../../../store/student/learnTogetherStore";
import SessionEndNotification from "../../../../components/common/SessionEndNotification";
import apiClient from "../../../../api/axiosClient";

// Speaking Indicator Component
const SpeakingIndicator = ({ isActive, audioLevel = 0 }) => {
  const bars = [1, 2, 3, 4, 5];
  
  return (
    <div className="flex items-center space-x-1">
      {bars.map((bar) => (
        <div
          key={bar}
          className={`w-1 bg-green-400 rounded-full transition-all duration-150 ${
            isActive 
              ? `h-${Math.min(6, Math.max(2, Math.floor(audioLevel / 20) + 2))} animate-pulse` 
              : 'h-2 opacity-30'
          }`}
          style={{
            animationDelay: `${bar * 0.1}s`,
            height: isActive ? `${Math.min(24, Math.max(8, (audioLevel / 255) * 24 + bar * 2))}px` : '8px'
          }}
        />
      ))}
    </div>
  );
};

const StudySessionRoom = ({ sessionInfo, userId, userName, onLeaveSession }) => {
  const { leaveSession } = useLearnTogetherStore();
  
  // Add notification state
  const [showEndNotification, setShowEndNotification] = useState(false);
  const [endNotificationMessage, setEndNotificationMessage] = useState("");
  const [endNotificationType, setEndNotificationType] = useState("success");
  // WebSocket connection
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  
  // Local media state (define these BEFORE using them)
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  
  // Room state
  const [participants, setParticipants] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);

  // Initialize participants with current user
  useEffect(() => {
    if (userId && userName) {
      setParticipants([{
        id: `user_${userId}`,
        user_id: userId,
        name: userName,
        muted: isMuted,
        camera_off: isCameraOff,
        is_screen_sharing: isScreenSharing
      }]);
    }
  }, [userId, userName, isMuted, isCameraOff, isScreenSharing]);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  
  // Speaking indicator state
  const [speakingParticipants, setSpeakingParticipants] = useState(new Set());
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  
  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  // Add refs for ICE candidate queuing
  const pendingIceCandidates = useRef(new Map()); // participantId -> array of candidates
  const chatContainerRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // Store peer connections
  const remoteVideosRef = useRef(new Map()); // Store remote video refs

  // --- Diagnostic Logging Helpers ---
  const logSignal = (msg, data) => console.log(`[SIGNAL] ${msg}`, data);
  const logStream = (msg, data) => console.log(`[STREAM] ${msg}`, data);
  const logPeer = (msg, data) => console.log(`[PEER] ${msg}`, data);

  // Initialize media on component mount
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        // Start with audio enabled but muted, video disabled
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,  // Start with camera off
          audio: true    // Get audio permission but we'll mute it
        });
        
        localStreamRef.current = stream;
        
        // Mute audio by default
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false; // Muted by default
        }
        
        // Set up audio level monitoring for speaking indicator
        setupAudioLevelMonitoring(stream);
        
        console.log("Media permissions granted");
        console.log("Initial stream - Audio tracks:", stream.getAudioTracks().length, "Video tracks:", stream.getVideoTracks().length);
        setMediaError(null);
      } catch (error) {
        console.error("Failed to get media permissions:", error);
        setMediaError("Unable to access camera/microphone. Please check your permissions.");
      }
    };

    initializeMedia();
  }, []);

  // Sync UI state with actual media tracks
  useEffect(() => {
    const syncMediaState = () => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        
        // Log the actual state of media tracks
        console.log("Media state sync - Audio:", audioTrack?.enabled, "Video:", !!videoTrack);
        console.log("UI state - Muted:", isMuted, "Camera off:", isCameraOff);
        
        // Debug video element state
        if (localVideoRef.current) {
          console.log("Video element srcObject:", !!localVideoRef.current.srcObject);
          console.log("Video element readyState:", localVideoRef.current.readyState);
          console.log("Video element paused:", localVideoRef.current.paused);
          console.log("Video element dimensions:", localVideoRef.current.videoWidth, "x", localVideoRef.current.videoHeight);
        }
      }
    };

    // Sync state every time media controls change
    syncMediaState();
  }, [isMuted, isCameraOff]);

  // WebSocket connection setup
  useEffect(() => {
    if (!sessionInfo) return;

    const initializeSession = async () => {
      try {
        // Just join the existing active session
        const { joinSession } = useLearnTogetherStore.getState();
        await joinSession(sessionInfo.group.id);

        // Now establish WebSocket connection
        const baseUrl = (import.meta.env.VITE_API_URL || "https://cbrcs-final.onrender.com").replace(/\/$/, '');
        const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
        console.log("Base URL:", baseUrl);
        console.log("WS Base URL:", wsBaseUrl);
        console.log("WebSocket URL from backend:", sessionInfo.websocket_url);
        
        // Ensure websocket_url starts with / and remove any double slashes
        let websocketPath = sessionInfo.websocket_url;
        if (!websocketPath.startsWith('/')) {
          websocketPath = '/' + websocketPath;
        }
        console.log("WebSocket path after processing:", websocketPath);
        
        const wsUrl = `${wsBaseUrl}${websocketPath}`;
        
        console.log("Final WebSocket URL:", wsUrl);
        
        console.log("Connecting to WebSocket:", wsUrl);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          setConnectionStatus("connected");
          
          // Send initial connection data with current media state
          ws.send(JSON.stringify({
            type: "join_session",
            user_id: userId,
            user_name: userName,
            muted: isMuted,
            camera_off: isCameraOff,
            is_screen_sharing: isScreenSharing,
            hand_raised: handRaised
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected");
          setConnectionStatus("disconnected");
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnectionStatus("error");
        };

        setSocket(ws);
      } catch (error) {
        console.error("Failed to initialize session:", error);
        setConnectionStatus("error");
      }
    };

    initializeSession();

    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      // Clean up audio monitoring
      stopAudioLevelMonitoring();
    };
  }, [sessionInfo, userId, userName]);

  // Activity updater to keep session alive
  useEffect(() => {
    if (!sessionInfo?.group?.id) return;

    const updateActivity = async () => {
      try {
        const response = await apiClient.post('/api/study-groups/update-activity', {
          group_id: sessionInfo.group.id
        });
        
        if (!response.data.success) {
          console.warn('Failed to update activity:', response.data);
        }
      } catch (error) {
        console.warn('Error updating activity:', error);
      }
    };

    // Update activity immediately
    updateActivity();

    // Set up interval to update every 2 minutes (keeps sessions alive)
    const activityInterval = setInterval(updateActivity, 2 * 60 * 1000);

    return () => {
      clearInterval(activityInterval);
    };
  }, [sessionInfo?.group?.id]);

  // Track last speaking state for each user to avoid console spam
  const lastSpeakingStateRef = useRef(new Map());

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case "connection_established":
        console.log("Connection established:", data);
        setRoomInfo(data.room_info);
        break;
        
      case "participants_update":
        console.log("Participants update:", data.participants);
        // Always include current user in participants list
        const currentUser = {
          id: `user_${userId}`,
          user_id: userId,
          name: userName,
          muted: isMuted,
          camera_off: isCameraOff,
          is_screen_sharing: isScreenSharing
        };
        
        // Filter out current user from server data and add our local version
        const otherParticipants = data.participants.filter(p => p.user_id !== userId);
        const allParticipants = [currentUser, ...otherParticipants];
        
        setParticipants(allParticipants);
        setRoomInfo(data.room_info);
        // Handle new participants for WebRTC connections
        handleParticipantsUpdate(allParticipants);
        break;
        
      case "chat_message":
        setChatMessages(prev => [...prev, data.message]);
        // Auto-scroll chat to bottom
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
        break;
        
      case "chat_history":
        setChatMessages(data.messages);
        break;
        
      case "hand_raise_update":
        // Handle hand raise notifications (you could show a toast here)
        console.log(`${data.participant_name} ${data.hand_raised ? 'raised' : 'lowered'} their hand`);
        break;
        
      case "status_update":
        // Handle participant status updates (mute, camera, screen share)
        console.log("Status update received:", data);
        
        // Update participant status in the participants list
        setParticipants(prev => prev.map(participant => {
          if (participant.user_id === data.from_user_id) {
            return {
              ...participant,
              muted: data.muted,
              camera_off: data.camera_off,
              is_screen_sharing: data.is_screen_sharing
            };
          }
          return participant;
        }));
        
        console.log(`Participant ${data.from_user_id} status: muted=${data.muted}, camera_off=${data.camera_off}, screen_sharing=${data.is_screen_sharing}`);
        break;
        
      case "speaking_update": {
        // Only log when speaking state changes
        const lastState = lastSpeakingStateRef.current.get(data.from_user_id);
        if (lastState !== data.is_speaking) {
          console.log("Speaking update received:", data);
          lastSpeakingStateRef.current.set(data.from_user_id, data.is_speaking);
        }
        if (data.is_speaking) {
          setSpeakingParticipants(prev => new Set([...prev, data.from_user_id]));
        } else {
          setSpeakingParticipants(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.from_user_id);
            return newSet;
          });
        }
        break;
      }
        
      case "webrtc_offer":
      case "webrtc_answer":
      case "webrtc_ice_candidate":
        // Handle WebRTC signaling
        handleWebRTCSignaling(data);
        break;
        
      case "error":
        console.error("Server error:", data.message);
        alert(data.message);
        break;
        
      default:
        console.log("Unknown message type:", data.type);
    }
  }, []);

  // WebRTC functions
  const createPeerConnection = useCallback((participantId) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      const videoElement = remoteVideosRef.current.get(participantId);
      if (videoElement) {
        videoElement.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "webrtc_ice_candidate",
          target_participant_id: participantId,
          data: { candidate: event.candidate }
        }));
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection to ${participantId} state:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed') {
        console.log(`Attempting to restart ICE for ${participantId}`);
        peerConnection.restartIce();
      }
    };

    peerConnectionsRef.current.set(participantId, peerConnection);
    return peerConnection;
  }, []);

  const handleParticipantsUpdate = useCallback(async (newParticipants) => {
    const currentParticipantIds = new Set(participants.map(p => p.id));
    const newParticipantIds = new Set(newParticipants.map(p => p.id));

    // Handle new participants (create offers)
    for (const participant of newParticipants) {
      if (participant.user_id !== userId && !currentParticipantIds.has(participant.id)) {
        try {
          const peerConnection = createPeerConnection(participant.id);
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "webrtc_offer",
              target_participant_id: participant.id,
              data: { offer }
            }));
          }
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      }
    }

    // Clean up disconnected participants
    for (const participantId of currentParticipantIds) {
      if (!newParticipantIds.has(participantId)) {
        const peerConnection = peerConnectionsRef.current.get(participantId);
        if (peerConnection) {
          peerConnection.close();
          peerConnectionsRef.current.delete(participantId);
        }
        remoteVideosRef.current.delete(participantId);
        pendingIceCandidates.current.delete(participantId); // Clean up queued ICE candidates
      }
    }
  }, [participants, userId, createPeerConnection]);

  const handleWebRTCSignaling = useCallback(async (data) => {
    const { type, from_participant_id, data: signalData } = data;

    try {
      let peerConnection = peerConnectionsRef.current.get(from_participant_id);

      if (type === "webrtc_offer") {
        if (!peerConnection) {
          peerConnection = createPeerConnection(from_participant_id);
        }

        // Reset connection if it's in failed state
        if (peerConnection.connectionState === 'failed') {
          peerConnection.close();
          peerConnection = createPeerConnection(from_participant_id);
        }

        // Implement polite peer pattern to avoid glare condition
        const isPolite = userId < from_participant_id; // Determine who should be polite based on user ID
        
        if (peerConnection.signalingState === 'have-local-offer' && !isPolite) {
          // Impolite peer ignores the offer during glare condition
          console.log(`🤝 Impolite peer ignoring offer from ${from_participant_id} during glare condition`);
          return;
        } else if (peerConnection.signalingState === 'have-local-offer' && isPolite) {
          // Polite peer accepts the offer and rolls back
          console.log(`🤝 Polite peer rolling back local offer for ${from_participant_id}`);
          await peerConnection.setLocalDescription({type: "rollback"});
        }

        try {
          logSignal(`Received signaling message: ${data.type}`, data);
          logSignal('Processing offer', signalData.offer);
          await peerConnection.setRemoteDescription(signalData.offer);
          logSignal('Set remote description (offer)', signalData.offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          logSignal('Created and set local description (answer)', answer);
          logSignal('Sending answer', answer);

          // Process any queued ICE candidates
          const queuedCandidates = pendingIceCandidates.current.get(from_participant_id) || [];
          for (const candidate of queuedCandidates) {
            try {
              await peerConnection.addIceCandidate(candidate);
            } catch (candidateError) {
              console.warn('Failed to add queued ICE candidate:', candidateError);
            }
          }
          pendingIceCandidates.current.delete(from_participant_id);

          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "webrtc_answer",
              target_participant_id: from_participant_id,
              data: { answer }
            }));
          }
          
          console.log(`✅ Successfully processed offer from ${from_participant_id}`);
        } catch (error) {
          console.error(`❌ Error processing offer from ${from_participant_id}:`, error);
          // Reset connection on error
          peerConnection.close();
          peerConnectionsRef.current.delete(from_participant_id);
        }
      } else if (type === "webrtc_answer" && peerConnection) {
        // Only process answer if signalingState is 'have-local-offer'
        if (peerConnection.signalingState === 'have-local-offer') {
          await peerConnection.setRemoteDescription(signalData.answer);
          logSignal('Set remote description (answer)', signalData.answer);
          // Process any queued ICE candidates
          const queuedCandidates = pendingIceCandidates.current.get(from_participant_id) || [];
          for (const candidate of queuedCandidates) {
            try {
              await peerConnection.addIceCandidate(candidate);
            } catch (candidateError) {
              logSignal('Failed to add queued ICE candidate', candidateError);
            }
          }
          pendingIceCandidates.current.delete(from_participant_id);
        } else {
          logSignal('Ignored remote answer: signaling state not have-local-offer', peerConnection.signalingState);
          // Clean up any queued ICE candidates for this peer
          pendingIceCandidates.current.delete(from_participant_id);
        }
      } else if (type === "webrtc_ice_candidate" && peerConnection) {
        // Only add ICE candidates if we have a remote description
        if (peerConnection.remoteDescription) {
          await peerConnection.addIceCandidate(signalData.candidate);
          logSignal('Processing ICE candidate', signalData.candidate);
          logSignal('Added ICE candidate', signalData.candidate);
        } else {
          // Queue the ICE candidate for later (limit to 50 to prevent infinite buildup)
          if (!pendingIceCandidates.current.has(from_participant_id)) {
            pendingIceCandidates.current.set(from_participant_id, []);
          }
          const candidateQueue = pendingIceCandidates.current.get(from_participant_id);
          if (candidateQueue.length < 50) {
            candidateQueue.push(signalData.candidate);
            logSignal(`Queued ICE candidate for ${from_participant_id} (total: ${candidateQueue.length})`, signalData.candidate);
          } else {
            console.warn(`⚠️ ICE candidate queue full for ${from_participant_id}, dropping candidate`);
          }
        }
      }
    } catch (error) {
      console.error("WebRTC signaling error:", error);
    }
  }, [createPeerConnection]);

  // Audio level monitoring for speaking indicator
  const setupAudioLevelMonitoring = useCallback((stream) => {
    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.85;
      
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setLocalAudioLevel(average);
        
        // Determine if speaking (threshold can be adjusted)
        const isSpeaking = average > 10 && !isMuted; // Only detect if not muted
        
        if (isSpeaking) {
          setSpeakingParticipants(prev => new Set([...prev, userId]));
          
          // Send speaking status to other participants
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "speaking_update",
              from_user_id: userId,
              is_speaking: true
            }));
          }
        } else {
          setSpeakingParticipants(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
          
          // Send speaking status to other participants
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "speaking_update",
              from_user_id: userId,
              is_speaking: false
            }));
          }
        }
        
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
    } catch (error) {
      console.error("Error setting up audio level monitoring:", error);
    }
  }, [userId, isMuted]);

  // Clean up audio monitoring
  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setLocalAudioLevel(0);
  }, []);

  // Media controls
  const toggleMute = useCallback(async () => {
    const newMutedState = !isMuted;
    
    try {
      if (isMuted) {
        // Turn microphone on (unmute)
        console.log("Turning microphone on (unmuting)...");
        if (!localStreamRef.current || !localStreamRef.current.getAudioTracks().length) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: !isCameraOff 
          });
          
          console.log("Got audio stream:", stream.getAudioTracks().length > 0);
          
          if (localStreamRef.current) {
            // Replace existing stream
            localStreamRef.current.getTracks().forEach(track => track.stop());
          }
          
          localStreamRef.current = stream;
          if (localVideoRef.current && !isCameraOff) {
            localVideoRef.current.srcObject = stream;
          }

          // Set up audio level monitoring for the new stream
          setupAudioLevelMonitoring(stream);

          // Update all peer connections with new stream
          peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
            try {
              const senders = peerConnection.getSenders();
              const audioSender = senders.find(sender => sender.track?.kind === 'audio');
              if (audioSender) {
                await audioSender.replaceTrack(stream.getAudioTracks()[0]);
                console.log(`Replaced audio track for participant ${participantId}`);
              } else {
                // Add audio track if it doesn't exist
                peerConnection.addTrack(stream.getAudioTracks()[0], stream);
                console.log(`Added audio track for participant ${participantId}`);
              }
              
              // Trigger renegotiation after track changes
              if (peerConnection.signalingState === 'stable') {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                  socketRef.current.send(JSON.stringify({
                    type: "offer",
                    offer: offer,
                    target: participantId
                  }));
                }
                console.log(`Sent renegotiation offer to participant ${participantId} for audio track change`);
              }
            } catch (error) {
              console.error(`Error updating audio track for participant ${participantId}:`, error);
            }
          });
        } else {
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = true;
            console.log("Enabled existing audio track");
          }
        }
        setIsMuted(false);
        console.log("Microphone turned on (unmuted) successfully");
      } else {
        // Turn microphone off (mute)
        console.log("Turning microphone off (muting)...");
        if (localStreamRef.current) {
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = false;
            console.log("Disabled audio track");
          }
        }
        setIsMuted(true);
        console.log("Microphone turned off (muted) successfully");
      }
      
      // Send status update to other participants
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "status_update",
          from_user_id: userId,
          muted: newMutedState,
          camera_off: isCameraOff,
          is_screen_sharing: isScreenSharing
        }));
      }
      
      // Also update local participant status immediately
      setParticipants(prev => prev.map(participant => {
        if (participant.user_id === userId) {
          return {
            ...participant,
            muted: newMutedState,
            camera_off: isCameraOff,
            is_screen_sharing: isScreenSharing
          };
        }
        return participant;
      }));
    } catch (error) {
      console.error("Microphone toggle error:", error);
      setMediaError("Failed to access microphone. Please check permissions.");
    }
  }, [isMuted, isCameraOff]);

  const toggleCamera = useCallback(async () => {
    const newCameraState = !isCameraOff;
    
    try {
      if (isCameraOff) {
        // Turn camera on
        console.log("Turning camera on...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true  // Always request audio to preserve the track
        });
        
        console.log("Got video stream:", stream.getVideoTracks().length > 0);
        console.log("Got audio stream:", stream.getAudioTracks().length > 0);
        
        // Set audio track to match current mute state
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !isMuted; // Enable based on current mute state
          console.log("Set audio track enabled to:", !isMuted);
        }
        
        if (localStreamRef.current) {
          // Stop existing tracks
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        localStreamRef.current = stream;
        
        // Wait for video ref to be available and set stream
        const setVideoStream = () => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            console.log("Set local video srcObject");
            console.log("Video element:", localVideoRef.current);
            console.log("Video srcObject:", localVideoRef.current.srcObject);
            console.log("Video readyState:", localVideoRef.current.readyState);
            console.log("Video paused:", localVideoRef.current.paused);
            
            // Force the video to play and ensure immediate visibility
            localVideoRef.current.play().then(() => {
              console.log("Video play started successfully");
              
              // Force a UI update to ensure the video is visible immediately
              localVideoRef.current.style.display = 'block';
              localVideoRef.current.style.opacity = '1';
              
            }).catch((playError) => {
              console.log("Video play promise rejected (this is normal):", playError);
            });

            // Add event listeners to debug video state
            localVideoRef.current.onloadedmetadata = () => {
              console.log("Video metadata loaded - dimensions:", localVideoRef.current.videoWidth, "x", localVideoRef.current.videoHeight);
            };
            
            localVideoRef.current.oncanplay = () => {
              console.log("Video can play");
            };
            
            localVideoRef.current.onplaying = () => {
              console.log("Video is playing");
            };
          } else {
            console.error("Local video ref is null! Retrying in 100ms...");
            // Retry after a short delay
            setTimeout(setVideoStream, 100);
          }
        };
        
        setVideoStream();

        // Update all peer connections with new stream
        peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
          try {
            const senders = peerConnection.getSenders();
            const videoSender = senders.find(sender => sender.track?.kind === 'video');
            if (videoSender) {
              await videoSender.replaceTrack(stream.getVideoTracks()[0]);
              console.log(`Replaced video track for participant ${participantId}`);
            } else {
              // Add video track if it doesn't exist
              peerConnection.addTrack(stream.getVideoTracks()[0], stream);
              console.log(`Added video track for participant ${participantId}`);
            }
            
            const audioSender = senders.find(sender => sender.track?.kind === 'audio');
            if (audioSender) {
              // Always replace audio track to maintain the connection
              await audioSender.replaceTrack(stream.getAudioTracks()[0]);
              console.log(`Replaced audio track for participant ${participantId}`);
            } else {
              // Add audio track if it doesn't exist
              peerConnection.addTrack(stream.getAudioTracks()[0], stream);
              console.log(`Added audio track for participant ${participantId}`);
            }
            
            // Trigger renegotiation after track changes
            if (peerConnection.signalingState === 'stable') {
              const offer = await peerConnection.createOffer();
              await peerConnection.setLocalDescription(offer);
              
              if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                  type: "offer",
                  offer: offer,
                  target: participantId
                }));
              }
              console.log(`Sent renegotiation offer to participant ${participantId} for video track change`);
            }
          } catch (error) {
            console.error(`Error updating video track for participant ${participantId}:`, error);
          }
        });
        
        setIsCameraOff(false);
        console.log("Camera turned on successfully");
      } else {
        // Turn camera off
        console.log("Turning camera off...");
        if (localStreamRef.current) {
          const videoTracks = localStreamRef.current.getVideoTracks();
          videoTracks.forEach(track => {
            track.stop();
          });

          // Remove video tracks from peer connections
          peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
            try {
              const senders = peerConnection.getSenders();
              const videoSender = senders.find(sender => sender.track?.kind === 'video');
              if (videoSender) {
                await videoSender.replaceTrack(null);
                console.log(`Removed video track for participant ${participantId}`);
                
                // Trigger renegotiation after removing video track
                if (peerConnection.signalingState === 'stable') {
                  const offer = await peerConnection.createOffer();
                  await peerConnection.setLocalDescription(offer);
                  
                  if (socketRef.current?.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({
                      type: "offer",
                      offer: offer,
                      target: participantId
                    }));
                  }
                  console.log(`Sent renegotiation offer to participant ${participantId} for video removal`);
                }
              }
            } catch (error) {
              console.error(`Error removing video track for participant ${participantId}:`, error);
            }
          });
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        setIsCameraOff(true);
        console.log("Camera turned off successfully");
      }
      
      // Send status update to other participants
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "status_update",
          from_user_id: userId,
          muted: isMuted,
          camera_off: newCameraState,
          is_screen_sharing: isScreenSharing
        }));
      }
      
      // Also update local participant status immediately
      setParticipants(prev => prev.map(participant => {
        if (participant.user_id === userId) {
          return {
            ...participant,
            muted: isMuted,
            camera_off: newCameraState,
            is_screen_sharing: isScreenSharing
          };
        }
        return participant;
      }));
      
      setMediaError(null);
    } catch (error) {
      console.error("Camera toggle error:", error);
      setMediaError("Failed to access camera. Please check permissions and ensure your camera isn't being used by another application.");
    }
  }, [isCameraOff, isMuted]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        // Start screen share
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        });
        
        // Replace video track in all peer connections with screen share
        peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
          try {
            const senders = peerConnection.getSenders();
            const videoSender = senders.find(sender => sender.track?.kind === 'video');
            if (videoSender) {
              await videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
              console.log(`Replaced video track with screen share for participant ${participantId}`);
            } else {
              peerConnection.addTrack(screenStream.getVideoTracks()[0], screenStream);
              console.log(`Added screen share track for participant ${participantId}`);
            }
            
            // Trigger renegotiation for screen share
            if (peerConnection.signalingState === 'stable') {
              const offer = await peerConnection.createOffer();
              await peerConnection.setLocalDescription(offer);
              
              if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                  type: "offer",
                  offer: offer,
                  target: participantId
                }));
              }
              console.log(`Sent renegotiation offer to participant ${participantId} for screen share`);
            }
          } catch (error) {
            console.error(`Error starting screen share for participant ${participantId}:`, error);
          }
        });

        // Update local video to show screen share
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Handle when user stops screen share via browser controls
        screenStream.getVideoTracks()[0].addEventListener('ended', async () => {
          setIsScreenSharing(false);
          
          // Switch back to camera if it was on
          if (!isCameraOff) {
            try {
              const cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: !isMuted 
              });
              
              // Replace screen share with camera in peer connections
              peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
                try {
                  const senders = peerConnection.getSenders();
                  const videoSender = senders.find(sender => sender.track?.kind === 'video');
                  if (videoSender) {
                    await videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
                    console.log(`Switched back to camera for participant ${participantId}`);
                    
                    // Trigger renegotiation
                    if (peerConnection.signalingState === 'stable') {
                      const offer = await peerConnection.createOffer();
                      await peerConnection.setLocalDescription(offer);
                      
                      if (socketRef.current?.readyState === WebSocket.OPEN) {
                        socketRef.current.send(JSON.stringify({
                          type: "offer",
                          offer: offer,
                          target: participantId
                        }));
                      }
                      console.log(`Sent renegotiation offer to participant ${participantId} for camera switch`);
                    }
                  }
                } catch (error) {
                  console.error(`Error switching back to camera for participant ${participantId}:`, error);
                }
              });

              if (localVideoRef.current) {
                localVideoRef.current.srcObject = cameraStream;
              }
              localStreamRef.current = cameraStream;
            } catch (error) {
              console.error("Error switching back to camera:", error);
            }
          } else {
            // Remove video track if camera was off
            peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
              try {
                const senders = peerConnection.getSenders();
                const videoSender = senders.find(sender => sender.track?.kind === 'video');
                if (videoSender) {
                  await videoSender.replaceTrack(null);
                  console.log(`Removed video track for participant ${participantId}`);
                  
                  // Trigger renegotiation
                  if (peerConnection.signalingState === 'stable') {
                    const offer = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offer);
                    
                    if (socketRef.current?.readyState === WebSocket.OPEN) {
                      socketRef.current.send(JSON.stringify({
                        type: "offer",
                        offer: offer,
                        target: participantId
                      }));
                    }
                    console.log(`Sent renegotiation offer to participant ${participantId} for video removal`);
                  }
                }
              } catch (error) {
                console.error(`Error removing video track for participant ${participantId}:`, error);
              }
            });
            
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = null;
            }
          }
          
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "status_update",
              from_user_id: userId,
              muted: isMuted,
              camera_off: isCameraOff,
              is_screen_sharing: false
            }));
          }
        });
        
        setIsScreenSharing(true);
      } else {
        // Stop screen share - switch back to camera or turn off video
        if (!isCameraOff) {
          const cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: !isMuted 
          });
          
          // Replace screen share with camera
          peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
            try {
              const senders = peerConnection.getSenders();
              const videoSender = senders.find(sender => sender.track?.kind === 'video');
              if (videoSender) {
                await videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
                console.log(`Manual switch back to camera for participant ${participantId}`);
                
                // Trigger renegotiation
                if (peerConnection.signalingState === 'stable') {
                  const offer = await peerConnection.createOffer();
                  await peerConnection.setLocalDescription(offer);
                  
                  if (socketRef.current?.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({
                      type: "offer",
                      offer: offer,
                      target: participantId
                    }));
                  }
                  console.log(`Sent renegotiation offer to participant ${participantId} for manual camera switch`);
                }
              }
            } catch (error) {
              console.error(`Error manually switching back to camera for participant ${participantId}:`, error);
            }
          });

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = cameraStream;
          }
          localStreamRef.current = cameraStream;
        } else {
          // Remove video track
          peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
            try {
              const senders = peerConnection.getSenders();
              const videoSender = senders.find(sender => sender.track?.kind === 'video');
              if (videoSender) {
                await videoSender.replaceTrack(null);
                console.log(`Manual video track removal for participant ${participantId}`);
                
                // Trigger renegotiation
                if (peerConnection.signalingState === 'stable') {
                  const offer = await peerConnection.createOffer();
                  await peerConnection.setLocalDescription(offer);
                  
                  if (socketRef.current?.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({
                      type: "offer",
                      offer: offer,
                      target: participantId
                    }));
                  }
                  console.log(`Sent renegotiation offer to participant ${participantId} for manual video removal`);
                }
              }
            } catch (error) {
              console.error(`Error manually removing video track for participant ${participantId}:`, error);
            }
          });
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
          }
        }
        
        setIsScreenSharing(false);
      }
      
      // Send status update
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "status_update",
          from_user_id: userId,
          muted: isMuted,
          camera_off: isCameraOff,
          is_screen_sharing: !isScreenSharing
        }));
      }
      
      // Also update local participant status immediately
      setParticipants(prev => prev.map(participant => {
        if (participant.user_id === userId) {
          return {
            ...participant,
            muted: isMuted,
            camera_off: isCameraOff,
            is_screen_sharing: !isScreenSharing
          };
        }
        return participant;
      }));
    } catch (error) {
      console.error("Screen share error:", error);
      if (error.name === 'NotAllowedError') {
        setMediaError("Screen sharing permission denied.");
      } else {
        setMediaError("Failed to start screen sharing.");
      }
    }
  }, [isScreenSharing, isCameraOff, isMuted]);

  const toggleHandRaise = useCallback(() => {
    const newHandRaisedState = !handRaised;
    setHandRaised(newHandRaisedState);
    
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "hand_raise",
        hand_raised: newHandRaisedState
      }));
    }
  }, [handRaised]);

  // Chat functions
  const sendMessage = useCallback(() => {
    if (newMessage.trim() && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "chat_message",
        message: newMessage.trim()
      }));
      setNewMessage("");
    }
  }, [newMessage]);

  const handleMessageKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Handle leaving session with backend cleanup
  const handleLeaveSession = useCallback(async () => {
    try {
      // Clean up local resources first
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      peerConnectionsRef.current.forEach(peerConnection => {
        peerConnection.close();
      });
      peerConnectionsRef.current.clear();
      remoteVideosRef.current.clear();

      // Close WebSocket connection
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }

      // Notify backend about leaving the session
      if (sessionInfo?.group?.id) {
        const result = await leaveSession(sessionInfo.group.id);
        if (result?.group_deleted) {
          setEndNotificationMessage("Study group has been automatically deleted since no participants remain.");
          setEndNotificationType("success");
          setShowEndNotification(true);
          return; // Don't call onLeaveSession immediately, wait for user acknowledgment
        } else if (result?.success) {
          setEndNotificationMessage("You have left the study session.");
          setEndNotificationType("success");
          setShowEndNotification(true);
          return;
        }
      }

      // If no backend result or error, just leave
      onLeaveSession();
    } catch (error) {
      console.error("Error leaving session:", error);
      setEndNotificationMessage("There was an error leaving the session, but you have been disconnected.");
      setEndNotificationType("error");
      setShowEndNotification(true);
    }
  }, [sessionInfo, leaveSession, onLeaveSession]);

  const handleEndNotificationClose = () => {
    setShowEndNotification(false);
    onLeaveSession();
  };

  // Clean up media streams and peer connections on unmount
  useEffect(() => {
    // Handle browser tab close/refresh - cleanup participants
    const handleBeforeUnload = async (event) => {
      try {
        // Call leave session to remove from participants
        await leaveSession(sessionInfo.group.id);
      } catch (error) {
        console.warn("Cleanup on beforeunload failed:", error);
      }
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Remove event listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Stop local media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      peerConnectionsRef.current.forEach(peerConnection => {
        peerConnection.close();
      });
      peerConnectionsRef.current.clear();
      remoteVideosRef.current.clear();
      
      // Also call leave session on unmount
      leaveSession(sessionInfo.group.id).catch(error => {
        console.warn("Cleanup on unmount failed:", error);
      });
    };
  }, [sessionInfo, leaveSession]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

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
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{roomInfo?.group_title}</h1>
          <p className="text-sm text-gray-300">{roomInfo?.group_subject}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>{participants.length} participants</span>
          </div>
          
          {mediaError && (
            <div className="text-red-400 text-sm max-w-xs">
              {mediaError}
            </div>
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

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Video area */}
        <div className="flex-1 p-4">
          {/* Local video preview */}
          <div className="mb-4">
            <h3 className="text-white mb-2 font-semibold">You (Camera: {isCameraOff ? 'OFF' : 'ON'})</h3>
            <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', maxWidth: '300px' }}>
              {!isCameraOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover bg-gray-800"
                  style={{ 
                    display: 'block',
                    minHeight: '200px'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white bg-gray-700">
                  <div className="text-center">
                    <VideoOff className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Camera Off</p>
                  </div>
                </div>
              )}
              
              {/* Speaking indicator overlay */}
              {speakingParticipants.has(userId) && (
                <div className="absolute top-2 right-2 bg-green-500 bg-opacity-90 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                  <Volume2 className="w-3 h-3" />
                  <SpeakingIndicator isActive={true} audioLevel={localAudioLevel} />
                </div>
              )}
              
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm flex items-center space-x-2">
                <span>You {isMuted && <span className="text-red-400">(Muted)</span>}
                {!isCameraOff && <span className="text-green-400 ml-1">(Camera On)</span>}</span>
                {!isMuted && (
                  <SpeakingIndicator 
                    isActive={speakingParticipants.has(userId)} 
                    audioLevel={localAudioLevel} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Other Participants */}
          {participants.length > 1 && (
            <div className="mb-4">
              <h3 className="text-white mb-2 font-semibold">Other Participants ({participants.length - 1})</h3>
            </div>
          )}

          {/* Participants grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {participants.filter(p => p.user_id !== userId).map((participant) => (
              <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {!participant.camera_off ? (
                  <video
                    ref={(el) => {
                      if (el) {
                        remoteVideosRef.current.set(participant.id, el);
                      }
                    }}
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
                
                {/* Speaking indicator overlay for remote participants */}
                {speakingParticipants.has(participant.user_id) && (
                  <div className="absolute top-2 right-2 bg-green-500 bg-opacity-90 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                    <Volume2 className="w-3 h-3" />
                    <SpeakingIndicator isActive={true} audioLevel={50} />
                  </div>
                )}
                
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm flex items-center space-x-2">
                  <span>
                    {participant.name}
                    {participant.muted && <span className="text-red-400 ml-1">(Muted)</span>}
                    {!participant.camera_off && <span className="text-green-400 ml-1">(Camera On)</span>}
                    {participant.is_screen_sharing && <span className="text-blue-400 ml-1">(Sharing)</span>}
                    {participant.hand_raised && <span className="text-yellow-400 ml-1">✋</span>}
                  </span>
                  {!participant.muted && (
                    <SpeakingIndicator 
                      isActive={speakingParticipants.has(participant.user_id)} 
                      audioLevel={50} 
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Show message if user is alone */}
          {participants.length === 1 && (
            <div className="text-center text-gray-400 mt-8">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You're the only one in this session right now.</p>
              <p className="text-sm mt-2">Share the session link to invite others!</p>
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 text-white flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-bold">Chat</h3>
            </div>
            
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message) => (
                <div key={message.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">{message.sender_name}</span>
                    <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                  </div>
                  <p className="text-sm">{message.message}</p>
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

      {/* Bottom controls */}
      <div className="bg-gray-800 p-4 flex justify-center items-center gap-4">
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

      {/* Session End Notification */}
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
