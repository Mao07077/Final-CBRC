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

  const data = [
    { name: 'Total Students', value: summary.totalStudents },
    { name: 'Attended', value: summary.attended },
    { name: 'Avg Attendance', value: summary.averageAttendance }
  ];

  return (
    <div className="card bg-white p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">Attendance Summary</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#6366f1" barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceStats;
