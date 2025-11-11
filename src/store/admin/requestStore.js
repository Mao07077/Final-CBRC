import { create } from "zustand";


import axios from "../../api/axiosClient";

const useRequestStore = create((set, get) => ({
  requests: [],
  selectedRequest: null,
  selectedCurrentProfile: null,
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
        // Trigger success toast
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Request accepted & profile updated.' } }));
        set({ isLoading: false, selectedRequest: null });
      } else {
        set({ isLoading: false });
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Failed to accept request.' } }));
      }
    } catch (error) {
      set({ isLoading: false });
      if (error?.response?.status === 404) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'warning', message: 'Request not found. It may have been processed already.' } }));
        await get().fetchRequests();
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Failed to accept request.' } }));
      }
    }
  },

  declineRequest: async (requestId) => {
    if (!window.confirm("Are you sure you want to decline this request?")) return;
    set({ isLoading: true });
    try {
      const response = await axios.post(`/api/admin/account-requests/${requestId}/decline`);
      if (response.data.success) {
        await get().fetchRequests();
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Request declined.' } }));
        set({ isLoading: false, selectedRequest: null });
      } else {
        set({ isLoading: false });
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Failed to decline request.' } }));
      }
    } catch (error) {
      set({ isLoading: false });
      if (error?.response?.status === 404) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'warning', message: 'Request not found. It may have been processed already.' } }));
        await get().fetchRequests();
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Failed to decline request.' } }));
      }
    }
  },

  // --- Modal Control ---
  viewRequest: async (request) => {
    set({ selectedRequest: request, selectedCurrentProfile: null });
    // Fetch the student's current profile to show "Current" (previous) values
    try {
      if (request?.id_number) {
        const res = await axios.get(`/api/profile/${request.id_number}`);
        set({ selectedCurrentProfile: res.data || null });
      }
    } catch (e) {
      // Keep modal open even if profile fails; UI will fallback gracefully
      set({ selectedCurrentProfile: null });
    }
  },
  closeModal: () => set({ selectedRequest: null }),
}));

export default useRequestStore;
