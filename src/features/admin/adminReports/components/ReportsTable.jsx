import React from "react";
import useReportStore from "../../../../store/admin/reportStore";

const ReportsTable = ({ reports }) => {
  const { viewReport, deleteReport } = useReportStore();

  const getStatusClass = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Table for medium and larger screens */}
      <div className="hidden md:block">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Student</th>
              <th scope="col" className="px-6 py-3">Issue</th>
              <th scope="col" className="px-6 py-3">Date</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{report.student}</td>
                <td className="px-6 py-4">{report.issue}</td>
                <td className="px-6 py-4">{new Date(report.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold leading-tight rounded-full ${getStatusClass(report.status)}`}>
                    {report.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center justify-end gap-2">
                  <button onClick={() => viewReport(report)} className="font-medium text-indigo-600 hover:text-indigo-800">
                    View
                  </button>
                  <button onClick={() => deleteReport(report.id)} className="font-medium text-red-600 hover:text-red-800">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards for small screens */}
      <div className="md:hidden">
        {reports.map((report) => (
          <div key={report.id} className="border-b p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-gray-900">{report.student}</p>
                <p className="text-sm text-gray-600">{report.issue}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold leading-tight rounded-full ${getStatusClass(report.status)}`}>
                {report.status}
              </span>
            </div>
            <div className="flex justify-between items-center mt-3">
              <p className="text-sm text-gray-500">
                {new Date(report.date).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-4">
                <button onClick={() => viewReport(report)} className="font-medium text-indigo-600 hover:text-indigo-800">
                  View
                </button>
                <button onClick={() => deleteReport(report.id)} className="font-medium text-red-600 hover:text-red-800">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsTable;
