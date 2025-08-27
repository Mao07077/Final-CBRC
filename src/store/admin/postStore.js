import { create } from "zustand";


const usePostStore = create((set, get) => ({
    posts: [
    {
      _id: "post1",
      title: "Welcome to the new semester!",
      content: "We are excited to start the new semester. Please check the announcements for important dates.",
      createdAt: new Date("2023-08-01T10:00:00Z"),
      image: "/images/welcome.jpg",
    },
    {
      _id: "post2",
      title: "Midterm Exam Schedule",
      content: "The midterm exams will be held from October 15th to October 20th. The detailed schedule is now available on the student portal.",
      createdAt: new Date("2023-09-25T14:30:00Z"),
      image: null,
    },
    {
      _id: "post3",
      title: "Holiday Announcement: Thanksgiving Break",
      content: "The university will be closed for Thanksgiving break from November 22nd to November 26th. Classes will resume on November 27th.",
      createdAt: new Date("2023-11-15T09:00:00Z"),
      image: "/images/thanksgiving.jpg",
    },
  ],
  isLoading: false,
  error: null,
  isModalOpen: false,
  editingPost: null,

  // --- Actions ---
  fetchPosts: () => {
    // Mock implementation, data is pre-loaded
    set({ isLoading: false });
  },

  savePost: (postData) => {
    set({ isLoading: true });
    setTimeout(() => {
      const { posts, editingPost } = get();
      let updatedPosts;

      let imageUrl = editingPost ? editingPost.image : null; // Keep old image by default
      if (postData.image && postData.image instanceof File) {
        // Create a URL for the new file
        imageUrl = URL.createObjectURL(postData.image);
      }

      if (editingPost) {
        // Update
        updatedPosts = posts.map((p) =>
          p._id === editingPost._id
            ? { ...p, title: postData.title, content: postData.content, image: imageUrl }
            : p
        );
      } else {
        // Create
        const newPost = {
          _id: `post${Date.now()}`,
          title: postData.title,
          content: postData.content,
          createdAt: new Date(),
          image: imageUrl,
        };
        updatedPosts = [...posts, newPost];
      }

      set({
        posts: updatedPosts,
        isLoading: false,
        isModalOpen: false,
        editingPost: null,
      });
    }, 500);
  },

  deletePost: (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    set({ isLoading: true });
    setTimeout(() => {
      set((state) => ({
        posts: state.posts.filter((p) => p._id !== postId),
        isLoading: false,
      }));
    }, 500);
  },

  // --- Modal Control ---
  openModal: (post = null) =>
    set({ isModalOpen: true, editingPost: post, error: null }),
  closeModal: () => set({ isModalOpen: false, editingPost: null }),
}));

export default usePostStore;
