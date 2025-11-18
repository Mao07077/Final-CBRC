import React, { useState } from "react";
import useStudentPerformanceStore from "../../../../store/admin/studentPerformanceStore";

const StudentListPanel = ({ onOpenArchived }) => {
  const {
    filteredStudents,
    selectStudent,
    filterStudents,
    isLoadingList,
    selectedStudent,
    selectAllStudents,
    selectedStudents,
    toggleSelectStudent,
  } = useStudentPerformanceStore();
  const [search, setSearch] = useState("");

  return (
  <div className="border-r border-gray-200 h-full flex flex-col bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Students</h2>
          <button
            type="button"
            onClick={onOpenArchived}
            className="px-3 py-1.5 rounded border text-sm bg-white hover:bg-gray-50"
          >
            Archived Performance
          </button>
        </div>
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            filterStudents(e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
        <div className="flex items-center mt-2 gap-2">
          <button
            className={`px-2 py-1 rounded text-sm ${
              (filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s.id_number)))
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={selectAllStudents}
          >
            {filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s.id_number))
              ? 'Unselect All'
              : 'Select All'}
          </button>
        </div>
      </div>
  <div className="overflow-y-auto flex-1 p-0" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {isLoadingList ? (
          <p className="p-4 text-center text-gray-500">Loading students...</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <li key={student._id}>
                <div className={`w-full p-4 transition-colors duration-150 ${
                    selectedStudent?._id === student._id
                      ? "bg-indigo-50 border-r-4 border-indigo-500"
                      : "hover:bg-gray-50"
                  }`}> 
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id_number)}
                      onChange={() => toggleSelectStudent(student.id_number)}
                    />
                    <div className="flex-1 text-left" onClick={() => selectStudent(student)}>
                      <p className="font-semibold text-gray-900">
                        {student.name || `${student.firstname} ${student.lastname}`}
                      </p>
                      <p className="text-sm text-gray-600">{student.id_number}</p>
                      <p className="text-xs text-gray-500">{student.program || ""}</p>
                    </div>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StudentListPanel;