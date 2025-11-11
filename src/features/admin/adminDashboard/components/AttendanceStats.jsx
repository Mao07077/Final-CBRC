import React, { useEffect, useState } from "react";
import apiClient from "../../../../api/axiosClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const AttendanceStats = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get("/api/admin/attendance-summary")
      .then(res => {
        if (res.data.success) {
          setSummary(res.data.summary);
        } else {
          setError("Failed to fetch attendance summary");
        }
      })
      .catch(() => setError("Failed to fetch attendance summary"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading attendance stats...</div>;
  if (error) return <div>{error}</div>;
  if (!summary) return null;

  // Present an overall, compact view similar in style to instructor attendance
  const data = [
    { name: 'Attended', value: summary.attended },
    { name: 'Total Students', value: summary.totalStudents },
  ];

  return (
    <div className="card bg-white p-4 mb-4">
      <h3 className="text-lg font-semibold text-primary-dark mb-1">Attendance Overview (All Students)</h3>
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Attended vs total students</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <defs>
            <linearGradient id="attA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="attB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <Bar dataKey="value" name="Count" fill="url(#attA)" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-sm text-gray-600">Average Attendance Value: {Math.round(summary.averageAttendance)}</div>
    </div>
  );
};

export default AttendanceStats;
