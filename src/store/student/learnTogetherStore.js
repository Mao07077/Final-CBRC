import { create } from "zustand";
import apiClient from "../../api/axios";
import useAuthStore from "../authStore";

const useLearnTogetherStore = create((set, get) => ({
  groups: [],
  isModalOpen: false,
  isLoading: false,
  error: null,
  showOnlyActiveStudySessions: false, // Toggle for filtering live sessions

  fetchGroups: async (activeOnly = false) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch active sessions or all groups based on parameter
      const endpoint = activeOnly ? '/api/study-groups/active' : '/api/study-groups';
      console.log(`Fetching groups from endpoint: ${endpoint}`); // Debug log
      
      const response = await apiClient.get(endpoint);
      console.log("Groups fetch response:", response.data); // Debug log
      
      if (response.data.success) {
        console.log(`Setting ${response.data.groups.length} groups in state`); // Debug log
        set({ groups: response.data.groups, isLoading: false });
      } else {
        throw new Error("Failed to fetch study groups");
      }
    } catch (error) {
      console.error("Study groups fetch error:", error);
      set({ 
        groups: [],
        isLoading: false, 
        error: "Failed to load study groups. Please try again later." 
      });
    }
  },

  setGroups: (groups) => {
    set({ groups });
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  addGroup: async (newGroup) => {
    set({ isLoading: true, error: null });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      console.log("Creating group with data:", newGroup); // Debug log
      console.log("User data:", userData.id_number); // Debug log

      const groupPayload = {
        ...newGroup,
        creator_id: userData.id_number,
        members: [userData.id_number]
      };

      console.log("Sending group payload:", groupPayload); // Debug log

      const response = await apiClient.post("/api/study-groups", groupPayload);
      const createdGroup = response.data.group;
      
      console.log("Created group response:", createdGroup); // Debug log
      console.log("is_session_active value:", createdGroup.is_session_active); // Debug log
      console.log("is_session_active type:", typeof createdGroup.is_session_active); // Debug log

      // Since we only show active sessions, add it to the groups if it's active
      // Check multiple ways in case of type issues
      const isActive = createdGroup.is_session_active === true || 
                      createdGroup.is_session_active === "true" || 
                      createdGroup.is_session_active === 1;
      
      if (isActive) {
        console.log("Adding active group to state"); // Debug log
        set((state) => ({
          groups: [createdGroup, ...state.groups],
          isModalOpen: false,
          isLoading: false
        }));
      } else {
        console.log("Group is not active, not adding to state"); // Debug log
        console.log("Full group object:", JSON.stringify(createdGroup, null, 2)); // Debug log
        set({
          isModalOpen: false,
          isLoading: false
        });
      }

      return createdGroup; // Return the created group
    } catch (error) {
      console.error("Create study group error:", error);
      // Fallback to local add
      const fallbackGroup = { 
        ...newGroup, 
        id: `group${Date.now()}`, 
        members: ["You"],
        is_session_active: true,
        active_participants: [userData?.id_number || "You"]
      };
      
      set((state) => ({
        groups: [fallbackGroup, ...state.groups],
        isModalOpen: false,
        isLoading: false,
        error: "Failed to create study group"
      }));

      return fallbackGroup; // Return fallback group
    }
  },

  joinGroup: async (groupId) => {
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) return;

      await apiClient.post(`/api/study-groups/${groupId}/join`, {
        user_id: userData.id_number
      });

      // Refresh groups
      get().fetchGroups();
    } catch (error) {
      console.error("Join group error:", error);
      set({ error: "Failed to join group" });
    }
  },

  startSession: async (groupId) => {
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      const response = await apiClient.post(`/api/study-groups/${groupId}/start-session`, {
        user_id: userData.id_number
      });

      if (response.data.success) {
        // Refresh groups to show updated status
        get().fetchGroups();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Start session error:", error);
      set({ error: "Failed to start session" });
      return false;
    }
  },

  endSession: async (groupId, deleteGroup = true) => {
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      const response = await apiClient.post(`/api/study-groups/${groupId}/end-session`, {
        user_id: userData.id_number,
        delete_group: deleteGroup
      });

      if (response.data.success) {
        // Remove group from local state if it was deleted
        if (response.data.group_deleted) {
          set((state) => ({
            groups: state.groups.filter(group => group.id !== groupId)
          }));
        } else {
          // Refresh groups to show updated status
          get().fetchGroups();
        }
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("End session error:", error);
      set({ error: "Failed to end session" });
      return null;
    }
  },

  joinSession: async (groupId) => {
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      const response = await apiClient.post(`/api/study-groups/${groupId}/join-session`, {
        user_id: userData.id_number
      });

      return response.data.success;
    } catch (error) {
      console.error("Join session error:", error);
      set({ error: "Failed to join session" });
      return false;
    }
  },

  leaveSession: async (groupId) => {
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      const response = await apiClient.post(`/api/study-groups/${groupId}/leave-session`, {
        user_id: userData.id_number
      });

      if (response.data.success) {
        // Remove group from local state if it was deleted
        if (response.data.group_deleted) {
          set((state) => ({
            groups: state.groups.filter(group => group.id !== groupId)
          }));
        }
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Leave session error:", error);
      set({ error: "Failed to leave session" });
      return null;
    }
  },

  verifyGroupPassword: async (groupId, password) => {
    try {
      const response = await apiClient.post(`/api/study-groups/${groupId}/verify-password`, {
        password: password
      });

      return response.data.success;
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  },

  toggleFilterMode: () => {
    set((state) => {
      const newShowOnlyActive = !state.showOnlyActiveStudySessions;
      // Automatically fetch the appropriate groups when toggling
      get().fetchGroups(newShowOnlyActive);
      return { showOnlyActiveStudySessions: newShowOnlyActive };
    });
  },

  cleanupInactiveGroups: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.post('/api/study-groups/cleanup-all-inactive');
      
      if (response.data.success) {
        console.log(`Cleaned up ${response.data.deleted_count} inactive groups:`, response.data.deleted_groups);
        
        // Refresh the groups after cleanup
        await get().fetchGroups(get().showOnlyActiveStudySessions);
        
        set({ isLoading: false });
        return {
          success: true,
          deletedCount: response.data.deleted_count,
          deletedGroups: response.data.deleted_groups,
          message: response.data.message
        };
      } else {
        throw new Error("Cleanup failed");
      }
    } catch (error) {
      console.error("Cleanup error:", error);
      set({ 
        isLoading: false, 
        error: "Failed to cleanup inactive groups" 
      });
      return {
        success: false,
        error: error.message
      };
    }
  },

  forceCleanupParticipants: async (groupId) => {
    try {
      const response = await apiClient.post(`/api/study-groups/${groupId}/force-cleanup`);
      
      if (response.data.success) {
        // Refresh groups to show updated participant count
        get().fetchGroups();
        return {
          success: true,
          previousCount: response.data.previous_count,
          previousParticipants: response.data.previous_participants,
          message: response.data.message
        };
      } else {
        throw new Error("Force cleanup failed");
      }
    } catch (error) {
      console.error("Force cleanup error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },
}));

export default useLearnTogetherStore;
