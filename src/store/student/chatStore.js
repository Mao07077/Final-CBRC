import { create } from "zustand";
import messageService from "../../services/messageService";
import useAuthStore from "../authStore";

const useChatStore = create((set, get) => ({
  conversations: {},
  activeConversationId: null,
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      const conversations = await messageService.getStudentConversations(userData.id_number);
      set({ 
        conversations, 
        activeConversationId: Object.keys(conversations)[0] || null,
        isLoading: false 
      });
    } catch (error) {
      console.error("Chat fetch error:", error);
      set({ 
        conversations: {},
        activeConversationId: null,
        isLoading: false, 
        error: "Failed to load conversations. Please try again later." 
      });
    }
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  // Create a new conversation entry for an instructor (or open existing) and load messages
  createOrOpenConversation: async (instructor) => {
    const { conversations } = get();
    const instructorId = instructor.id_number || instructor._id || instructor.id;
    if (!instructorId) return;

    // If conversation already exists, just open it
    if (conversations[instructorId]) {
      set({ activeConversationId: instructorId });
      return;
    }

    // Otherwise, create a placeholder convo and try to load existing messages
    const { userData } = useAuthStore.getState();
    const studentId = userData?.id_number;

    // optimistic create
    set((state) => ({
      conversations: {
        ...state.conversations,
        [instructorId]: {
          id: instructorId,
          name: `${instructor.firstname || ''} ${instructor.lastname || ''}`.trim() || instructor.name,
          role: "instructor",
          messages: [],
          lastMessage: null,
        },
      },
      activeConversationId: instructorId,
    }));

    try {
      // load past messages (if any)
      if (studentId) {
        const messages = await messageService.getMessages(studentId, instructorId);
        const msgs = Array.isArray(messages) ? messages : (messages.messages || []);

        set((state) => ({
          conversations: {
            ...state.conversations,
            [instructorId]: {
              ...state.conversations[instructorId],
              messages: msgs,
              lastMessage: msgs.length ? msgs[msgs.length - 1] : null,
            },
          },
        }));
      }
    } catch (error) {
      console.error('Failed to load messages for new conversation', error);
    }
  },

  sendMessage: async (text) => {
    const { activeConversationId, conversations } = get();
    const { userData } = useAuthStore.getState();
    
    if (!activeConversationId || !userData?.id_number || !text.trim()) return;

    const tempMessage = { 
      _id: `temp_${Date.now()}`, 
      sender_id: userData.id_number,
      receiver_id: activeConversationId,
      message: text.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    // Optimistically add message
    set((state) => ({
      conversations: {
        ...state.conversations,
        [activeConversationId]: {
          ...state.conversations[activeConversationId],
          messages: [...(state.conversations[activeConversationId]?.messages || []), tempMessage],
          lastMessage: tempMessage
        },
      },
    }));

    try {
      const result = await messageService.sendMessage({
        sender_id: userData.id_number,
        receiver_id: activeConversationId,
        message: text.trim()
      });

      // Replace temp message with real message
      set((state) => ({
        conversations: {
          ...state.conversations,
          [activeConversationId]: {
            ...state.conversations[activeConversationId],
            messages: state.conversations[activeConversationId].messages.map(msg => 
              msg._id === tempMessage._id ? result.message : msg
            ),
            lastMessage: result.message
          },
        },
      }));
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove the optimistic message on error
      set((state) => ({
        conversations: {
          ...state.conversations,
          [activeConversationId]: {
            ...state.conversations[activeConversationId],
            messages: state.conversations[activeConversationId].messages.filter(
              m => m._id !== tempMessage._id
            ),
          },
        },
        error: "Failed to send message"
      }));
    }
  },

  clearError: () => set({ error: null }),
}));

export default useChatStore;
