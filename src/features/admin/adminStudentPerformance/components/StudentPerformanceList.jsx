import React, { useState } from "react";
import PerformanceDownloadModal from "../../../../features/admin/adminStudentPerformance/components/PerformanceDownloadModal";
import BulkPerformanceDownloadModal from "../../features/admin/adminStudentPerformance/components/BulkPerformanceDownloadModal";

const StudentPerformanceList = ({ students }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const handleDownloadClick = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStudent(null);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Student Performance List</h2>
      <button
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={() => setBulkModalOpen(true)}
      >
        Bulk Download PDFs
      </button>
      <table className="w-full text-sm text-left text-gray-700 mb-6">
        <thead>
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">ID Number</th>
            <th className="px-4 py-2">Program</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id_number} className="border-b">
              <td className="px-4 py-2">{student.name}</td>
              <td className="px-4 py-2">{student.id_number}</td>
              <td className="px-4 py-2">{student.program}</td>
              <td className="px-4 py-2">
                <button
                  className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  onClick={() => handleDownloadClick(student)}
                >
                  Download PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <PerformanceDownloadModal
        student={selectedStudent}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
      <BulkPerformanceDownloadModal
        students={students}
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
      />
    </div>
  );
};

export default StudentPerformanceList;
