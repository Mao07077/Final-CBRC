import { useEffect, useState } from "react";
import useStudentStore from "../../store/instructor/studentStore";
import StudentTable from "../../features/instructor/instructorStudents/components/StudentTable";
import StudentDashboardModal from "../../features/instructor/instructorStudents/components/StudentDashboardModal";

const StudentListPage = () => {
  const { filteredStudents, fetchStudents, searchStudents, isLoading, error } =
    useStudentStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchStudents(searchQuery);
    }, 300); // Debounce search input

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchStudents]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Student List</h1>
        <input
          type="text"
          placeholder="Search by name or student no..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-4">Loading students...</div>
      ) : (
        !error && <StudentTable students={filteredStudents} />
      )}

      <StudentDashboardModal />
    </div>
  );
};

export default StudentListPage;
