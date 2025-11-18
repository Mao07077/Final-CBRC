import React, { useEffect, useState, useMemo } from "react";
import apiClient from "../../../../api/axiosClient";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import InfoTooltip from "../../../../components/common/InfoTooltip";

const ScoreDistribution = () => {
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
    const buckets = {
      "0-49": 0,
      "50-59": 0,
      "60-69": 0,
      "70-79": 0,
      "80-89": 0,
      "90-100": 0,
    };
    students.forEach(s => {
      (s.post_tests || []).forEach(t => {
        const score = Number(t.score) || 0;
        if (score < 50) buckets["0-49"]++;
        else if (score < 60) buckets["50-59"]++;
        else if (score < 70) buckets["60-69"]++;
        else if (score < 80) buckets["70-79"]++;
        else if (score < 90) buckets["80-89"]++;
        else buckets["90-100"]++;
      });
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [summary]);

  if (loading) return <div>Loading score distribution...</div>;
  if (error) return <div>{error}</div>;
  if (!data.length) return <div className="card bg-white p-4">No post-test scores yet.</div>;

  return (
    <div className="card bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-lg font-semibold text-primary-dark">Post-Test Score Distribution</h3>
        <InfoTooltip text="How many post-test scores fall within each percentage range (0-49, 50-59, …)." />
      </div>
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Counts per score range</p>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}
              itemStyle={{ fontSize: 14 }}
              labelStyle={{ fontSize: 14 }}
              wrapperStyle={{ zIndex: 30 }}
            />
            <Legend />
            <defs>
              <linearGradient id="scoreHist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <Bar dataKey="count" name="Count" fill="url(#scoreHist)" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScoreDistribution;
