import { create } from "zustand";
import axios from "../api/axios";

const useLandingStore = create((set) => ({
  pageData: null,
  isLoading: true,
  fetchPageData: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get('/api/landing-page');
      set({ pageData: response.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching landing page data:', error);
      set({ 
        pageData: {
          intro: {
            header: "Unlock Your Ultimate Review Experience",
            subHeader: "Your all-in-one platform for interactive learning, progress tracking, and community collaboration. Let's start your journey to success.",
          },
          about: {
            header: "Dr. Carl Balita Review Center",
            content: "CBRC, popularly known as the Dr. Carl E. Balita Review Center, stands as the biggest, most awarded, and the only ISO 9001-2015 certified business of its kind.",
          },
          news: {
            header: "Latest News",
            title: "Announcement",
            content: "CBRC is proud to announce the launch of its new online learning platform, designed to make education accessible to everyone!",
          },
          featuredCourses: [],
        }, 
        isLoading: false 
      });
    }
  },
}));

export default useLandingStore;
