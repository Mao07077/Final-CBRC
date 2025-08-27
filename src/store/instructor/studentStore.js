import { create } from "zustand";
import axios from "../../api/axios";

const useStudentStore = create((set, get) => ({
  students: [],
  filteredStudents: [],
  isLoading: false,
  error: null,
  selectedStudent: null,
  isModalOpen: false,

  // --- Actions ---
  fetchStudents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/students');
      const students = response.data.success ? response.data.students : [];
      set({ 
        students, 
        filteredStudents: students, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      set({ 
        error: 'Failed to fetch students', 
        isLoading: false,
        students: [],
        filteredStudents: []
      });
    }
  },

  searchStudents: (query) => {
    const { students } = get();
    if (!query) {
      set({ filteredStudents: students });
      return;
    }
    const lowerCaseQuery = query.toLowerCase();
    const results = students.filter(
      (student) =>
        student.name.toLowerCase().includes(lowerCaseQuery) ||
        student.studentNo?.includes(lowerCaseQuery)
    );
    set({ filteredStudents: results });
  },

  // --- Modal Control ---
  openStudentModal: (student) =>
    set({ selectedStudent: student, isModalOpen: true }),
  closeStudentModal: () => set({ selectedStudent: null, isModalOpen: false }),
}));

export default useStudentStore;
