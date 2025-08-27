import React, { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import StudentReportPDF from "../../../../features/admin/adminStudentPerformance/components/StudentReportPDF";
import Modal from "../.././../../components/common/Modal";

const BulkPerformanceDownloadModal = ({ students, isOpen, onClose }) => {
  const [selected, setSelected] = useState([]);
  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filter, setFilter] = useState("");

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === filteredStudents.length) {
      setSelected([]);
    } else {
      setSelected(filteredStudents.map((s) => s.id_number));
    }
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

  const selectedStudents = filteredStudents.filter((s) => selected.includes(s.id_number));

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
            {selected.length === filteredStudents.length ? "Unselect All" : "Select All"}
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
                checked={selected.includes(student.id_number)}
                onChange={() => handleSelect(student.id_number)}
              />
              {student.name} ({student.id_number}) - {student.program}
            </label>
          ))}
        </div>
        {selectedStudents.length > 0 && (
          <div className="flex flex-col gap-2 mt-4">
            {selectedStudents.map((student) => (
              <PDFDownloadLink
                key={student.id_number}
                document={<StudentReportPDF student={student} />}
                fileName={`Student_Performance_${student.id_number}.pdf`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
              >
                {({ loading }) =>
                  loading ? `Preparing PDF for ${student.name}...` : `Download PDF for ${student.name}`
                }
              </PDFDownloadLink>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BulkPerformanceDownloadModal;
