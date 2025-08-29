import React, { useEffect, useState } from "react";
import apiClient from "../../../../api/axiosClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const PerformanceGraph = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get("/api/admin/performance-summary")
      .then(res => {
        if (res.data.success) {
          setSummary(res.data.summary);
        } else {
          setError("Failed to fetch performance summary");
        }
      })
      .catch(() => setError("Failed to fetch performance summary"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading performance stats...</div>;
  if (error) return <div>{error}</div>;
  if (!summary) return null;

  const data = [
    { name: 'Avg Score', value: summary.averageScore },
    { name: 'Max Score', value: summary.maxScore },
    { name: 'Min Score', value: summary.minScore },
    { name: 'Total Students', value: summary.totalStudents }
  ];

  return (
    <div className="card bg-white p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">Performance Summary</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#10b981" barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceGraph;
