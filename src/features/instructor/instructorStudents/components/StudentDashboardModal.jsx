import React, { useState, useEffect } from "react";
import useStudentStore from "../../../../store/instructor/studentStore";
import apiClient from "../../../../api/axiosClient";
import moduleService from "../../../../services/moduleService";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ComposedChart, Bar, Line, Scatter, Brush } from "recharts";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl p-6">
        {children}
      </div>
    </div>
  );
};

const StudentDashboardModal = () => {
  const { isModalOpen, selectedStudent, closeStudentModal } = useStudentStore();
  const [mode, setMode] = useState("combined");
  const [dashboard, setDashboard] = useState(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const [errorDash, setErrorDash] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [attemptsError, setAttemptsError] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [trendError, setTrendError] = useState(null);
  const [historyModal, setHistoryModal] = useState({ open: false, moduleId: null, title: '', items: [] });

  // Fetch dashboard (supports mode)
  useEffect(() => {
    if (!isModalOpen || !selectedStudent) return;
    const fetchDashboard = async () => {
      try {
        setLoadingDash(true); setErrorDash(null);
        const res = await apiClient.get(`/api/dashboard/${selectedStudent.studentNo}?mode=${mode}`);
        setDashboard(res.data);
      } catch (e) {
        setErrorDash(e?.response?.data?.detail || 'Failed to fetch dashboard');
      } finally {
        setLoadingDash(false);
      }
    };
    fetchDashboard();
  }, [isModalOpen, selectedStudent, mode]);

  // Fetch module attempts (current + previous for composed chart)
  useEffect(() => {
    if (!isModalOpen || !selectedStudent) return;
    const fetchAttempts = async () => {
      try {
        setLoadingAttempts(true); setAttemptsError(null);
        const res = await moduleService.getModuleAttempts(selectedStudent.studentNo);
        setAttempts(res.moduleAttempts || []);
      } catch (e) {
        setAttemptsError(e?.response?.data?.detail || e.message);
      } finally {
        setLoadingAttempts(false);
      }
    };
    fetchAttempts();
  }, [isModalOpen, selectedStudent]);

  // Build performance trend from attempts history (all cycles)
  useEffect(() => {
    if (!isModalOpen || !selectedStudent) return;
    const fetchTrend = async () => {
      try {
        setLoadingTrend(true); setTrendError(null);
        const res = await moduleService.getModuleAttemptsHistory(selectedStudent.studentNo);
        const history = res.history || [];
        const events = [];
        history.forEach(mod => {
          (mod.attempts || []).forEach(a => {
            events.push({
              moduleId: mod.moduleId,
              title: mod.title,
              type: a.type,
              percent: a.percent,
              archived: a.archived,
              date: new Date(a.submittedAt)
            });
          });
        });
        events.sort((a,b)=> a.date - b.date);
        const latestPre = {}; const latestPost = {}; const points = [];
        events.forEach(ev => {
          if (ev.type === 'pretest') latestPre[ev.moduleId] = ev.percent;
          if (ev.type === 'posttest') latestPost[ev.moduleId] = ev.percent;
          const preValues = Object.values(latestPre);
          const postValues = Object.values(latestPost);
          const avgPre = preValues.length ? preValues.reduce((a,c)=>a+c,0)/preValues.length : 0;
          const avgPost = postValues.length ? postValues.reduce((a,c)=>a+c,0)/postValues.length : 0;
          const improvement = (postValues.length && preValues.length) ? (avgPost - avgPre) : 0;
          points.push({
            ts: ev.date.getTime(),
            date: ev.date.toISOString(),
            avgPre: parseFloat(avgPre.toFixed(2)),
            avgPost: parseFloat(avgPost.toFixed(2)),
            improvement: parseFloat(improvement.toFixed(2))
          });
        });
        setTrendData(points);
      } catch (e) {
        setTrendError(e?.response?.data?.detail || e.message);
      } finally {
        setLoadingTrend(false);
      }
    };
    fetchTrend();
  }, [isModalOpen, selectedStudent]);

  const openHistory = async (moduleId, title) => {
    try {
      const res = await moduleService.getModuleAttemptsHistory(selectedStudent.studentNo);
      const found = (res.history || []).find(h => h.moduleId === moduleId);
      setHistoryModal({ open: true, moduleId, title, items: found ? found.attempts : [] });
    } catch (e) {
      setHistoryModal({ open: true, moduleId, title, items: [], error: e?.response?.data?.detail || e.message });
    }
  };

  const closeHistory = () => setHistoryModal({ open: false, moduleId: null, title: '', items: [] });

  return (
    <Modal isOpen={isModalOpen} onClose={closeStudentModal}>
      {selectedStudent && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{selectedStudent.name}'s Dashboard</h2>
            <button onClick={closeStudentModal} className="text-gray-500 hover:text-gray-800">✕</button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
            <div className="text-sm text-gray-700">Student No: <span className="font-semibold">{selectedStudent.studentNo}</span></div>
            <div className="text-sm text-gray-700">Program: <span className="font-semibold">{selectedStudent.program}</span></div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-600">View:</span>
              <select value={mode} onChange={(e)=> setMode(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="current">Current</option>
                <option value="previous">Previous</option>
                <option value="combined">Combined</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          {loadingDash && <p className="text-sm text-gray-500 mb-4">Loading dashboard...</p>}
          {errorDash && <p className="text-sm text-red-600 mb-4">{errorDash}</p>}
          {dashboard && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">All-Time Avg</p>
                <p className="text-2xl font-bold text-indigo-700 mt-1">{dashboard.averageScore}%</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">Current Accuracy</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">{dashboard.detailedMetrics?.accuracy}%</p>
                {dashboard.cycleComparison && <p className="text-xs text-emerald-600 mt-1">Prev: {dashboard.cycleComparison.previous.accuracy}%</p>}
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-xs uppercase tracking-wide text-yellow-600 font-semibold">Study Hours</p>
                <p className="text-2xl font-bold text-yellow-700 mt-1">{dashboard.studyHours}</p>
              </div>
              <div className="p-4 rounded-lg bg-fuchsia-50 border border-fuchsia-200">
                <p className="text-xs uppercase tracking-wide text-fuchsia-600 font-semibold">Learning Streak</p>
                <p className="text-2xl font-bold text-fuchsia-700 mt-1">{dashboard.learningStreak}d</p>
              </div>
            </div>
          )}

          {/* Performance Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Performance Trend (All-Time Averages)</h3>
              {trendData.length > 1 && (
                <span className="text-xs text-gray-500">Latest improvement: {trendData[trendData.length-1].improvement}%</span>
              )}
            </div>
            {loadingTrend && <p className="text-sm text-gray-500">Building trend...</p>}
            {trendError && <p className="text-sm text-red-600">{trendError}</p>}
            {!loadingTrend && !trendError && trendData.length === 0 && <p className="text-sm text-gray-600">No attempts yet to build a trend.</p>}
            {trendData.length > 0 && (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPre" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorPost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(v)=> new Date(v).toLocaleDateString()} minTickGap={50} />
                    <YAxis domain={[0, 100]} tickFormatter={(v)=> `${v}%`} />
                    <Tooltip labelFormatter={(v)=> new Date(v).toLocaleString()} formatter={(val, name)=> [`${val}%`, name === 'avgPre' ? 'Avg Pre' : name === 'avgPost' ? 'Avg Post' : 'Avg Improvement']} />
                    <Legend />
                    <Area type="monotone" dataKey="avgPre" name="Avg Pre" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPre)" strokeWidth={2} />
                    <Area type="monotone" dataKey="avgPost" name="Avg Post" stroke="#10b981" fillOpacity={1} fill="url(#colorPost)" strokeWidth={2} />
                    <Line type="monotone" dataKey="improvement" name="Avg Improvement" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Brush dataKey="date" height={22} travellerWidth={8} stroke="#6b7280" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Module Attempts Comparison Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Module Attempts & Performance (Per Module)</h3>
            {loadingAttempts && <p className="text-sm text-gray-500">Loading attempts...</p>}
            {attemptsError && <p className="text-sm text-red-600">{attemptsError}</p>}
            {!loadingAttempts && !attemptsError && attempts.length === 0 && <p className="text-sm text-gray-600">No attempts recorded yet.</p>}
            {attempts.length > 0 && (
              <div className="w-full h-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={attempts.map(a => ({
                      moduleId: a.moduleId,
                      title: a.title,
                      preAttempts: a.preAttempts,
                      postAttempts: a.postAttempts,
                      lastPre: a.lastPrePercent,
                      lastPost: a.lastPostPercent,
                      bestPre: a.bestPrePercent,
                      bestPost: a.bestPostPercent,
                      prevBestPre: a.prevBestPrePercent ?? 0,
                      prevBestPost: a.prevBestPostPercent ?? 0,
                    }))}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradPre" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="gradPost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                    <YAxis yAxisId="attempts" orientation="left" width={40} />
                    <YAxis yAxisId="percent" orientation="right" domain={[0,100]} tickFormatter={(v)=> `${v}%`} width={50} />
                    <Tooltip formatter={(value, name) => (typeof name === 'string' && name.includes('%')) ? [`${value}%`, name] : [value, name]} />
                    <Legend />
                    <Bar yAxisId="attempts" dataKey="preAttempts" name="Pre Attempts" fill="url(#gradPre)" stackId="a" onClick={(d)=> openHistory(d.payload.moduleId, d.payload.title)} />
                    <Bar yAxisId="attempts" dataKey="postAttempts" name="Post Attempts" fill="url(#gradPost)" stackId="a" onClick={(d)=> openHistory(d.payload.moduleId, d.payload.title)} />
                    <Line yAxisId="percent" type="monotone" dataKey="bestPre" name="Best Pre%" stroke="#2563eb" strokeWidth={3} dot={false} />
                    <Line yAxisId="percent" type="monotone" dataKey="bestPost" name="Best Post%" stroke="#10b981" strokeWidth={3} dot={false} />
                    <Line yAxisId="percent" type="monotone" dataKey="prevBestPre" name="Prev Best Pre%" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    <Line yAxisId="percent" type="monotone" dataKey="prevBestPost" name="Prev Best Post%" stroke="#f97316" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    <Scatter yAxisId="percent" dataKey="lastPre" name="Last Pre%" fill="#93c5fd" shape="circle" onClick={(d)=> openHistory(d.payload.moduleId, d.payload.title)} />
                    <Scatter yAxisId="percent" dataKey="lastPost" name="Last Post%" fill="#86efac" shape="circle" onClick={(d)=> openHistory(d.payload.moduleId, d.payload.title)} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Attempts History Modal */}
          {historyModal.open && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Attempts History — {historyModal.title}</h3>
                  <button className="text-gray-500 hover:text-gray-800" onClick={closeHistory}>✕</button>
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
                  <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark" onClick={closeHistory}>Close</button>
                </div>
              </div>
            </div>
          )}

          <div className="text-right mt-2">
            <button onClick={closeStudentModal} className="btn btn-secondary">Close</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StudentDashboardModal;
