import { create } from "zustand";
import axios from "../../api/axios";
import apiClient from "../../api/axios";

const useStudentPerformanceStore = create((set, get) => ({
    students: [
    {
      _id: "3",
      firstname: "Peter",
      lastname: "Jones",
      id_number: "2023-0003",
      role: "student",
      email: "peter.jones@example.com",
    },
    {
      _id: "4",
      firstname: "Mary",
      lastname: "Jane",
      id_number: "2023-0004",
      role: "student",
      email: "mary.jane@example.com",
    },
  ],
  filteredStudents: [
    {
      _id: "3",
      firstname: "Peter",
      lastname: "Jones",
      id_number: "2023-0003",
      role: "student",
      email: "peter.jones@example.com",
    },
    {
      _id: "4",
      firstname: "Mary",
      lastname: "Jane",
      id_number: "2023-0004",
      role: "student",
      email: "mary.jane@example.com",
    },
  ],
  selectedStudent: null,
  studentDetails: null, // Will hold performance data
  isLoadingList: false,
  isLoadingDetails: false,
  error: null,

  // --- Actions ---
  fetchStudents: () => {
    const { students } = get();
    set({ filteredStudents: students, isLoadingList: false });
  },

  filterStudents: (query) => {
    const { students } = get();
    const lowerCaseQuery = query.toLowerCase();
    const results = students.filter(
      (s) =>
        (s.name || `${s.firstname} ${s.lastname}`)
          .toLowerCase()
          .includes(lowerCaseQuery) || s.id_number?.includes(lowerCaseQuery)
    );
    set({
      filteredStudents: results,
      selectedStudent: null,
      studentDetails: null,
    }); // Reset selection on new search
  },

  selectStudent: async (student) => {
    if (get().selectedStudent?._id === student._id) return;

    set({
      selectedStudent: student,
      isLoadingDetails: true,
      studentDetails: null,
    });

    try {
      const response = await axios.get(`/api/admin/student-performance/${student._id}`);
      if (response.data.success) {
        set({
          studentDetails: response.data.details,
          isLoadingDetails: false,
        });
      } else {
        throw new Error('Failed to fetch student details');
      }
    } catch (error) {
      console.error('Error fetching student performance details:', error);
      set({
        studentDetails: null,
        isLoadingDetails: false,
        error: 'Failed to fetch student performance details'
      });
    }
  },
}));

export default useStudentPerformanceStore;
