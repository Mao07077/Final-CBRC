import React, { useState } from "react";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import StudentReportPDF from "../../../../features/admin/adminStudentPerformance/components/StudentReportPDF";
import CombinedStudentReportPDF from "../../../../features/admin/adminStudentPerformance/components/CombinedStudentReportPDF";
import Modal from "../.././../../components/common/Modal";
import useStudentPerformanceStore from "../../../../store/admin/studentPerformanceStore";
import apiClient from "../../../../api/axiosClient";
import generateCombinedPDF from "../utils/generateCombinedPDF";

const BulkPerformanceDownloadModal = ({ students, isOpen, onClose }) => {
  const { selectedStudents, toggleSelectStudent, selectAllStudents } = useStudentPerformanceStore();
  const [sortKey, setSortKey] = React.useState("name");
  const [sortOrder, setSortOrder] = React.useState("asc");
  const [filter, setFilter] = React.useState("");

  const handleSelect = (id) => {
    toggleSelectStudent(id);
  };

  const handleSelectAll = () => {
    selectAllStudents();
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Filter and sort students
  const filteredStudents = students
    .filter((s) =>
      s.name.toLowerCase().includes(filter.toLowerCase()) ||
      s.id_number.toLowerCase().includes(filter.toLowerCase()) ||
      s.program?.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const selectedStudentsList = filteredStudents.filter((s) => selectedStudents.includes(s.id_number));
  const [preparingCombined, setPreparingCombined] = useState(false);

  const prepareCombinedAndDownload = async () => {
    if (selectedStudentsList.length === 0) return;
    setPreparingCombined(true);
    try {
      const blob = await generateCombinedPDF(selectedStudentsList);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Students_Performance_Combined.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed preparing combined PDF', err);
      alert('Failed to prepare combined PDF. See console for details.');
    } finally {
      setPreparingCombined(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Download Student Performance PDFs">
      <div className="flex flex-col gap-4 p-4">
        <p>Select students to download their performance reports:</p>
        <input
          type="text"
          placeholder="Filter by name, ID, or program..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mb-2 px-3 py-2 border rounded w-full"
        />
        <div className="flex gap-2 mb-2">
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSelectAll}
          >
            {filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s.id_number)) ? "Unselect All" : "Select All"}
          </button>
          <button
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded"
            onClick={() => handleSort("name")}
          >
            Sort by Name {sortKey === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
          </button>
          <button
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded"
            onClick={() => handleSort("id_number")}
          >
            Sort by ID {sortKey === "id_number" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
          </button>
          <button
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded"
            onClick={() => handleSort("program")}
          >
            Sort by Program {sortKey === "program" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto border rounded p-2">
          {filteredStudents.map((student) => (
            <label key={student.id_number} className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.id_number)}
                onChange={() => handleSelect(student.id_number)}
              />
              {student.name} ({student.id_number}) - {student.program}
            </label>
          ))}
        </div>
        {selectedStudentsList.length > 0 && (
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex gap-2 flex-wrap">
              {selectedStudentsList.map((student) => (
                <div key={student.id_number} className="border rounded p-2 bg-white shadow-sm w-60">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{student.name}</div>
                      <div className="text-xs text-gray-500">{student.id_number}</div>
                      <div className="text-xs text-gray-400">{student.program}</div>
                    </div>
                    <div>
                      <input type="checkbox" checked onChange={() => handleSelect(student.id_number)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              {/* Individual downloads */}
              {selectedStudentsList.map((student) => (
                <PDFDownloadLink
                  key={student.id_number}
                  document={<StudentReportPDF student={student} />}
                  fileName={`Student_Performance_${student.id_number}.pdf`}
                  className="px-3 py-1 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 text-sm"
                >
                  {({ loading }) => (loading ? `Preparing ${student.name}...` : `Download ${student.name}`)}
                </PDFDownloadLink>
              ))}
              {/* Combined single PDF for all selected (fetches details and generates one file) */}
              <button
                onClick={prepareCombinedAndDownload}
                className="px-3 py-1 bg-green-600 text-white rounded shadow hover:bg-green-700 text-sm ml-2"
                disabled={preparingCombined}
              >
                {preparingCombined ? `Preparing combined PDF...` : `Download Combined PDF (${selectedStudentsList.length})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BulkPerformanceDownloadModal;
