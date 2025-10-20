import React, { useState } from "react";
import PerformanceDownloadModal from "../../../../features/admin/adminStudentPerformance/components/PerformanceDownloadModal2";
import BulkPerformanceDownloadModal from "../../../../features/admin/adminStudentPerformance/components/BulkPerformanceDownloadModal";
import useStudentPerformanceStore from "../../../../store/admin/studentPerformanceStore";
import generateCombinedPDF from "../../../../features/admin/adminStudentPerformance/utils/generateCombinedPDF";
import { useState } from "react";

const StudentPerformanceList = ({ students }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const handleDownloadClick = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const { selectedStudents, filteredStudents } = useStudentPerformanceStore();
  const [preparing, setPreparing] = useState(false);

  const handleCombinedFromList = async () => {
    const selectedList = filteredStudents.filter((s) => selectedStudents.includes(s.id_number));
    if (selectedList.length === 0) return alert('No students selected');
    setPreparing(true);
    try {
      const blob = await generateCombinedPDF(selectedList);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Students_Performance_Combined.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to prepare combined PDF');
    } finally {
      setPreparing(false);
    }
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
      {selectedStudents && selectedStudents.length > 0 && (
        <button
          className="mb-4 ml-3 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          onClick={handleCombinedFromList}
          disabled={preparing}
        >
          {preparing ? 'Preparing...' : `Download Combined PDF (${selectedStudents.length})`}
        </button>
      )}
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
