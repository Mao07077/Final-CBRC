import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Mic, MicOff, Video, VideoOff, Phone, MessageSquare, Users, Hand, Monitor, MonitorOff, Settings, Volume2
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

// Timer Display Component (optional ring timer)
const TimerDisplay = ({ remainingSeconds }) => {
  if (remainingSeconds === null) return null;

  const totalSeconds = 60 * 60; // 1 hour
  const progress = (remainingSeconds / totalSeconds) * 100; // percent remaining
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const color = remainingSeconds <= 300 ? '#ef4444' : remainingSeconds <= 600 ? '#f59e0b' : '#10b981';

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dash = (progress / 100) * circumference;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center justify-center">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle strokeWidth="8" stroke="#374151" fill="transparent" r={radius} cx="50" cy="50" />
          <circle
            strokeWidth="8"
            stroke={color}
            strokeDasharray={`${dash} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ color }} className="text-sm font-semibold">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
};

// NOTE: This component had structural corruption after a previous patch.
// Reintroducing the functional component wrapper to restore proper React structure.
const StudySessionRoom = ({ sessionInfo, userId, userName, onLeaveSession }) => {
  const { leaveSession } = useLearnTogetherStore();

  // Layout options (static)
  const LAYOUT_OPTIONS = [
    { value: "grid", label: "Grid View (Equal Tiles)" },
    { value: "spotlight", label: "Spotlight (Pin Participant)" },
    { value: "speaker", label: "Focus on Speaker" },
  ];

  const [showEndNotification, setShowEndNotification] = useState(false);
  const [endNotificationMessage, setEndNotificationMessage] = useState("");
  const [endNotificationType, setEndNotificationType] = useState("success");
  // WebSocket connection
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  
  // Local media state
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  
  // Room state
  const [participants, setParticipants] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [elapsedMap, setElapsedMap] = useState({});

  // Initialize participants with current user
  useEffect(() => {
    if (userId && userName) {
      setParticipants([{
        id: `user_${userId}`,
        user_id: userId,
        name: userName,
        muted: isMuted,
        camera_off: isCameraOff,
        is_screen_sharing: isScreenSharing,
        self: true
      }]);
    }
  }, [userId, userName, isMuted, isCameraOff, isScreenSharing]);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [layoutMode, setLayoutMode] = useState("grid");
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);
  
  // Speaking indicator state
  const [speakingParticipants, setSpeakingParticipants] = useState(new Set());
  const [currentSpeakerId, setCurrentSpeakerId] = useState(null);
  const currentSpeakerRef = useRef({ id: null, lastChange: 0 });
  const participantIdRef = useRef(null);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  
  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pendingIceCandidates = useRef(new Map());
  const chatContainerRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const remoteVideosRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const attachTokenRef = useRef(0);
  const [attachVersion, setAttachVersion] = useState(0);

  // --- Diagnostic Logging Helpers ---
  const logSignal = (msg, data) => console.log(`[SIGNAL] ${msg}`, data);
  const logStream = (msg, data) => console.log(`[STREAM] ${msg}`, data);
  const logPeer = (msg, data) => console.log(`[PEER] ${msg}`, data);

  // Autoplay unlock guard for remote media on first user interaction
  const autoplayUnlockedRef = useRef(false);
  // Track last successfully attached stream id per participant to dedupe attachment attempts
  const remoteAttachStateRef = useRef(new Map()); // participantId -> stream.id
  // Track in-flight attachment promises so we don't start parallel play() calls
  const remoteAttachInFlightRef = useRef(new Map()); // participantId -> boolean
  const attemptPlayAllRemote = useCallback(() => {
    try {
      remoteVideosRef.current.forEach((el, pid) => {
        if (!el) return;
        // Try play; if it fails due to policy, try muted then restore
        const prevMuted = el.muted;
        el.play().catch(async () => {
          try {
            el.muted = true;
            await el.play();
          } catch (_) { /* ignore */ }
          setTimeout(() => { try { el.muted = prevMuted; } catch(e){} }, 300);
        });
      });
    } catch (e) {
      console.warn('attemptPlayAllRemote error', e);
    }
  }, []);

  const setRemoteVideoElement = (participantId, el) => {
    try {
      if (el) {
        remoteVideosRef.current.set(participantId, el);

        const existingStream = remoteStreamsRef.current.get(participantId);
        if (!existingStream) return;

        // Skip if already attached & playing same stream
        const alreadyId = remoteAttachStateRef.current.get(participantId);
        if (alreadyId === existingStream.id && el.srcObject === existingStream && !el.paused) {
          return; // no work needed
        }

        // Attempt to attach and play with a small retry/backoff loop.
        // On some browsers autoplay with audio is blocked; temporarily muting
        // the element for the play() attempt often allows playback to start.
        let cancelled = false;

        const tryAttach = async (attempt = 1) => {
          if (cancelled) return;
          if (remoteAttachInFlightRef.current.get(participantId)) return; // guard parallel
          remoteAttachInFlightRef.current.set(participantId, true);
          console.debug('[attach] attempt', attempt, 'for', participantId);
          try {
            // Assign stream
            if (el.srcObject !== existingStream) {
              try {
                el.srcObject = existingStream;
              } catch (srcErr) {
                try { el.src = URL.createObjectURL(existingStream); } catch (e) {}
              }
            }

            const prevMuted = el.muted;

            try {
              if (el.paused) {
                await el.play();
              }
              // restore muted state shortly after successful play
              setTimeout(() => {
                try { el.muted = prevMuted; } catch (e) {}
              }, 300);
              console.debug('[attach] success', participantId, 'attempt', attempt);
              remoteAttachStateRef.current.set(participantId, existingStream.id);
              remoteAttachInFlightRef.current.delete(participantId);
              return;
            } catch (playErr) {
              console.debug('[attach] play failed', attempt, participantId, playErr);
              // Try again with muted=true (may satisfy autoplay policy)
              try {
                el.muted = true;
                if (el.paused) {
                  await el.play();
                }
                setTimeout(() => {
                  try { el.muted = prevMuted; } catch (e) {}
                }, 300);
                console.debug('[attach] success (muted) ', participantId, 'attempt', attempt);
                remoteAttachStateRef.current.set(participantId, existingStream.id);
                remoteAttachInFlightRef.current.delete(participantId);
                return;
              } catch (mutedErr) {
                console.debug('[attach] muted play failed', attempt, participantId, mutedErr);
                remoteAttachInFlightRef.current.delete(participantId);
                if (attempt < 2) { // fewer retries to reduce flicker
                  const backoff = attempt === 1 ? 350 : 800;
                  setTimeout(() => tryAttach(attempt + 1), backoff);
                } else {
                  console.warn('[attach] failed to play after attempts for', participantId);
                }
              }
            }
          } catch (e) {
            console.warn('[attach] unexpected error attaching stream for', participantId, e);
            remoteAttachInFlightRef.current.delete(participantId);
          }
        };

        tryAttach(1);

        // return a small cleanup hook in case the element is removed quickly
        // (we don't expose it here, but set a flag when element is removed)
        const observer = new MutationObserver(() => {
          if (!document.contains(el)) {
            cancelled = true;
            observer.disconnect();
          }
        });
        try { observer.observe(document, { childList: true, subtree: true }); } catch (e) { observer.disconnect(); }
      } else {
        remoteVideosRef.current.delete(participantId);
      }
    } catch (e) {
      console.warn('setRemoteVideoElement error', e);
    }
  };

  // Reconcile stored remote streams with mounted video elements.
  // This helps when layout changes or elements remount after a reflow.
  useEffect(() => {
    try {
      remoteStreamsRef.current.forEach((stream, participantId) => {
        const el = remoteVideosRef.current.get(participantId);
        if (!el) return;
        const attachedId = remoteAttachStateRef.current.get(participantId);
        const needsAttach = el.srcObject !== stream || attachedId !== stream.id;
        const needsPlay = el.paused && el.readyState >= 2;
        if (needsAttach || needsPlay) {
          console.debug('[reconcile] attaching/playing stream for', participantId, { needsAttach, needsPlay });
          try {
            if (needsAttach) {
              el.srcObject = stream;
              remoteAttachStateRef.current.set(participantId, stream.id);
            }
            if (needsPlay) {
              el.play().catch(() => {});
            }
          } catch (e) {
            try { el.src = URL.createObjectURL(stream); } catch (e2) {}
          }
        }
      });
    } catch (e) {
      console.warn('reconcile attach error', e);
    }
  }, [participants, layoutMode, attachVersion]);

  // Unlock autoplay for remote media on first user interaction
  useEffect(() => {
    if (autoplayUnlockedRef.current) return;
    const onFirstInteract = () => {
      if (autoplayUnlockedRef.current) return;
      autoplayUnlockedRef.current = true;
      attemptPlayAllRemote();
      window.removeEventListener('click', onFirstInteract);
      window.removeEventListener('keydown', onFirstInteract);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    const onVisibility = () => {
      if (!document.hidden) onFirstInteract();
    };
    window.addEventListener('click', onFirstInteract, { once: true });
    window.addEventListener('keydown', onFirstInteract, { once: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('click', onFirstInteract);
      window.removeEventListener('keydown', onFirstInteract);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [attemptPlayAllRemote]);

  // Initialize media on component mount
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        });
        
        localStreamRef.current = stream;
        
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
        }
        
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
        
        console.log("Media state sync - Audio:", audioTrack?.enabled, "Video:", !!videoTrack);
        console.log("UI state - Muted:", isMuted, "Camera off:", isCameraOff);
        
        if (localVideoRef.current) {
          const el = localVideoRef.current;
          console.log("Video element srcObject:", !!el.srcObject);
          console.log("Video element readyState:", el.readyState);
          console.log("Video element paused:", el.paused);
          console.log("Video element dimensions:", el.videoWidth, "x", el.videoHeight);
        }
      }
    };

    syncMediaState();
  }, [isMuted, isCameraOff]);

  // Centralized attachment of local stream to the video element.
  // We use an attachVersion token to avoid races from multiple concurrent attach attempts.
  useEffect(() => {
    const el = localVideoRef.current;
    const stream = localStreamRef.current;
    const currentToken = attachTokenRef.current;

    if (!el || !stream || isCameraOff) return;

    let cancelled = false;

    const handleLoaded = () => {
      if (cancelled || currentToken !== attachTokenRef.current) return;
      el.play().then(() => {
        console.log("Video play started successfully");
      }).catch((err) => {
        console.log("Play error:", err);
      });
    };

    try {
      el.srcObject = stream;
    } catch (err) {
      try {
        // fallback (very rare in modern browsers)
        el.src = URL.createObjectURL(stream);
      } catch (e) {
        console.warn('Failed to assign srcObject or fallback src:', e);
      }
    }

    el.addEventListener('loadedmetadata', handleLoaded, { once: true });
    if (el.readyState >= 1) {
      // Metadata already available (e.g., reattach), attempt to play immediately
      handleLoaded();
    }

    return () => {
      cancelled = true;
      try { el.removeEventListener('loadedmetadata', handleLoaded); } catch (e) {}
    };
  }, [attachVersion, layoutMode, isCameraOff]);

  // WebSocket connection setup
  useEffect(() => {
    if (!sessionInfo) return;

    const initializeSession = async () => {
      try {
        const { joinSession } = useLearnTogetherStore.getState();
        await joinSession(sessionInfo.group.id);

        const baseUrl = (import.meta.env.VITE_API_URL || "https://cbrcs-final.onrender.com").replace(/\/$/, '');
        const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
        let websocketPath = sessionInfo.websocket_url;
        if (!websocketPath.startsWith('/')) {
          websocketPath = '/' + websocketPath;
        }
        const wsUrl = `${wsBaseUrl}${websocketPath}`;

        console.log("Final WebSocket URL:", wsUrl);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          setConnectionStatus("connected");
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
      stopAudioLevelMonitoring();
    };
  }, [sessionInfo, userId, userName]);

  // Activity updater
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

    updateActivity();
    const activityInterval = setInterval(updateActivity, 2 * 60 * 1000);

    return () => {
      clearInterval(activityInterval);
    };
  }, [sessionInfo?.group?.id]);

  // Track last speaking state
  const lastSpeakingStateRef = useRef(new Map());

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case "connection_established":
        console.log("Connection established:", data);
        // Save assigned participant id for glare resolution
        participantIdRef.current = data.participant_id || participantIdRef.current;
        setRoomInfo(data.room_info);
        break;
        
      case "participants_update":
        console.log("Participants update:", data.participants);
        const currentUser = {
          id: `user_${userId}`,
          user_id: userId,
          name: userName,
          muted: isMuted,
          camera_off: isCameraOff,
          is_screen_sharing: isScreenSharing
        };
        const otherParticipants = data.participants.filter(p => p.user_id !== userId);
        const allParticipants = [currentUser, ...otherParticipants];
        
        setParticipants(allParticipants);
        setRoomInfo(data.room_info);
        handleParticipantsUpdate(allParticipants);
        break;
        
      case "chat_message":
        setChatMessages(prev => [...prev, data.message]);
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
        console.log(`${data.participant_name} ${data.hand_raised ? 'raised' : 'lowered'} their hand`);
        break;
        
      case "status_update":
        console.log("Status update received:", data);
        // Ignore status updates that originate from this client to avoid
        // echoing our own actions back and causing unintended toggles.
        if (data.from_user_id === userId) {
          console.log("Ignoring status_update for local user (echo):", data);
          break;
        }
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
        break;
        
      case "speaking_update": {
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
        // Debounced current speaker assignment to reduce layout thrash
        try {
          const now = Date.now();
          const cur = currentSpeakerRef.current;
          if (data.is_speaking) {
            if (cur.id !== data.from_user_id) {
              if (now - (cur.lastChange || 0) > 700) {
                currentSpeakerRef.current = { id: data.from_user_id, lastChange: now };
                setCurrentSpeakerId(data.from_user_id);
              }
            } else {
              // refresh timer while same speaker
              currentSpeakerRef.current.lastChange = now;
            }
          } else if (cur.id === data.from_user_id) {
            // Don't immediately clear speaker; wait for another to take over
            // This avoids rapid flicker when someone pauses briefly
          }
        } catch (e) {}
        break;
      }

      case "layout_update": {
        console.log("Layout update received:", data);
        // Apply layout mode and pinned participant coming from server
        if (data.layout_mode) {
          setLayoutMode(data.layout_mode);
        }
        if (typeof data.pinned_participant_id !== 'undefined') {
          setPinnedParticipantId(data.pinned_participant_id || null);
        }
        break;
      }
        
      case "webrtc_offer":
      case "webrtc_answer":
      case "webrtc_ice_candidate":
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

  // Timer effect: compute remaining seconds from session_started_at (1 hour limit)
  useEffect(() => {
    if (!roomInfo || !roomInfo.session_started_at) {
      setRemainingSeconds(null);
      return;
    }

    const start = new Date(roomInfo.session_started_at).getTime();
    const hourMs = 60 * 60 * 1000;

    const update = () => {
      const now = Date.now();
      const elapsed = now - start;
      const remaining = Math.max(0, Math.floor((hourMs - elapsed) / 1000));
      setRemainingSeconds(remaining);
    };

    update();
    const iv = setInterval(update, 1000);

    return () => clearInterval(iv);
  }, [roomInfo]);

  // Auto-end session when timer reaches zero (only call once)
  useEffect(() => {
    if (remainingSeconds === null) return;
    if (remainingSeconds > 0) return;

    // Timer expired; call endSession (mark inactive) once
    try {
      const { endSession } = useLearnTogetherStore.getState();
      if (sessionInfo?.group?.id) {
        endSession(sessionInfo.group.id, false).then(() => {
          console.log('Session auto-ended due to 1-hour limit');
        }).catch(err => console.warn('Auto-end failed', err));
      }
    } catch (e) {
      console.warn('Auto-end session error:', e);
    }
  }, [remainingSeconds, sessionInfo]);

  // Fetch recent session logs for this group
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        if (!sessionInfo?.group?.id) return;
        const response = await apiClient.get(`/api/study-groups/${sessionInfo.group.id}/session-logs`);
        if (response.data && response.data.success) {
          setSessionLogs(response.data.logs || []);
        }
      } catch (error) {
        console.warn('Failed to fetch session logs:', error);
      }
    };

    fetchLogs();
    const iv = setInterval(fetchLogs, 30 * 1000); // refresh logs every 30s
    return () => clearInterval(iv);
  }, [sessionInfo]);

  // Update per-participant elapsed-in-call every second
  useEffect(() => {
    if (!participants || participants.length === 0) {
      setElapsedMap({});
      return;
    }

    const tick = () => {
      const now = Date.now();
      const next = {};
      participants.forEach(p => {
        try {
          const joinedAt = p.joined_at ? Date.parse(p.joined_at) : null;
          if (joinedAt && !Number.isNaN(joinedAt)) {
            next[p.user_id] = Math.max(0, Math.floor((now - joinedAt) / 1000));
          } else {
            next[p.user_id] = null;
          }
        } catch (e) {
          next[p.user_id] = null;
        }
      });
      setElapsedMap(next);
    };

    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [participants]);

  // WebRTC functions
  // Renegotiation scheduler to coalesce multiple changes into one offer per peer
  const renegotiateTimersRef = useRef(new Map()); // participantId -> timeoutId
  const scheduleRenegotiation = useCallback((participantId) => {
    if (renegotiateTimersRef.current.has(participantId)) return;
    const t = setTimeout(async () => {
      renegotiateTimersRef.current.delete(participantId);
      const pc = peerConnectionsRef.current.get(participantId);
      if (!pc) return;
      try {
        if (pc.signalingState !== 'stable') return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'webrtc_offer',
            target_participant_id: participantId,
            data: { offer }
          }));
        }
      } catch (e) {
        console.warn('Renegotiation error for', participantId, e);
      }
    }, 200);
    renegotiateTimersRef.current.set(participantId, t);
  }, []);
  const createPeerConnection = useCallback((participantId) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      // Store stream so a later-mounted video element can attach to it.
      remoteStreamsRef.current.set(participantId, remoteStream);
      console.debug('[ontrack] received remote stream for', participantId, remoteStream);
      const videoElement = remoteVideosRef.current.get(participantId);
      if (videoElement) {
        // Dedupe attachment if same stream already applied
        const currentId = remoteAttachStateRef.current.get(participantId);
        if (currentId === remoteStream.id && videoElement.srcObject === remoteStream) {
          if (videoElement.paused) { videoElement.play().catch(()=>{}); }
        } else {
          console.debug('[ontrack] attaching stream to existing element', participantId);
          try {
            if (videoElement.srcObject !== remoteStream) {
              videoElement.srcObject = remoteStream;
            }
            if (videoElement.paused) { videoElement.play().catch(() => {}); }
            remoteAttachStateRef.current.set(participantId, remoteStream.id);
          } catch (e) {
            try { videoElement.src = URL.createObjectURL(remoteStream); } catch (e2) {}
          }
        }
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "webrtc_ice_candidate",
          target_participant_id: participantId,
          data: { candidate: event.candidate }
        }));
      }
    };

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

    // Debounce map for outbound offers: participantId -> timestamp
    if (!window.__outboundOffersTS) window.__outboundOffersTS = new Map();
    const OFFER_DEBOUNCE_MS = 5000;

    for (const participant of newParticipants) {
      if (participant.user_id === userId) continue; // skip self
      // Skip if we already have a connection object
      if (peerConnectionsRef.current.has(participant.id)) continue;
      // Offer debounce guard
      const lastTs = window.__outboundOffersTS.get(participant.id) || 0;
      const now = Date.now();
      if (now - lastTs < OFFER_DEBOUNCE_MS) continue;
      try {
        const peerConnection = createPeerConnection(participant.id);
        // Only create offer if signalingState is stable
        if (peerConnection.signalingState !== 'stable') continue;
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        window.__outboundOffersTS.set(participant.id, now);
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

    for (const participantId of currentParticipantIds) {
      if (!newParticipantIds.has(participantId)) {
        const peerConnection = peerConnectionsRef.current.get(participantId);
        if (peerConnection) {
          peerConnection.close();
          peerConnectionsRef.current.delete(participantId);
        }
        remoteVideosRef.current.delete(participantId);
        pendingIceCandidates.current.delete(participantId);
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

  // Use assigned participant ids for glare resolution (string lexicographic)
  const localPid = participantIdRef.current || '';
  const isPolite = String(localPid) < String(from_participant_id);
        
        if (peerConnection.signalingState === 'have-local-offer' && !isPolite) {
          console.log(`🤝 Impolite peer ignoring offer from ${from_participant_id} during glare condition`);
          return;
        } else if (peerConnection.signalingState === 'have-local-offer' && isPolite) {
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
          peerConnection.close();
          peerConnectionsRef.current.delete(from_participant_id);
        }
      } else if (type === "webrtc_answer" && peerConnection) {
        if (peerConnection.signalingState === 'have-local-offer') {
          await peerConnection.setRemoteDescription(signalData.answer);
          logSignal('Set remote description (answer)', signalData.answer);
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
          pendingIceCandidates.current.delete(from_participant_id);
        }
      } else if (type === "webrtc_ice_candidate" && peerConnection) {
        if (peerConnection.remoteDescription) {
          await peerConnection.addIceCandidate(signalData.candidate);
          logSignal('Processing ICE candidate', signalData.candidate);
          logSignal('Added ICE candidate', signalData.candidate);
        } else {
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

  // Audio level monitoring
  const setupAudioLevelMonitoring = useCallback((stream) => {
    try {
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
      const speakOn = 18;   // average level to consider speaking
      const speakOff = 12;  // fall-back threshold to stop speaking
      const stateRef = { speaking: false, lastEmit: 0 };

      const checkAudioLevel = () => {
        if (!analyserRef.current) return;

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setLocalAudioLevel(average);

        // Hysteresis on/off thresholds
        let nextSpeaking = stateRef.speaking;
        if (!stateRef.speaking && average >= speakOn && !isMuted) nextSpeaking = true;
        if (stateRef.speaking && (average <= speakOff || isMuted)) nextSpeaking = false;

        const now = performance.now();
        const shouldEmit = nextSpeaking !== stateRef.speaking || (now - stateRef.lastEmit) > 250;
        if (shouldEmit) {
          stateRef.speaking = nextSpeaking;
          stateRef.lastEmit = now;
          if (nextSpeaking) {
            setSpeakingParticipants(prev => new Set([...prev, userId]));
          } else {
            setSpeakingParticipants(prev => { const s = new Set(prev); s.delete(userId); return s; });
          }
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "speaking_update",
              from_user_id: userId,
              is_speaking: nextSpeaking
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
        console.log("Turning microphone on (unmuting)...");
        if (!localStreamRef.current || !localStreamRef.current.getAudioTracks().length) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: !isCameraOff 
          });
          
          console.log("Got audio stream:", stream.getAudioTracks().length > 0);
          
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
          }
          
          localStreamRef.current = stream;
          // Let the centralized attachment effect handle attaching the stream
          // to the video element to avoid race conditions.
          attachTokenRef.current += 1;
          setAttachVersion(v => v + 1);

          setupAudioLevelMonitoring(stream);

          peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
            try {
              const senders = peerConnection.getSenders();
              const audioSender = senders.find(sender => sender.track?.kind === 'audio');
              if (audioSender) {
                await audioSender.replaceTrack(stream.getAudioTracks()[0]);
                console.log(`Replaced audio track for participant ${participantId}`);
              } else {
                peerConnection.addTrack(stream.getAudioTracks()[0], stream);
                console.log(`Added audio track for participant ${participantId}`);
              }
              scheduleRenegotiation(participantId);
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
      
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "status_update",
          from_user_id: userId,
          muted: newMutedState,
          camera_off: isCameraOff,
          is_screen_sharing: isScreenSharing
        }));
      }
      
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
    const newOff = !isCameraOff;
    try {
      if (!newOff) {
        // Turning camera ON
        let existingStream = localStreamRef.current;
        const needVideo = !existingStream || !existingStream.getVideoTracks().length;
        if (needVideo) {
          const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const vTrack = camStream.getVideoTracks()[0];
          if (!vTrack) throw new Error('No video track');
          if (!existingStream) {
            existingStream = new MediaStream([]);
            localStreamRef.current = existingStream;
          }
          existingStream.addTrack(vTrack);
          // Replace / add for peers
          peerConnectionsRef.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(vTrack); else pc.addTrack(vTrack, existingStream);
            // schedule for this peer
            const id = [...peerConnectionsRef.current.entries()].find(([id, p]) => p === pc)?.[0];
            if (id) scheduleRenegotiation(id);
          });
          attachTokenRef.current += 1; setAttachVersion(v => v + 1);
        } else {
          // Enable existing track
          existingStream.getVideoTracks().forEach(t => t.enabled = true);
        }
      } else {
        // Turning camera OFF (just disable track to avoid transceiver stop flicker)
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = false; });
        }
      }
      setIsCameraOff(newOff);
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'status_update',
          from_user_id: userId,
          muted: isMuted,
          camera_off: newOff,
          is_screen_sharing: isScreenSharing
        }));
      }
      setParticipants(prev => prev.map(p => p.user_id === userId ? { ...p, camera_off: newOff } : p));
      setMediaError(null);
    } catch (e) {
      console.error('toggleCamera error', e);
      setMediaError('Failed to toggle camera');
    }
  }, [isCameraOff, isMuted, isScreenSharing]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        });
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        localStreamRef.current = screenStream;
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
            scheduleRenegotiation(participantId);
          } catch (error) {
            console.error(`Error starting screen share for participant ${participantId}:`, error);
          }
        });

        if (localVideoRef.current) {
          // Configure element flags and let centralized attachment effect
          // assign the stream and call play().
          localVideoRef.current.muted = true;
          localVideoRef.current.playsInline = true;
          localVideoRef.current.style.display = 'block';
          localVideoRef.current.style.opacity = '1';
        }
        attachTokenRef.current += 1;
        setAttachVersion(v => v + 1);
        
        screenStream.getVideoTracks()[0].addEventListener('ended', async () => {
          setIsScreenSharing(false);
          if (!isCameraOff) {
            try {
              const cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: !isMuted 
              });
              
              peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
                try {
                  const senders = peerConnection.getSenders();
                  const videoSender = senders.find(sender => sender.track?.kind === 'video');
                  if (videoSender) {
                    await videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
                    console.log(`Switched back to camera for participant ${participantId}`);
                    
                    scheduleRenegotiation(participantId);
                  }
                } catch (error) {
                  console.error(`Error switching back to camera for participant ${participantId}:`, error);
                }
              });

              // Let the centralized effect attach the camera stream.
              localStreamRef.current = cameraStream;
              attachTokenRef.current += 1;
              setAttachVersion(v => v + 1);
            } catch (error) {
              console.error("Error switching back to camera:", error);
            }
          } else {
            peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
              try {
                const senders = peerConnection.getSenders();
                const videoSender = senders.find(sender => sender.track?.kind === 'video');
                if (videoSender) {
                  await videoSender.replaceTrack(null);
                  console.log(`Removed video track for participant ${participantId}`);
                  
                  scheduleRenegotiation(participantId);
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
        if (!isCameraOff) {
          const cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: !isMuted 
          });
          
          peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
            try {
              const senders = peerConnection.getSenders();
              const videoSender = senders.find(sender => sender.track?.kind === 'video');
              if (videoSender) {
                await videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
                console.log(`Manual switch back to camera for participant ${participantId}`);
                
                  scheduleRenegotiation(participantId);
              }
            } catch (error) {
              console.error(`Error manually switching back to camera for participant ${participantId}:`, error);
            }
          });

          // Let centralized effect attach stream instead of setting srcObject here
          localStreamRef.current = cameraStream;
          attachTokenRef.current += 1;
          setAttachVersion(v => v + 1);
        } else {
          peerConnectionsRef.current.forEach(async (peerConnection, participantId) => {
            try {
              const senders = peerConnection.getSenders();
              const videoSender = senders.find(sender => sender.track?.kind === 'video');
              if (videoSender) {
                await videoSender.replaceTrack(null);
                console.log(`Manual video track removal for participant ${participantId}`);
                
                  scheduleRenegotiation(participantId);
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
      
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "status_update",
          from_user_id: userId,
          muted: isMuted,
          camera_off: isCameraOff,
          is_screen_sharing: !isScreenSharing
        }));
      }
      
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

  // Handle leaving session
  const handleLeaveSession = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      peerConnectionsRef.current.forEach(peerConnection => {
        peerConnection.close();
      });
      peerConnectionsRef.current.clear();
      remoteVideosRef.current.clear();

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }

      if (sessionInfo?.group?.id) {
        const result = await leaveSession(sessionInfo.group.id);
        if (result?.group_deleted) {
          setEndNotificationMessage("Study group has been automatically deleted since no participants remain.");
          setEndNotificationType("success");
          setShowEndNotification(true);
          return;
        } else if (result?.success) {
          setEndNotificationMessage("You have left the study session.");
          setEndNotificationType("success");
          setShowEndNotification(true);
          return;
        }
      }

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

  // Clean up on unmount
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      try {
        await leaveSession(sessionInfo.group.id);
      } catch (error) {
        console.warn("Cleanup on beforeunload failed:", error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      peerConnectionsRef.current.forEach(peerConnection => {
        peerConnection.close();
      });
      peerConnectionsRef.current.clear();
      remoteVideosRef.current.clear();
      
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

  const formatDuration = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '-';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getElapsedClass = (seconds) => {
    if (seconds == null) return 'text-gray-300';
    // thresholds: >= 59m -> red, >= 55m -> orange, else green/neutral
    if (seconds >= 59 * 60) return 'text-red-400';
    if (seconds >= 55 * 60) return 'text-yellow-400';
    return 'text-green-300';
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

  // Handle layout change (do not toggle camera here — that caused the camera
  // to be switched off when layout changes e.g. pin/spotlight). The attachment
  // effect will reapply the local stream if needed.
  const handleLayoutChange = (newLayout) => {
    setLayoutMode(newLayout);
    // No side-effects on camera state to avoid accidental toggles during layout re-render.
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{roomInfo?.group_title}</h1>
          <p className="text-sm text-gray-300">{roomInfo?.group_subject}</p>
          {remainingSeconds !== null && (
            <p className="text-xs text-yellow-300 mt-1">Time remaining: {new Date(remainingSeconds * 1000).toISOString().substr(11, 8)}</p>
          )}
          {elapsedMap && elapsedMap[userId] != null && (
            <p className={`mt-1 text-lg font-semibold ${getElapsedClass(elapsedMap[userId])}`}>You: {formatDuration(elapsedMap[userId])}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLogs(v => !v)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
          >
            {showLogs ? 'Hide' : 'Show'} History
          </button>

          {remainingSeconds !== null && (
            <div className={`px-3 py-1 rounded ${remainingSeconds <= 300 ? 'bg-red-600' : 'bg-blue-600'} text-white text-sm`}>
              {new Date(remainingSeconds * 1000).toISOString().substr(11, 8)}
            </div>
          )}

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

      {/* Session history panel */}
      {showLogs && (
        <div className="absolute right-6 top-20 z-50 w-96 max-w-[90vw] bg-white text-gray-900 rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-semibold">Session History</div>
            <div className="text-xs text-gray-500">Recent</div>
          </div>
          <div className="p-3 max-h-64 overflow-y-auto">
            {sessionLogs.length === 0 && (
              <div className="text-sm text-gray-600">No recent sessions found.</div>
            )}
            {sessionLogs.map((log) => (
              <div key={log._id || `${log.user_id}_${log.joined_at}`} className="mb-3 last:mb-0">
                <div className="text-sm font-semibold">{log.user_name || log.user_id}</div>
                <div className="text-xs text-gray-500">{formatTime(log.joined_at)} — {formatTime(log.left_at)} ({formatDuration(log.duration_seconds)})</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Video area */}
        <div className="flex-1 p-4">
          {participants.length > 1 && (
            <div className="mb-4">
              <h3 className="text-white mb-2 font-semibold">Other Participants ({participants.length - 1})</h3>
            </div>
          )}

          <div className="mb-4 flex gap-4 items-center relative">
            <button
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Settings"
              onClick={() => setShowSettings(v => !v)}
            >
              <Settings className="w-6 h-6" />
            </button>
            {showSettings && (
              <>
                <div className="hidden md:block absolute z-50 top-12 left-0 bg-white text-gray-900 rounded-lg shadow-lg p-4 min-w-[200px] border border-gray-200 animate-fade-in">
                  <div className="mb-2 font-semibold text-base text-gray-800">Layout Options</div>
                  <div className="flex flex-col gap-2">
                    {LAYOUT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        className={`text-left px-3 py-2 rounded hover:bg-blue-100 ${layoutMode === opt.value ? 'bg-blue-200 font-bold' : ''}`}
                        onClick={() => handleLayoutChange(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {layoutMode === "spotlight" && (
                    <div className="mt-4">
                      <div className="font-semibold text-sm mb-1">Pin Participant</div>
                      <select
                        value={pinnedParticipantId || ""}
                        onChange={e => setPinnedParticipantId(e.target.value)}
                        className="w-full bg-gray-100 text-gray-900 rounded px-2 py-1 border"
                      >
                        <option value="">Select...</option>
                        {participants.map(p => (
                          <option key={p.id} value={p.id}>{p.name}{p.user_id === userId ? " (You)" : ""}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className={`md:hidden fixed inset-0 z-50 flex items-end justify-center ${showSettings ? '' : 'pointer-events-none'}`} aria-hidden={!showSettings}>
                  <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowSettings(false)} />
                  <div className="relative w-full max-w-2xl bg-white rounded-t-xl p-4 border-t border-gray-200">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-semibold text-base text-gray-800">Layout Options</div>
                      <button onClick={() => setShowSettings(false)} className="text-gray-600">Close</button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {LAYOUT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          className={`text-left px-3 py-3 rounded hover:bg-gray-100 ${layoutMode === opt.value ? 'bg-blue-200 font-bold' : ''}`}
                          onClick={() => handleLayoutChange(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {layoutMode === "spotlight" && (
                      <div className="mt-4">
                        <div className="font-semibold text-sm mb-1">Pin Participant</div>
                        <select
                          value={pinnedParticipantId || ""}
                          onChange={e => setPinnedParticipantId(e.target.value)}
                          className="w-full bg-gray-100 text-gray-900 rounded px-2 py-2 border"
                        >
                          <option value="">Select...</option>
                          {participants.map(p => (
                            <option key={p.id} value={p.id}>{p.name}{p.user_id === userId ? " (You)" : ""}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            <span className="text-white font-semibold ml-2">Layout: {LAYOUT_OPTIONS.find(opt => opt.value === layoutMode)?.label}</span>
          </div>

          {(() => {
            const screenShares = [];
            if (isScreenSharing) {
              screenShares.push({ id: 'self_screen', name: userName, is_screen_sharing: true, camera_off: false, muted: isMuted, hand_raised: handRaised, user_id: userId, self: true });
            }
            participants.forEach(p => {
              if (p.is_screen_sharing && p.user_id !== userId) screenShares.push({ ...p, self: false });
            });

            const participantTiles = participants.filter(p => !screenShares.some(s => s.user_id === p.user_id && s.self)).filter(p => p.user_id !== userId);

            if (layoutMode === "spotlight" && pinnedParticipantId) {
              const pinned = participants.find(p => p.id === pinnedParticipantId);
              const others = [
                ...participants.filter(p => p.id !== pinnedParticipantId),
                ...((!participants.some(p => p.user_id === userId) && pinnedParticipantId !== `user_${userId}`) ? [{ id: `user_${userId}`, user_id: userId, name: userName, muted: isMuted, camera_off: isCameraOff, is_screen_sharing: isScreenSharing, hand_raised: handRaised, self: true }] : [])
              ];
              return (
                <div className="flex w-full gap-4 flex-col md:flex-row">
                  <div className="flex-shrink-0 w-full md:w-[480px]">
                    {pinned && (
                      <div key={pinned.id} className="relative bg-blue-900 rounded-lg overflow-hidden border-4 border-blue-400 aspect-video min-h-[180px] w-full">
                        {!pinned.camera_off ? (
                          <video
                            ref={el => {
                              if (pinned.user_id === userId) {
                                localVideoRef.current = el;
                              } else {
                                setRemoteVideoElement(pinned.id, el);
                              }
                            }}
                            autoPlay
                            muted={pinned.user_id === userId}
                            playsInline
                            className="w-full h-full object-cover"
                            style={{ minHeight: '180px' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white bg-gray-700">
                            <div className="text-center">
                              <VideoOff className="w-12 h-12 mx-auto mb-2" />
                              <p className="text-base">{pinned.name}</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-blue-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                          <span>Pinned</span>
                          {pinned.user_id === userId && <span className="ml-2">(You)</span>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 flex-1 min-w-0">
                    {others.map(participant => (
                      <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video min-h-[80px] flex-shrink-0 w-full md:w-[220px]">
                        {!participant.camera_off ? (
                          <video
                            ref={participant.self ? localVideoRef : el => { setRemoteVideoElement(participant.id, el); }}
                            autoPlay
                            muted={participant.self}
                            playsInline
                            className="w-full h-full object-cover"
                            style={{ minHeight: '80px' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white bg-gray-700">
                            <div className="text-center">
                              <VideoOff className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-xs">{participant.self ? 'You' : participant.name}</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center space-x-2">
                          <div className="flex flex-col">
                            <span>
                              {participant.self ? 'You' : participant.name}
                              {participant.muted && <span className="text-red-400 ml-1">(Muted)</span>}
                              {!participant.camera_off && <span className="text-green-400 ml-1">(Camera On)</span>}
                              {participant.is_screen_sharing && <span className="text-blue-400 ml-1">(Sharing)</span>}
                              {participant.hand_raised && <span className="text-yellow-400 ml-1">✋</span>}
                            </span>
                            <span className={`text-xs ${getElapsedClass(elapsedMap && elapsedMap[participant.user_id] != null ? elapsedMap[participant.user_id] : null)}`}>{elapsedMap && elapsedMap[participant.user_id] != null ? formatDuration(elapsedMap[participant.user_id]) : ''}</span>
                          </div>
                          {!participant.muted && (
                            <SpeakingIndicator 
                              isActive={speakingParticipants.has(participant.user_id)} 
                              audioLevel={participant.self ? localAudioLevel : 50} 
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (layoutMode === "speaker") {
              const speakerId = currentSpeakerId || Array.from(speakingParticipants)[0];
              const speaker = participants.find(p => p.user_id === speakerId);
              const others = [
                ...participants.filter(p => p.user_id !== speakerId),
                ...((!participants.some(p => p.user_id === userId) && speakerId !== userId) ? [{ id: `user_${userId}`, user_id: userId, name: userName, muted: isMuted, camera_off: isCameraOff, is_screen_sharing: isScreenSharing, hand_raised: handRaised, self: true }] : [])
              ];
              return (
                <div className="flex w-full gap-4 flex-col md:flex-row">
                  <div className="flex-shrink-0 w-full md:w-[480px]">
                    {speaker && (
                      <div key={speaker.id} className="relative bg-green-900 rounded-lg overflow-hidden border-4 border-green-400 aspect-video min-h-[180px] w-full">
                        {!speaker.camera_off ? (
                          <video
                            ref={el => {
                              if (speaker.user_id === userId) {
                                localVideoRef.current = el;
                              } else {
                                setRemoteVideoElement(speaker.id, el);
                              }
                            }}
                            autoPlay
                            muted={speaker.user_id === userId}
                            playsInline
                            className="w-full h-full object-cover"
                            style={{ minHeight: '180px' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white bg-gray-700">
                            <div className="text-center">
                              <VideoOff className="w-12 h-12 mx-auto mb-2" />
                              <p className="text-base">{speaker.name}</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-green-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                          <span>Speaking</span>
                          {speaker.user_id === userId && <span className="ml-2">(You)</span>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 flex-1 min-w-0">
                    {others.map(participant => (
                      <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video min-h-[80px] flex-shrink-0 w-full md:w-[220px]">
                        {!participant.camera_off ? (
                          <video
                            ref={participant.self ? localVideoRef : el => { setRemoteVideoElement(participant.id, el); }}
                            autoPlay
                            muted={participant.self}
                            playsInline
                            className="w-full h-full object-cover"
                            style={{ minHeight: '80px' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white bg-gray-700">
                            <div className="text-center">
                              <VideoOff className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-xs">{participant.self ? 'You' : participant.name}</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center space-x-2">
                          <div className="flex flex-col">
                            <span>
                              {participant.self ? 'You' : participant.name}
                              {participant.muted && <span className="text-red-400 ml-1">(Muted)</span>}
                              {!participant.camera_off && <span className="text-green-400 ml-1">(Camera On)</span>}
                              {participant.is_screen_sharing && <span className="text-blue-400 ml-1">(Sharing)</span>}
                              {participant.hand_raised && <span className="text-yellow-400 ml-1">✋</span>}
                            </span>
                            <span className={`text-xs ${getElapsedClass(elapsedMap && elapsedMap[participant.user_id] != null ? elapsedMap[participant.user_id] : null)}`}>{elapsedMap && elapsedMap[participant.user_id] != null ? formatDuration(elapsedMap[participant.user_id]) : ''}</span>
                          </div>
                          {!participant.muted && (
                            <SpeakingIndicator 
                              isActive={speakingParticipants.has(participant.user_id)} 
                              audioLevel={participant.self ? localAudioLevel : 50} 
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            const allTiles = [
              ...screenShares.map(s => ({ ...s, isScreen: true })),
              !isScreenSharing && { id: `user_${userId}`, name: userName, camera_off: isCameraOff, muted: isMuted, hand_raised: handRaised, user_id: userId, self: true },
              ...participantTiles
            ].filter(Boolean);
            return (
              <div className="grid gap-3 justify-center items-start w-full" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))` }}>
                {allTiles.map(tile => (
                  <div key={tile.id} className="relative bg-gray-800 rounded-lg overflow-hidden flex-shrink-0" style={{ aspectRatio: '16/9', minHeight: tile.isScreen ? '180px' : '120px' }}>
                    {!tile.camera_off ? (
                      <video
                        ref={tile.self ? localVideoRef : el => { setRemoteVideoElement(tile.id, el); }}
                        autoPlay
                        muted={tile.self}
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ minHeight: tile.isScreen ? '180px' : '120px' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white bg-gray-700">
                        <div className="text-center">
                          <VideoOff className={tile.isScreen ? "w-12 h-12 mx-auto mb-2" : "w-8 h-8 mx-auto mb-2"} />
                          <p className={tile.isScreen ? "text-base" : "text-xs"}>{tile.name}</p>
                        </div>
                      </div>
                    )}
                    {tile.isScreen && (
                      <div className="absolute top-2 left-2 bg-blue-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                        <Monitor className="w-4 h-4" />
                        <span>Screen Sharing</span>
                        {tile.self && <span className="ml-2">(You)</span>}
                      </div>
                    )}
                    {tile.self && !tile.isScreen && !tile.muted && (
                      <div className="absolute top-2 right-2 bg-green-500 bg-opacity-90 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                        <Volume2 className="w-3 h-3" />
                        <SpeakingIndicator isActive={speakingParticipants.has(userId)} audioLevel={localAudioLevel} />
                      </div>
                    )}
                    {!tile.self && !tile.isScreen && speakingParticipants.has(tile.user_id) && (
                      <div className="absolute top-2 right-2 bg-green-500 bg-opacity-90 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                        <Volume2 className="w-3 h-3" />
                        <SpeakingIndicator isActive={true} audioLevel={50} />
                      </div>
                    )}
                    <div className={`absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center space-x-2 ${tile.self ? 'text-sm' : ''}`}>
                      <div className="flex flex-col">
                        <span>
                          {tile.self ? 'You' : tile.name}
                          {tile.muted && <span className="text-red-400 ml-1">(Muted)</span>}
                          {!tile.camera_off && <span className="text-green-400 ml-1">(Camera On)</span>}
                          {tile.is_screen_sharing && <span className="text-blue-400 ml-1">(Sharing)</span>}
                          {tile.hand_raised && <span className="text-yellow-400 ml-1">✋</span>}
                        </span>
                        <span className="text-xs text-gray-300">{elapsedMap && elapsedMap[tile.user_id] != null ? formatDuration(elapsedMap[tile.user_id]) : ''}</span>
                      </div>
                      {!tile.muted && !tile.isScreen && (
                        <SpeakingIndicator 
                          isActive={speakingParticipants.has(tile.user_id)} 
                          audioLevel={50} 
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {participants.length === 1 && (
            <div className="text-center text-gray-400 mt-8">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You're the only one in this session right now.</p>
              <p className="text-sm mt-2">Share the session link to invite others!</p>
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        <div
          className={`fixed bottom-4 right-4 z-50 bg-gray-900 bg-opacity-95 text-white flex flex-col shadow-2xl rounded-xl transition-all duration-300 ${showChat ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
          style={{ width: '320px', maxWidth: '90vw', height: '420px', maxHeight: '60vh' }}
        >
          <div className="p-3 border-b border-gray-700 flex justify-between items-center rounded-t-xl">
            <h3 className="font-bold text-base">Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-400 hover:text-white bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-xl shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close chat"
              title="Close chat"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: '260px' }}>
            {chatMessages.map((message) => (
              <div key={message.id} className="bg-gray-700 rounded-lg p-2">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-xs">{message.sender_name}</span>
                  <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                </div>
                <p className="text-xs break-words">{message.message}</p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-700 rounded-b-xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleMessageKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-2 py-1 bg-gray-700 rounded-lg text-white placeholder-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-700 text-xs"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-gray-800 p-4 flex flex-wrap justify-center items-center gap-3 sm:gap-4 w-full">
        {/* Local elapsed pill (always visible) */}
        <div className="absolute left-4 bottom-6 z-50">
          <div className={`px-3 py-1 rounded-full bg-black bg-opacity-60 text-white text-sm font-medium ${getElapsedClass(elapsedMap && elapsedMap[userId] != null ? elapsedMap[userId] : null)}`}>
            In call: {elapsedMap && elapsedMap[userId] != null ? formatDuration(elapsedMap[userId]) : '—'}
          </div>
        </div>
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full flex-1 min-w-[48px] max-w-[56px] ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-6 h-6 text-white mx-auto" /> : <Mic className="w-6 h-6 text-white mx-auto" />}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full flex-1 min-w-[48px] max-w-[56px] ${isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={isCameraOff ? "Turn camera on" : "Turn camera off"}
        >
          {isCameraOff ? <VideoOff className="w-6 h-6 text-white mx-auto" /> : <Video className="w-6 h-6 text-white mx-auto" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full flex-1 min-w-[48px] max-w-[56px] ${isScreenSharing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          {isScreenSharing ? <MonitorOff className="w-6 h-6 text-white mx-auto" /> : <Monitor className="w-6 h-6 text-white mx-auto" />}
        </button>

        <button
          onClick={toggleHandRaise}
          className={`p-3 rounded-full flex-1 min-w-[48px] max-w-[56px] ${handRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={handRaised ? "Lower hand" : "Raise hand"}
        >
          <Hand className="w-6 h-6 text-white mx-auto" />
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-3 rounded-full flex-1 min-w-[48px] max-w-[56px] ${showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title="Toggle chat"
        >
          <MessageSquare className="w-6 h-6 text-white mx-auto" />
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-full flex-1 min-w-[48px] max-w-[56px] bg-gray-600 hover:bg-gray-700"
          title="Settings"
        >
          <Settings className="w-6 h-6 text-white mx-auto" />
        </button>
      </div>

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