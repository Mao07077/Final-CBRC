import { create } from "zustand";
import dashboardService from '../../services/dashboardService';
import useAuthStore from '../authStore';

const useDashboardStore = create((set) => ({
  recommendedPages: [],
  modules: [],
  preTests: [],
  postTests: [],
  studyHours: 0,
  completedModules: 0,
  totalModules: 0,
  averageScore: 0,
  learningStreak: 0,
  weeklyProgress: [],
  subjectPerformance: [],
  strengths: [],
  weaknesses: [],
  totalQuestions: 0,
  correctAnswers: 0,
  accuracy: 0,
  assessmentResults: [],
  preTestCount: 0,
  postTestCount: 0,
  detailedMetrics: { totalQuestions: 0, correctAnswers: 0, accuracy: 0 },
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      // Fetch all dashboard data from backend
      const data = await dashboardService.getDashboardData(userData.id_number);

      set({
        recommendedPages: data.recommendedPages || [],
        modules: data.modules || [],
        preTests: data.preTests || [],
        postTests: data.postTests || [],
        studyHours: data.studyHours || 0,
        completedModules: data.completedModules || 0,
        totalModules: data.totalModules || 0,
        averageScore: data.averageScore || 0,
        learningStreak: data.learningStreak || 0,
        weeklyProgress: data.weeklyProgress || [],
        subjectPerformance: data.subjectPerformance || [],
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        totalQuestions: data.detailedMetrics?.totalQuestions || 0,
        correctAnswers: data.detailedMetrics?.correctAnswers || 0,
        accuracy: data.detailedMetrics?.accuracy || 0,
        assessmentResults: data.assessmentBreakdown || [],
        preTestCount: data.preTestCount || 0,
        postTestCount: data.postTestCount || 0,
        detailedMetrics: data.detailedMetrics || { totalQuestions: 0, correctAnswers: 0, accuracy: 0 },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        recommendedPages: [],
        modules: [],
        preTests: [],
        postTests: [],
        studyHours: 0,
        completedModules: 0,
        totalModules: 0,
        averageScore: 0,
        learningStreak: 0,
        weeklyProgress: [],
        subjectPerformance: [],
        strengths: [],
        weaknesses: [],
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        assessmentResults: [],
        isLoading: false,
        error: "Failed to load dashboard data. Please try again later.",
      });
    }
  },
}));

export default useDashboardStore;
