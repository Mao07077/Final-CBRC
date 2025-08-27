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

  // Dummy data for chart - replace with real aggregated data
  const chartData = [
    { name: "Mon", reports: 5 },
    { name: "Tue", reports: 8 },
    { name: "Wed", reports: 3 },
    { name: "Thu", reports: 10 },
    { name: "Fri", reports: 6 },
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <StatCard title="Pending" value={stats.pending} />
        <StatCard title="Resolved" value={stats.resolved} />
        <StatCard title="Archived" value={stats.archived} />
        <StatCard title="Total" value={stats.total} />
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200" style={{ height: '350px' }}>
        <h3 className="font-semibold text-gray-800 mb-4">Reports This Week</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
            <Tooltip wrapperClassName="rounded-md border-gray-300 shadow-lg" cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}/>
            <Legend />
            <Bar dataKey="reports" fill="#6366F1" barSize={20} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
