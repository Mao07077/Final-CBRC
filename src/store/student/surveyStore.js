import { create } from "zustand";

import questions from "../../features/survey/data/question";
import useAuthStore from "../authStore";
import surveyService from "../../services/surveyService";

// Scoring logic based on the original implementation
const scoringSystem = questions.reduce((acc, section) => {
  acc[section.category] = Array.from(
    { length: section.questions[0].choices.length },
    (_, i) => section.questions[0].choices.length - i
  );
  return acc;
}, {});

const useSurveyStore = create((set, get) => ({
  questions,
  currentPage: 0,
  answers: {},
  isLoading: false,
  error: null,

  // Actions
  handleAnswer: (questionIndex, choiceIndex) => {
    const { currentPage, questions } = get();
    const category = questions[currentPage].category;
    const score = scoringSystem[category][choiceIndex];

    set((state) => ({
      answers: {
        ...state.answers,
        [`${currentPage}-${questionIndex}`]: { score, category },
      },
    }));
  },

  isCurrentPageCompleted: () => {
    const { currentPage, questions, answers } = get();
    return questions[currentPage].questions.every((_, index) =>
      Object.prototype.hasOwnProperty.call(answers, `${currentPage}-${index}`)
    );
  },

  nextPage: () => {
    if (get().isCurrentPageCompleted()) {
      set((state) => ({
        currentPage: Math.min(state.currentPage + 1, questions.length - 1),
        error: null,
      }));
    } else {
      set({ error: "Please answer all questions before proceeding." });
    }
  },

  prevPage: () => {
    set((state) => ({
      currentPage: Math.max(state.currentPage - 1, 0),
      error: null,
    }));
  },

  submitSurvey: async (idNumber, navigate) => {
    if (!get().isCurrentPageCompleted()) {
      set({ error: "Please answer all questions before submitting." });
      return;
    }

    set({ isLoading: true, error: null });

    const { answers } = get();
    const categoryScores = {};
    Object.values(answers).forEach(({ score, category }) => {
      if (!categoryScores[category]) {
        categoryScores[category] = 0;
      }
      categoryScores[category] += score;
    });

    const top3Habits = Object.entries(categoryScores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, 3)
      .map(([category]) => category);

    const payload = {
      id_number: idNumber,
      categoryScores,
      top3Habits,
      surveyCompleted: true,
    };

    try {
      await surveyService.submit(payload);
      const { completeSurvey } = useAuthStore.getState();
      completeSurvey();
      set({ isLoading: false });
      navigate("/student/dashboard"); // Redirect on success
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Failed to submit survey. Please try again." 
      });
      console.error("Survey submission error:", error);
    }
  },
}));

export default useSurveyStore;
