
import { create } from "zustand";
import api from "../../api/adminApi";

const usePostStore = create((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,
  isModalOpen: false,
  editingPost: null,
  archivedPosts: [],

  // --- Actions ---
  fetchPosts: async () => {
    set({ isLoading: true, error: null });
    try {
  const res = await api.get("/admin/posts");
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
      // attach 5W metadata if present
      if (postData.fiveW) {
        try {
          formData.append('fiveW', JSON.stringify(postData.fiveW));
        } catch (err) {
          // ignore
        }
      }
      // support multiple images (frontend) and also append a single `image` for backend compatibility
      if (postData.images && Array.isArray(postData.images) && postData.images.length > 0) {
        // postData.images may be array of File objects or objects { file, url }
        postData.images.forEach((img) => {
          const file = img && img.file ? img.file : img;
          if (file) formData.append('images', file);
        });
        // also append the first file as 'image' (backend expects single 'image' UploadFile)
        const first = postData.images[0];
        const firstFile = first && first.file ? first.file : first;
        if (firstFile) formData.append('image', firstFile);
      }
      if (editingPost) {
        // Update
  res = await api.put(`/admin/posts/${editingPost._id}`, formData);
      } else {
        // Create
  res = await api.post("/admin/posts", formData);
      }
      // Refresh posts
      await get().fetchPosts();
      set({ isLoading: false, isModalOpen: false, editingPost: null });
    } catch (err) {
      set({ error: "Failed to save post.", isLoading: false });
    }
  },

  fetchArchivedPosts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get("/admin/posts/archived");
      if (res.data?.success) {
        set({ archivedPosts: res.data.posts, isLoading: false });
      } else {
        set({ archivedPosts: [], isLoading: false, error: "Failed to fetch archived posts." });
      }
    } catch (err) {
      set({ archivedPosts: [], isLoading: false, error: "Failed to fetch archived posts." });
    }
  },

  archivePost: async (postId) => {
    if (!window.confirm("Archive this post? You can restore it later.")) return;
    set({ isLoading: true, error: null });
    try {
      await api.put(`/admin/posts/${postId}/archive`);
      await get().fetchPosts();
      set({ isLoading: false });
    } catch (err) {
      set({ error: "Failed to archive post.", isLoading: false });
    }
  },

  unarchivePost: async (postId) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/admin/posts/${postId}/unarchive`);
      await get().fetchArchivedPosts();
      set({ isLoading: false });
    } catch (err) {
      set({ error: "Failed to restore post.", isLoading: false });
    }
  },

  // --- Modal Control ---
  openModal: (post = null) =>
    set({ isModalOpen: true, editingPost: post, error: null }),
  closeModal: () => set({ isModalOpen: false, editingPost: null }),
}));

export default usePostStore;
