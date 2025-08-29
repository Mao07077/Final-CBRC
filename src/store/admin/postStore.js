
import { create } from "zustand";
import api from "../../api/adminApi";

const usePostStore = create((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,
  isModalOpen: false,
  editingPost: null,

  // --- Actions ---
  fetchPosts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get("/posts");
      set({ posts: res.data, isLoading: false });
    } catch (err) {
      set({ error: "Failed to fetch posts.", isLoading: false });
    }
  },

  savePost: async (postData) => {
    set({ isLoading: true, error: null });
    try {
      let res;
      const { editingPost } = get();
      const formData = new FormData();
      formData.append("title", postData.title || "");
      formData.append("content", postData.content || "");
      if (postData.image) {
        formData.append("image", postData.image);
      }
      if (editingPost) {
        // Update
        res = await api.put(`/posts/${editingPost._id}`, formData);
      } else {
        // Create
        res = await api.post("/posts", formData);
      }
      // Refresh posts
      await get().fetchPosts();
      set({ isLoading: false, isModalOpen: false, editingPost: null });
    } catch (err) {
      set({ error: "Failed to save post.", isLoading: false });
    }
  },

  deletePost: async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/posts/${postId}`);
      await get().fetchPosts();
      set({ isLoading: false });
    } catch (err) {
      set({ error: "Failed to delete post.", isLoading: false });
    }
  },

  // --- Modal Control ---
  openModal: (post = null) =>
    set({ isModalOpen: true, editingPost: post, error: null }),
  closeModal: () => set({ isModalOpen: false, editingPost: null }),
}));

export default usePostStore;
