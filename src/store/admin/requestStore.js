import { create } from "zustand";


import axios from "../../api/axios";

const useRequestStore = create((set, get) => ({
  requests: [],
  selectedRequest: null,
  isLoading: false,
  error: null,

  // --- Actions ---
  fetchRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get("/api/admin/account-requests");
      if (response.data.success) {
        set({ requests: response.data.requests, isLoading: false });
      } else {
        throw new Error("Failed to fetch account update requests");
      }
    } catch (error) {
      set({ error: "Failed to fetch account update requests", isLoading: false, requests: [] });
    }
  },

  acceptRequest: (requestId) => {
    set({ isLoading: true });
    setTimeout(() => {
      set((state) => ({
        requests: state.requests.filter((r) => r._id !== requestId),
        isLoading: false,
        selectedRequest: null,
      }));
    }, 500);
  },

  declineRequest: (requestId) => {
    if (!window.confirm("Are you sure you want to decline this request?"))
      return;

    set({ isLoading: true });
    setTimeout(() => {
      set((state) => ({
        requests: state.requests.filter((r) => r._id !== requestId),
        isLoading: false,
        selectedRequest: null,
      }));
    }, 500);
  },

  // --- Modal Control ---
  viewRequest: (request) => set({ selectedRequest: request }),
  closeModal: () => set({ selectedRequest: null }),
}));

export default useRequestStore;
