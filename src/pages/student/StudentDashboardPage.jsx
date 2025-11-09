import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import useDashboardStore from "../../store/student/dashboardStore";
import moduleService from "../../services/moduleService";
import RecommendedPages from "../../features/student/dashboard/components/RecommendedPage";
import ModuleList from "../../features/student/dashboard/components/ModuleList";
import ScoreOverview from "../../features/student/dashboard/components/ScoreOverview";
import StatisticsOverview from "../../features/student/dashboard/components/StatisticsOverview";

const DashboardPage = () => {
  const { fetchDashboardData, isLoading, error } = useDashboardStore();
  const [mode, setMode] = useState('current');
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [attemptsError, setAttemptsError] = useState(null);
  const [historyModal, setHistoryModal] = useState({ open: false, moduleId: null, title: '', items: [] });

  useEffect(() => {
    fetchDashboardData(mode);
    fetchAttempts();
  }, [fetchDashboardData, mode]);

  const fetchAttempts = async () => {
    try {
      setLoadingAttempts(true);
      setAttemptsError(null);
      const userDataRaw = localStorage.getItem('userData');
      const userId = userDataRaw ? JSON.parse(userDataRaw).id_number : localStorage.getItem('id_number');
      if (!userId) return;
      const res = await moduleService.getModuleAttempts(userId);
      setAttempts(res.moduleAttempts || []);
    } catch (e) {
      setAttemptsError(e?.response?.data?.detail || e.message);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const openHistory = async (moduleId, title) => {
    try {
      const userDataRaw = localStorage.getItem('userData');
      const userId = userDataRaw ? JSON.parse(userDataRaw).id_number : localStorage.getItem('id_number');
      const res = await moduleService.getModuleAttemptsHistory(userId);
      const found = (res.history || []).find(h => h.moduleId === moduleId);
      setHistoryModal({ open: true, moduleId, title, items: found ? found.attempts : [] });
    } catch (e) {
      setHistoryModal({ open: true, moduleId, title, items: [], error: e?.response?.data?.detail || e.message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        Your Dashboard
      </h1>

      {/* Enhanced Statistics Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="current">Current</option>
              <option value="previous">Previous</option>
              <option value="combined">Combined</option>
            </select>
          </div>
        </div>
        <StatisticsOverview />
      </div>

      <RecommendedPages />

      {/* Module Attempts Summary */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Module Attempts & Performance</h2>
        {/* Grouped Bar Chart */}
        {attempts.length > 0 && (
          <div className="w-full h-72 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attempts.map(a => ({ title: a.title, pre: a.preAttempts, post: a.postAttempts }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pre" name="Pre Attempts" fill="#60a5fa" />
                <Bar dataKey="post" name="Post Attempts" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {loadingAttempts && <p className="text-sm text-gray-500">Loading attempts...</p>}
        {attemptsError && <p className="text-sm text-red-600">{attemptsError}</p>}
        {!loadingAttempts && !attemptsError && attempts.length === 0 && (
          <p className="text-sm text-gray-600">No attempts recorded yet.</p>
        )}
        {attempts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-3 py-2 text-left">Module</th>
                  <th className="px-3 py-2 text-center">Pre Attempts</th>
                  <th className="px-3 py-2 text-center">Post Attempts</th>
                  <th className="px-3 py-2 text-center">Last Pre%</th>
                  <th className="px-3 py-2 text-center">Last Post%</th>
                  <th className="px-3 py-2 text-center">Best Pre%</th>
                  <th className="px-3 py-2 text-center">Best Post%</th>
                  <th className="px-3 py-2 text-center">Prev Best Pre%</th>
                  <th className="px-3 py-2 text-center">Prev Best Post%</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(a => (
                  <tr key={a.moduleId} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{a.title}</td>
                    <td className="px-3 py-2 text-center">{a.preAttempts}</td>
                    <td className="px-3 py-2 text-center">{a.postAttempts}</td>
                    <td className="px-3 py-2 text-center">{a.lastPrePercent}%</td>
                    <td className="px-3 py-2 text-center">{a.lastPostPercent}%</td>
                    <td className="px-3 py-2 text-center">{a.bestPrePercent}%</td>
                    <td className="px-3 py-2 text-center">
                      {a.bestPostPercent}%
                      <button
                        className="ml-3 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        onClick={() => openHistory(a.moduleId, a.title)}
                      >
                        View
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-700">{a.prevBestPrePercent ?? 0}%</td>
                    <td className="px-3 py-2 text-center text-gray-700">{a.prevBestPostPercent ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-10">
        <div className="lg:col-span-2"></div>
        <div>
          <ScoreOverview />
        </div>
      </div>
    {/* Attempts History Modal */}
    {historyModal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Attempts History — {historyModal.title}</h3>
            <button className="text-gray-500 hover:text-gray-800" onClick={() => setHistoryModal({ open: false, moduleId: null, title: '', items: [] })}>
              ✕
            </button>
          </div>
          {historyModal.error && <p className="text-sm text-red-600 mb-3">{historyModal.error}</p>}
          {(!historyModal.items || historyModal.items.length === 0) ? (
            <p className="text-sm text-gray-600">No attempts yet for this module.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-center">Type</th>
                    <th className="px-3 py-2 text-center">Percent</th>
                    <th className="px-3 py-2 text-center">Cycle</th>
                  </tr>
                </thead>
                <tbody>
                  {historyModal.items.map((it, idx) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{new Date(it.submittedAt).toLocaleString()}</td>
                      <td className="px-3 py-2 text-center capitalize">{it.type}</td>
                      <td className="px-3 py-2 text-center">{it.percent}%</td>
                      <td className="px-3 py-2 text-center">
                        {it.archived ? (
                          <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 border border-yellow-300">Previous</span>
                        ) : (
                          <span className="inline-block px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-800 border border-emerald-300">Current</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 text-right">
            <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark" onClick={() => setHistoryModal({ open: false, moduleId: null, title: '', items: [] })}>Close</button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default DashboardPage;
