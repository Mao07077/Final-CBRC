import { create } from "zustand";


import axios from "../../api/axiosClient";

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

  acceptRequest: async (requestId) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`/api/admin/account-requests/${requestId}/accept`);
      if (response.data.success) {
        await get().fetchRequests();
        set({ isLoading: false, selectedRequest: null });
      } else {
        set({ isLoading: false });
        alert('Failed to accept request');
      }
    } catch (error) {
      set({ isLoading: false });
      alert('Failed to accept request');
    }
  },

  declineRequest: async (requestId) => {
    if (!window.confirm("Are you sure you want to decline this request?"))
      return;
    set({ isLoading: true });
    try {
      const response = await axios.post(`/api/admin/account-requests/${requestId}/decline`);
      if (response.data.success) {
        await get().fetchRequests();
        set({ isLoading: false, selectedRequest: null });
      } else {
        set({ isLoading: false });
        alert('Failed to decline request');
      }
    } catch (error) {
      set({ isLoading: false });
      alert('Failed to decline request');
    }
  },

  // --- Modal Control ---
  viewRequest: (request) => set({ selectedRequest: request }),
  closeModal: () => set({ selectedRequest: null }),
}));

export default useRequestStore;
