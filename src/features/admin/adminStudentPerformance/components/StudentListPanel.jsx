import useStudentPerformanceStore from "../../../../store/admin/studentPerformanceStore";

const StudentListPanel = () => {
  const {
    filteredStudents,
    selectStudent,
    filterStudents,
    isLoadingList,
    selectedStudent,
  } = useStudentPerformanceStore();

  return (
    <div className="border-r border-gray-200 h-full flex flex-col bg-white shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Students</h2>
        <input
          type="text"
          placeholder="Search by name or ID..."
          onChange={(e) => filterStudents(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
      </div>
      <div className="overflow-y-auto flex-1">
        {isLoadingList ? (
          <p className="p-4 text-center text-gray-500">Loading students...</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <li key={student._id}>
                <button
                  onClick={() => selectStudent(student)}
                  className={`w-full text-left p-4 transition-colors duration-150 ${
                    selectedStudent?._id === student._id
                      ? "bg-indigo-50 border-r-4 border-indigo-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {student.name || `${student.firstname} ${student.lastname}`}
                    </p>
                    <p className="text-sm text-gray-600">{student.id_number}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StudentListPanel;