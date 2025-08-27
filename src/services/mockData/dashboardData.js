// Mock data service for enhanced dashboard statistics
export const mockDashboardData = {
  user: {
    id: 1,
    name: "John Doe",
    avatar: "/api/placeholder/60/60",
    joinDate: "2024-09-01",
    currentStreak: 12,
  },

  statistics: {
    totalStudyHours: 156,
    completedModules: 12,
    totalModules: 15,
    averageScore: 88.5,
    accuracyRate: 85.2,
    learningStreak: 12,
    totalQuestions: 350,
    correctAnswers: 298,
    improvementRate: 12.5,
  },

  weeklyProgress: [
    { day: "Mon", hours: 3.5, score: 85, date: "2025-08-07" },
    { day: "Tue", hours: 4.2, score: 88, date: "2025-08-08" },
    { day: "Wed", hours: 2.8, score: 82, date: "2025-08-09" },
    { day: "Thu", hours: 5.1, score: 92, date: "2025-08-10" },
    { day: "Fri", hours: 3.9, score: 89, date: "2025-08-11" },
    { day: "Sat", hours: 4.5, score: 91, date: "2025-08-12" },
    { day: "Sun", hours: 3.2, score: 87, date: "2025-08-13" },
  ],

  subjectPerformance: [
    {
      subject: "Mathematics",
      score: 92,
      totalQuestions: 85,
      correctAnswers: 78,
      color: "#3B82F6",
      improvement: +8.5,
      lastScore: 84.5,
    },
    {
      subject: "Science",
      score: 85,
      totalQuestions: 90,
      correctAnswers: 77,
      color: "#10B981",
      improvement: +5.2,
      lastScore: 79.8,
    },
    {
      subject: "English",
      score: 89,
      totalQuestions: 95,
      correctAnswers: 85,
      color: "#8B5CF6",
      improvement: +3.1,
      lastScore: 85.9,
    },
    {
      subject: "History",
      score: 87,
      totalQuestions: 80,
      correctAnswers: 70,
      color: "#F59E0B",
      improvement: -1.5,
      lastScore: 88.5,
    },
  ],

  recentActivities: [
    {
      id: 1,
      type: "module_completed",
      title: "Completed Module: Introduction to Algebra",
      score: 95,
      date: "2025-08-13T10:30:00Z",
      icon: "book",
    },
    {
      id: 2,
      type: "test_taken",
      title: "Post-test: Science Chapter 5",
      score: 88,
      date: "2025-08-12T14:15:00Z",
      icon: "test",
    },
    {
      id: 3,
      type: "streak_achieved",
      title: "12-day learning streak achieved!",
      score: null,
      date: "2025-08-12T20:00:00Z",
      icon: "flame",
    },
    {
      id: 4,
      type: "study_session",
      title: "Study session: 2.5 hours",
      score: null,
      date: "2025-08-11T16:45:00Z",
      icon: "clock",
    },
  ],

  strengths: [
    { skill: "Problem Solving", score: 95, category: "Mathematics" },
    { skill: "Critical Thinking", score: 89, category: "Science" },
    { skill: "Reading Comprehension", score: 92, category: "English" },
  ],

  weaknesses: [
    {
      skill: "Time Management",
      score: 68,
      category: "General",
      improvement: "Practice with timed exercises",
    },
    {
      skill: "Historical Analysis",
      score: 72,
      category: "History",
      improvement: "Focus on cause-effect relationships",
    },
    {
      skill: "Scientific Method",
      score: 75,
      category: "Science",
      improvement: "Review experimental design principles",
    },
  ],

  upcomingTasks: [
    {
      id: 1,
      title: "Complete Module 6: Advanced Functions",
      dueDate: "2025-08-15",
      priority: "high",
      estimatedTime: "2 hours",
    },
    {
      id: 2,
      title: "Take Pre-test: Physics Basics",
      dueDate: "2025-08-16",
      priority: "medium",
      estimatedTime: "30 minutes",
    },
    {
      id: 3,
      title: "Submit Literature Essay",
      dueDate: "2025-08-18",
      priority: "high",
      estimatedTime: "3 hours",
    },
  ],

  achievements: [
    {
      id: 1,
      title: "Perfect Score",
      description: "Achieved 100% on 5 consecutive tests",
      icon: "star",
      unlockedDate: "2025-08-10",
      rarity: "rare",
    },
    {
      id: 2,
      title: "Study Streak Master",
      description: "Maintained 10+ day learning streak",
      icon: "flame",
      unlockedDate: "2025-08-11",
      rarity: "uncommon",
    },
    {
      id: 3,
      title: "Fast Learner",
      description: "Completed 5 modules in one week",
      icon: "zap",
      unlockedDate: "2025-08-05",
      rarity: "common",
    },
  ],
};

// Utility functions for mock data
export const getMockDashboardStats = () => {
  return {
    ...mockDashboardData.statistics,
    weeklyProgress: mockDashboardData.weeklyProgress,
    subjectPerformance: mockDashboardData.subjectPerformance,
  };
};

export const getMockRecentActivity = (limit = 5) => {
  return mockDashboardData.recentActivities.slice(0, limit);
};

export const getMockStrengthsAndWeaknesses = () => {
  return {
    strengths: mockDashboardData.strengths,
    weaknesses: mockDashboardData.weaknesses,
  };
};

export const getMockUpcomingTasks = () => {
  return mockDashboardData.upcomingTasks;
};

export const getMockAchievements = () => {
  return mockDashboardData.achievements;
};
