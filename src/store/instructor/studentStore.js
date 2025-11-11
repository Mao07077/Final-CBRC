import { create } from "zustand";
import axios from "../../api/axiosClient";
import useAuthStore from "../authStore";

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
      const { userData } = useAuthStore.getState();
      const instructorId = userData?.id_number;
      const program = userData?.program;
      if (!instructorId) {
        throw new Error('Missing instructor id');
      }
      // Use instructor dashboard endpoint to derive students in program
      const dashRes = await axios.get(`/api/instructor/dashboard/${instructorId}${program ? `?program=${encodeURIComponent(program)}` : ''}`);
      // We need students list with program; the endpoint returns modules and stats plus attendance names
      // Fetch user accounts separately if needed to get program per student
      // Attempt to build student list from users collection via admin accounts if program missing
      let students = [];
      // attendance array only has names; need id_number mapping. Fallback to admin accounts
      const accountsRes = await axios.get('/api/admin/accounts');
      const accounts = accountsRes.data?.accounts || [];
      const studentAccounts = accounts.filter(a => /student/i.test(a.role));
      // Map accounts to simplified student objects
      students = studentAccounts.map(acc => ({
        _id: acc._id,
        name: `${acc.firstname || ''} ${acc.lastname || ''}`.trim(),
        studentNo: acc.id_number,
        program: acc.program || program || '',
        role: acc.role
      }));
      // If program filter exists, restrict to that program when available
      if (program) {
        students = students.filter(s => !s.program || s.program === program);
      }
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
        student.studentNo?.includes(lowerCaseQuery) ||
        student.program?.toLowerCase().includes(lowerCaseQuery)
    );
    set({ filteredStudents: results });
  },

  // --- Modal Control ---
  openStudentModal: (student) =>
    set({ selectedStudent: student, isModalOpen: true }),
  closeStudentModal: () => set({ selectedStudent: null, isModalOpen: false }),
}));

export default useStudentStore;
