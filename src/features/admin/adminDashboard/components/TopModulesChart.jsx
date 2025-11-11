import React, { useEffect, useState, useMemo } from "react";
import apiClient from "../../../../api/axiosClient";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

const TopModulesChart = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get("/api/admin/performance-summary")
      .then(res => {
        if (res.data.success) setSummary(res.data.summary);
        else setError("Failed to fetch performance summary");
      })
      .catch(() => setError("Failed to fetch performance summary"))
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    if (!summary) return [];
    const students = summary.students || [];
    const counts = {};
    students.forEach(s => {
      (s.post_tests || []).forEach(t => {
        const title = t.post_test_title || "Post-Test";
        counts[title] = (counts[title] || 0) + 1;
      });
    });
    const arr = Object.entries(counts).map(([title, completions]) => ({ title, completions }));
    arr.sort((a,b) => b.completions - a.completions);
    return arr.slice(0, 10);
  }, [summary]);

  if (loading) return <div>Loading top modules...</div>;
  if (error) return <div>{error}</div>;
  if (!data.length) return <div className="card bg-white p-4">No module completions yet.</div>;

  return (
    <div className="card bg-white p-4">
      <h3 className="text-lg font-semibold text-primary-dark mb-1">Top Modules by Post-Test Completions</h3>
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Top 10 modules with most post-tests taken</p>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="title" interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <defs>
              <linearGradient id="modComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#fde68a" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <Bar dataKey="completions" name="Completions" fill="url(#modComp)" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopModulesChart;
