import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
    <div className="text-2xl text-white p-3 rounded-full bg-indigo-500">
      {icon}
    </div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  </div>
);

const AnalyticsDashboard = ({ reports }) => {
  const stats = {
    pending: reports.filter((r) => r.status === "Pending").length,
    resolved: reports.filter((r) => r.status === "Resolved").length,
    archived: reports.filter((r) => r.status === "Archived").length,
    total: reports.length,
  };

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
        <StatCard title="Pending" value={stats.pending} />
        <StatCard title="Resolved" value={stats.resolved} />
        <StatCard title="Archived" value={stats.archived} />
        <StatCard title="Total" value={stats.total} />
        <StatCard title="Reports This Week" value={typeof reportsThisWeek !== 'undefined' ? reportsThisWeek : 0} />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
