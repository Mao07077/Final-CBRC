import React, { useEffect, useState, useCallback } from "react";
import useReportStore from "../../store/admin/reportStore";
import useAdminDashboardStore from "../../store/admin/adminDashboardStore";
import AnalyticsDashboard from "../../features/admin/adminReports/components/AnalyticsDashboard";
import ReportsTable from "../../features/admin/adminReports/components/ReportsTable";
import useAdminReportStore from "../../store/admin/reportStore";
import ReportDetailsModal from "../../features/admin/adminReports/components/ReportDetailsModal";

const ReportsPage = () => {
  const {
    reports,
    filteredReports,
    fetchReports,
    filterReports,
    isLoading,
    error,
  } = useReportStore();
  const [filters, setFilters] = useState({ query: "", status: "All" });
  const [archiveOpen, setArchiveOpen] = useState(false);
  const { unarchiveReport, archivedReports, fetchArchivedReports } = useAdminReportStore();
  // Use dashboard store to get reportsThisWeek
  const { stats } = useAdminDashboardStore();

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = useCallback(
    (newFilter) => {
      const updatedFilters = { ...filters, ...newFilter };
      setFilters(updatedFilters);
      filterReports(updatedFilters);
    },
    [filters, filterReports]
  );

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-primary-dark mb-6">
        Reports
      </h1>
      <AnalyticsDashboard reports={reports} reportsThisWeek={stats.reportsThisWeek} />

      <div className="mb-4">
        <button
          onClick={() => { fetchArchivedReports(); setArchiveOpen(true); }}
          className="px-4 py-2 border border-gray-600 text-gray-700 rounded hover:bg-gray-50"
        >Archived Reports</button>
      </div>

      <div className="my-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="text"
            placeholder="Search by student or issue..."
            value={filters.query}
            onChange={(e) => handleFilterChange({ query: e.target.value })}
            className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg my-4">{error}</p>}
      {isLoading ? (
        <p>Loading reports...</p>
      ) : (
        <ReportsTable reports={filteredReports} />
      )}

      <ReportDetailsModal />

      {archiveOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-full max-h-[80vh] p-4 md:p-6 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Archived Reports</h2>
              <button onClick={() => setArchiveOpen(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="overflow-y-auto flex-1 mt-2">
              <div className="p-2 md:p-4">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Issue</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedReports.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-6 text-gray-500">No archived reports</td></tr>
                    )}
                    {archivedReports.map(r => (
                        <tr key={r._id}>
                          <td>{r.student}</td>
                          <td>{r.issue}</td>
                          <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</td>
                          <td>
                            <button
                              onClick={() => { unarchiveReport(r._id); }}
                              className="px-3 py-1 rounded bg-green-600 text-white"
                            >Restore</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
