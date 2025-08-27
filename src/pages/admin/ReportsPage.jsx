import React, { useEffect, useState, useCallback } from "react";
import useReportStore from "../../store/admin/reportStore";
import AnalyticsDashboard from "../../features/admin/adminReports/components/AnalyticsDashboard";
import ReportsTable from "../../features/admin/adminReports/components/ReportsTable";
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
        Reports & Analytics
      </h1>
      <AnalyticsDashboard reports={reports} />

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
            <option value="Archived">Archived</option>
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
    </div>
  );
};

export default ReportsPage;
