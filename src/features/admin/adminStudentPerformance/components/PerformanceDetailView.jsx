import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import useStudentPerformanceStore from "../../../../store/admin/studentPerformanceStore";
import StudentReportPDF from "./StudentReportPDF";
import { FiArrowLeft, FiDownload } from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const PerformanceDetailView = () => {
  const { selectedStudent, studentDetails, isLoadingDetails, selectStudent } =
    useStudentPerformanceStore();

  if (isLoadingDetails) {
    return <div className="p-8 text-center">Loading details...</div>;
  }

  if (!selectedStudent) {
    return (
      <div className="h-full flex flex-col justify-center items-center bg-gray-50 p-4">
        <div className="text-center">
          <FiArrowLeft className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">Select a Student</h3>
          <p className="text-gray-500 mt-1">
            Choose a student from the list to see their performance details.
          </p>
        </div>
      </div>
    );
  }
  
  if (!studentDetails) {
    return <div className="p-8 text-center">No performance data available for this student.</div>;
  }

  const testData = [
    ...studentDetails.preTests,
    ...studentDetails.postTests,
  ].map((t) => ({
    name: t.pre_test_title || t.post_test_title,
    score: Math.round((t.correct / t.total_questions) * 100),
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-gray-50">
      {/* Mobile Back Button */}
      <button
        onClick={() => selectStudent(null)}
        className="md:hidden flex items-center gap-2 text-indigo-600 font-semibold mb-4"
      >
        <FiArrowLeft />
        Back to List
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            {selectedStudent.name || `${selectedStudent.firstname} ${selectedStudent.lastname}`}
          </h2>
          <p className="text-lg text-gray-500">{selectedStudent.program || 'N/A'}</p>
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <p>
              <strong>ID:</strong> {selectedStudent.id_number}
            </p>
            <p>
              <strong>Email:</strong> {selectedStudent.email}
            </p>
          </div>
        </div>
        <PDFDownloadLink
          document={<StudentReportPDF student={selectedStudent} details={studentDetails} />}
          fileName={`${(selectedStudent.name || `${selectedStudent.firstname} ${selectedStudent.lastname}`).replace(' ', '_')}_report.pdf`}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors duration-300"
        >
          {({ loading }) => (loading ? "Loading..." : <><FiDownload /> Download Report</>)}
        </PDFDownloadLink>
      </div>

      {/* Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8" style={{ height: '350px' }}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Performance</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={testData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} fontSize={12} />
            <YAxis unit="%" tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
            <Tooltip wrapperClassName="rounded-md border-gray-300 shadow-lg" cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}/>
            <Legend />
            <Bar dataKey="score" fill="#6366F1" barSize={20} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Tests */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Tests</h3>
        <ul className="divide-y divide-gray-200">
          {studentDetails.postTests.map((test) => (
            <li key={test._id} className="py-4 flex justify-between items-center">
              <p className="font-medium text-gray-800">{test.post_test_title}</p>
              <p className="font-semibold text-gray-900">
                {Math.round((test.correct / test.total_questions) * 100)}%
                <span className="text-sm font-normal text-gray-500 ml-2">({test.correct}/{test.total_questions})</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PerformanceDetailView;