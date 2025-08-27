import React, { useEffect, useState } from "react";
import apiClient from "../../../api/axios";

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

  return (
    <div className="card bg-white p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">Attendance Summary</h3>
      <div className="flex gap-8">
        <div>
          <span className="font-bold">Total Students:</span> {summary.totalStudents}
        </div>
        <div>
          <span className="font-bold">Attended:</span> {summary.attended}
        </div>
        <div>
          <span className="font-bold">Average Attendance:</span> {summary.averageAttendance.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default AttendanceStats;
