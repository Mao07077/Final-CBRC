import { create } from "zustand";
import axios from "../../api/axiosClient";
import apiClient from "../../api/axiosClient";

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
  selectedStudents: [], // array of id_number for bulk selection
  studentDetails: null, // Will hold performance data
  isLoadingList: false,
  isLoadingDetails: false,
  error: null,

  // --- Actions ---
  fetchStudents: async () => {
    set({ isLoadingList: true });
    try {
      const response = await apiClient.get("/api/admin/accounts?role=student");
      // Only students
      const students = response.data.accounts.filter(acc => acc.role === "student");
      set({ students, filteredStudents: students, isLoadingList: false });
    } catch (error) {
      set({ students: [], filteredStudents: [], isLoadingList: false, error: "Failed to fetch students." });
    }
  },

  filterStudents: (query, programSort = null) => {
    const { students } = get();
    let results = students.filter(
      (s) =>
        (s.name || `${s.firstname} ${s.lastname}`)
          .toLowerCase()
          .includes(query.toLowerCase()) || s.id_number?.includes(query)
    );
    if (programSort) {
      results = results.sort((a, b) => (a.program || "").localeCompare(b.program || ""));
    }
    set({
      filteredStudents: results,
      selectedStudent: null,
      studentDetails: null,
    });
  },
  selectAllStudents: () => {
    const { filteredStudents } = get();
    // toggle: if all selected, clear; otherwise select all filtered
    const allIds = (filteredStudents || []).map((s) => s.id_number);
    const { selectedStudents } = get();
    const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedStudents.includes(id));
    set({
      selectedStudent: null,
      studentDetails: null,
      selectedStudents: isAllSelected ? [] : allIds,
    });
  },

  toggleSelectStudent: (id_number) => {
    const { selectedStudents } = get();
    if (selectedStudents.includes(id_number)) {
      set({ selectedStudents: selectedStudents.filter((id) => id !== id_number) });
    } else {
      set({ selectedStudents: [...selectedStudents, id_number] });
    }
  },

  selectStudent: async (student) => {
    if (get().selectedStudent?.id_number === student.id_number) return;

    set({
      selectedStudent: student,
      isLoadingDetails: true,
      studentDetails: null,
    });

    try {
      const response = await axios.get(`/api/admin/student-performance/${student.id_number}`);
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
