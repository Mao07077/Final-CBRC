import React, { useEffect, useState, useMemo } from "react";
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

  const computed = useMemo(() => {
    if (!summary) return null;
    const students = summary.students || [];
    const preScores = [];
    const postScores = [];
    let postCorrect = 0, postTotal = 0;
    students.forEach((s) => {
      (s.pre_tests || []).forEach((t) => {
        const score = Number(t.score) || 0;
        preScores.push(score);
      });
      (s.post_tests || []).forEach((t) => {
        const score = Number(t.score) || 0;
        postScores.push(score);
        postCorrect += (Number(t.correct) || 0);
        postTotal += (Number(t.total_questions) || 0);
      });
    });
    const avgPre = preScores.length ? preScores.reduce((a,c)=>a+c,0)/preScores.length : 0;
    const avgPost = postScores.length ? postScores.reduce((a,c)=>a+c,0)/postScores.length : 0;
    const accuracy = postTotal > 0 ? (postCorrect / postTotal) * 100 : 0;
    const maxPost = postScores.length ? Math.max(...postScores) : 0;
    const minPost = postScores.length ? Math.min(...postScores) : 0;
    return { avgPre, avgPost, accuracy, maxPost, minPost };
  }, [summary]);

  if (loading) return <div>Loading performance stats...</div>;
  if (error) return <div>{error}</div>;
  if (!summary || !computed) return null;

  const data = [
    { name: 'Avg Pre Score', value: Number(computed.avgPre.toFixed(2)) },
    { name: 'Avg Post Accuracy', value: Number(computed.accuracy.toFixed(2)) },
    { name: 'Max Post Score', value: Number(computed.maxPost.toFixed(2)) },
    { name: 'Min Post Score', value: Number(computed.minPost.toFixed(2)) },
  ];

  return (
    <div className="card bg-white p-4 mb-4">
      <h3 className="text-lg font-semibold text-primary-dark mb-1">Performance Summary</h3>
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Post-test accuracy and score distribution</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0,100]} tickFormatter={(v)=> `${v}%`} />
          <Tooltip formatter={(v)=> [`${v}%`, 'Value']} />
          <Legend />
          <defs>
            <linearGradient id="perfA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#a5f3fc" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <Bar dataKey="value" fill="url(#perfA)" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceGraph;
