import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line, Scatter, AreaChart, Area, Brush } from "recharts";
import useDashboardStore from "../../store/student/dashboardStore";
import moduleService from "../../services/moduleService";
import RecommendedPages from "../../features/student/dashboard/components/RecommendedPage";
import ModuleList from "../../features/student/dashboard/components/ModuleList";
import ScoreOverview from "../../features/student/dashboard/components/ScoreOverview";
import StatisticsOverview from "../../features/student/dashboard/components/StatisticsOverview";
import Modal from "../../components/common/Modal";
import useAuthStore from "../../store/authStore";
import examFlowService from "../../services/examFlowService";

const DashboardPage = () => {
  const { fetchDashboardData, isLoading, error } = useDashboardStore();
  const [mode, setMode] = useState('current');
  const [attempts, setAttempts] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [trendError, setTrendError] = useState(null);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [attemptsError, setAttemptsError] = useState(null);
  const [historyModal, setHistoryModal] = useState({ open: false, moduleId: null, title: '', items: [] });
  const { userData } = useAuthStore();
  const [examModal, setExamModal] = useState({ open: false, type: null });
  const [decision, setDecision] = useState({ willTake: null, reason: "", examDate: "" });
  const [result, setResult] = useState({ choice: "no_result_yet", feedback: "" });
  const [decisionError, setDecisionError] = useState("");
  const [resultError, setResultError] = useState("");

  useEffect(() => {
    fetchDashboardData(mode);
    fetchAttempts();
    fetchTrend();
    checkExamFlow();
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

  const fetchTrend = async () => {
    try {
      setLoadingTrend(true);
      setTrendError(null);
      const userDataRaw = localStorage.getItem('userData');
      const userId = userDataRaw ? JSON.parse(userDataRaw).id_number : localStorage.getItem('id_number');
      if (!userId) return;
      const res = await moduleService.getModuleAttemptsHistory(userId);
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
      const latestPre = {};
      const latestPost = {};
      const points = [];
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

  const checkExamFlow = async () => {
    try {
      const idNumber = userData?.id_number;
      if (!idNumber) return;
      const res = await examFlowService.getFlow(idNumber);
      if (res?.success && res?.flow?.shouldPrompt) {
        setExamModal({ open: true, type: res.flow.promptType });
      }
    } catch {}
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

      {/* Performance Trend (Crypto-style area/line chart) */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Performance Trend (All-Time Averages)</h2>
          {trendData.length > 1 && (
            <span className="text-xs text-gray-500">Latest improvement: {trendData[trendData.length-1].improvement}%</span>
          )}
        </div>
        {loadingTrend && <p className="text-sm text-gray-500">Building trend...</p>}
        {trendError && <p className="text-sm text-red-600">{trendError}</p>}
        {!loadingTrend && !trendError && trendData.length === 0 && (
          <p className="text-sm text-gray-600">No attempts yet to build a trend.</p>
        )}
        {trendData.length > 0 && (
          <div className="w-full h-80">
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
                <Tooltip
                  labelFormatter={(v)=> new Date(v).toLocaleString()}
                  formatter={(val, name)=> [`${val}%`, name === 'avgPre' ? 'Avg Pre' : name === 'avgPost' ? 'Avg Post' : 'Avg Improvement']}
                />
                <Legend />
                <Area type="monotone" dataKey="avgPre" name="Avg Pre" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPre)" strokeWidth={2} />
                <Area type="monotone" dataKey="avgPost" name="Avg Post" stroke="#10b981" fillOpacity={1} fill="url(#colorPost)" strokeWidth={2} />
                <Line type="monotone" dataKey="improvement" name="Avg Improvement" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Brush dataKey="date" height={24} travellerWidth={8} stroke="#6b7280" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Module Attempts Summary */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
  <h2 className="text-xl font-bold text-gray-800 mb-4">Module Attempts & Performance (Per Module Comparison)</h2>
        {/* Unified Comparison Graph (ComposedChart) */}
        {attempts.length > 0 && (
          <div className="w-full h-[560px] mb-4">
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
                <Tooltip formatter={(value, name) => {
                  if (typeof name === 'string' && name.includes('%')) return [`${value}%`, name];
                  return [value, name];
                }} />
                <Legend />
                {/* Attempts (stacked bars) */}
                <Bar yAxisId="attempts" dataKey="preAttempts" name="Pre Attempts" fill="url(#gradPre)" stackId="a" onClick={(d)=> openHistory(d.payload.moduleId, d.payload.title)} />
                <Bar yAxisId="attempts" dataKey="postAttempts" name="Post Attempts" fill="url(#gradPost)" stackId="a" onClick={(d)=> openHistory(d.payload.moduleId, d.payload.title)} />
                {/* Current best lines */}
                <Line yAxisId="percent" type="monotone" dataKey="bestPre" name="Best Pre%" stroke="#2563eb" strokeWidth={3} dot={false} />
                <Line yAxisId="percent" type="monotone" dataKey="bestPost" name="Best Post%" stroke="#10b981" strokeWidth={3} dot={false} />
                {/* Previous best (dashed) */}
                <Line yAxisId="percent" type="monotone" dataKey="prevBestPre" name="Prev Best Pre%" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                <Line yAxisId="percent" type="monotone" dataKey="prevBestPost" name="Prev Best Post%" stroke="#f97316" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                {/* Last attempt markers */}
                <Scatter yAxisId="percent" dataKey="lastPre" name="Last Pre%" fill="#93c5fd" shape="circle" onClick={(d)=> openHistory(d.payload.moduleId, d.payload.title)} />
                <Scatter yAxisId="percent" dataKey="lastPost" name="Last Post%" fill="#86efac" shape="circle" onClick={(d)=> openHistory(d.payload.moduleId, d.payload.title)} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        {loadingAttempts && <p className="text-sm text-gray-500 mt-2">Loading attempts...</p>}
        {attemptsError && <p className="text-sm text-red-600 mt-2">{attemptsError}</p>}
        {!loadingAttempts && !attemptsError && attempts.length === 0 && (
          <p className="text-sm text-gray-600">No attempts recorded yet.</p>
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

    {/* Exam Flow Modal */}
    <Modal
      isOpen={examModal.open}
      onClose={() => {}}
      title={examModal.type === 'initial' ? 'Licensure Exam Intent' : 'Licensure Exam Result'}
      maxWidth="max-w-md"
      closable={false}
    >
      {examModal.type === 'initial' ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Are you planning to take the licensure exam?</p>
          <div className="flex gap-2">
            <button onClick={() => setDecision(d => ({ ...d, willTake: true }))} className={`px-3 py-2 rounded ${decision.willTake === true ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>Yes</button>
            <button onClick={() => setDecision(d => ({ ...d, willTake: false }))} className={`px-3 py-2 rounded ${decision.willTake === false ? 'bg-rose-600 text-white' : 'bg-gray-100'}`}>No</button>
          </div>
          {decision.willTake === false && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Please share your reason</label>
              <textarea className="w-full border rounded px-3 py-2" rows={3} value={decision.reason} onChange={e => setDecision(d => ({ ...d, reason: e.target.value }))} />
              {decisionError && <div className="text-xs text-rose-600 mt-1">{decisionError}</div>}
            </div>
          )}
          {decision.willTake === true && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">When is your exam?</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={decision.examDate} onChange={e => setDecision(d => ({ ...d, examDate: e.target.value }))} />
              {decisionError && <div className="text-xs text-rose-600 mt-1">{decisionError}</div>}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={async () => {
                const id = userData?.id_number; if (!id) return;
                if (decision.willTake === null) return;
                setDecisionError("");
                if (decision.willTake === false) {
                  if (!decision.reason || !decision.reason.trim()) { setDecisionError('Reason is required'); return; }
                  await examFlowService.submitDecision(id, { willTake: false, reason: decision.reason });
                } else {
                  if (!decision.examDate) { setDecisionError('Exam date is required'); return; }
                  await examFlowService.submitDecision(id, { willTake: true, examDate: decision.examDate });
                }
                setExamModal({ open: false, type: null });
              }}
              className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Submit
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">How was your exam result? Share a quick feedback and mark your result.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback (optional)</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={result.feedback} onChange={e => setResult(r => ({ ...r, feedback: e.target.value }))} />
            {resultError && <div className="text-xs text-rose-600 mt-1">{resultError}</div>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setResult(r => ({ ...r, choice: 'pass' }))} className={`px-3 py-2 rounded ${result.choice === 'pass' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>Pass</button>
            <button onClick={() => setResult(r => ({ ...r, choice: 'fail' }))} className={`px-3 py-2 rounded ${result.choice === 'fail' ? 'bg-rose-600 text-white' : 'bg-gray-100'}`}>Fail</button>
            <button onClick={() => setResult(r => ({ ...r, choice: 'no_result_yet' }))} className={`px-3 py-2 rounded ${result.choice === 'no_result_yet' ? 'bg-amber-600 text-white' : 'bg-gray-100'}`}>No result yet</button>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={async () => {
                const id = userData?.id_number; if (!id) return;
                setResultError("");
                if ((result.choice === 'pass' || result.choice === 'fail') && (!result.feedback || !result.feedback.trim())) { setResultError('Feedback is required for pass/fail'); return; }
                await examFlowService.submitResult(id, { result: result.choice, feedback: result.feedback });
                setExamModal({ open: false, type: null });
              }}
              className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </Modal>
  </div>
  );
};

export default DashboardPage;
