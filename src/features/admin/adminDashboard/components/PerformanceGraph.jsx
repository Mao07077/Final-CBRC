import React, { useEffect, useState } from "react";
import apiClient from "../../../../api/axiosClient";

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

  return (
    <div className="card bg-white p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">Performance Summary</h3>
      <div className="flex gap-8">
        <div>
          <span className="font-bold">Average Score:</span> {summary.averageScore.toFixed(2)}
        </div>
        <div>
          <span className="font-bold">Max Score:</span> {summary.maxScore}
        </div>
        <div>
          <span className="font-bold">Min Score:</span> {summary.minScore}
        </div>
        <div>
          <span className="font-bold">Total Students:</span> {summary.totalStudents}
        </div>
      </div>
    </div>
  );
};

export default PerformanceGraph;
