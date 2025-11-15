import { useEffect, useMemo, useState } from "react";
import adminService from "../../../../services/adminService";
import { pdf } from "@react-pdf/renderer";
import StudentReportPDF from "./StudentReportPDF";
import CombinedStudentReportPDF from "./CombinedStudentReportPDF";

const ArchivedPerformanceModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [query, setQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [combining, setCombining] = useState(false);

  useEffect(() => {
    if (!open) return;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await adminService.getArchivedAccounts();
        const list = res.accounts || [];
        setAccounts(list);
      } catch (e) {
        setError("Failed to load archived accounts");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return (accounts || []).filter((a) => {
      const name = `${a.firstname || ''} ${a.lastname || ''}`.trim().toLowerCase();
      return (
        name.includes(q) || String(a.id_number || '').toLowerCase().includes(q) || String(a.role || '').toLowerCase().includes(q)
      );
    });
  }, [query, accounts]);

  const buildStudentForPDF = (acc, snapshot) => {
    const pre = snapshot?.performance?.pre_tests || [];
    const post = snapshot?.performance?.post_tests || [];
    const scores = [];
    pre.forEach((t) => {
      const pct = typeof t.score === 'number' ? Math.round(t.score) : t.total_questions ? Math.round((t.correct / Math.max(1, t.total_questions)) * 100) : 0;
      scores.push({ label: t.title || 'Pre-Test', value: pct });
    });
    post.forEach((t) => {
      const pct = typeof t.score === 'number' ? Math.round(t.score) : t.total_questions ? Math.round((t.correct / Math.max(1, t.total_questions)) * 100) : 0;
      scores.push({ label: t.title || 'Post-Test', value: pct });
    });
    return {
      firstname: acc.firstname,
      lastname: acc.lastname,
      id_number: acc.id_number,
      program: acc.program,
      performance: { scores },
      testHistory: [...pre.map(p => ({ name: p.title, score: typeof p.score === 'number' ? `${Math.round(p.score)}%` : `${p.correct}/${p.total_questions}` })), ...post.map(p => ({ name: p.title, score: typeof p.score === 'number' ? `${Math.round(p.score)}%` : `${p.correct}/${p.total_questions}` }))],
    };
  };

  const downloadPDF = async (acc) => {
    setDownloadingId(acc._id);
    try {
      const res = await adminService.getArchivedPerformance(acc.id_number);
      const snapshot = res.snapshot || res;
      const student = buildStudentForPDF(acc, snapshot);
      const blob = await pdf(<StudentReportPDF student={student} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = `${(acc.firstname || '')}_${(acc.lastname || '')}_${acc.id_number}`.replace(/\s+/g, '_');
      a.download = `Archived_Performance_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const ids = filtered.map((a) => a._id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : ids);
  };

  const buildStudentFromSnapshot = (acc, snapshot) => {
    const pre = snapshot?.performance?.pre_tests || [];
    const post = snapshot?.performance?.post_tests || [];
    const scores = [];
    pre.forEach((t) => {
      const pct = typeof t.score === 'number' ? Math.round(t.score) : t.total_questions ? Math.round((t.correct / Math.max(1, t.total_questions)) * 100) : 0;
      scores.push({ label: t.title || 'Pre-Test', value: pct });
    });
    post.forEach((t) => {
      const pct = typeof t.score === 'number' ? Math.round(t.score) : t.total_questions ? Math.round((t.correct / Math.max(1, t.total_questions)) * 100) : 0;
      scores.push({ label: t.title || 'Post-Test', value: pct });
    });
    return {
      firstname: acc.firstname,
      lastname: acc.lastname,
      id_number: acc.id_number,
      program: acc.program,
      performance: { scores },
      testHistory: [
        ...pre.map((p) => ({ name: p.title || 'Pre-Test', score: typeof p.score === 'number' ? Math.round(p.score) : (p.total_questions ? Math.round((p.correct / Math.max(1, p.total_questions)) * 100) : 0) })),
        ...post.map((p) => ({ name: p.title || 'Post-Test', score: typeof p.score === 'number' ? Math.round(p.score) : (p.total_questions ? Math.round((p.correct / Math.max(1, p.total_questions)) * 100) : 0) }))
      ],
    };
  };

  const downloadCombined = async () => {
    if (!selectedIds.length) return;
    setCombining(true);
    try {
      const selected = accounts.filter((a) => selectedIds.includes(a._id));
      const snapshots = await Promise.all(
        selected.map((acc) => adminService.getArchivedPerformance(acc.id_number).then((r) => ({ acc, snap: r.snapshot || r })))
      );
      const students = snapshots.map(({ acc, snap }) => buildStudentFromSnapshot(acc, snap));
      // Use CombinedStudentReportPDF via @react-pdf to build one blob
      const blob = await pdf(<CombinedStudentReportPDF students={students} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Archived_Performance_Combined_${selected.length}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to download combined PDF');
    } finally {
      setCombining(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Archived Performance</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>×</button>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search archived accounts..."
            className="flex-1 border rounded px-3 py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm disabled:opacity-50"
            onClick={downloadCombined}
            disabled={combining || selectedIds.length === 0}
          >
            {combining ? 'Preparing…' : `Download Combined (${selectedIds.length})`}
          </button>
        </div>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2 w-10">
                    <input type="checkbox" onChange={toggleSelectAll} checked={filtered.length > 0 && filtered.every(a => selectedIds.includes(a._id))} />
                  </th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">ID Number</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filtered || []).map((acc) => (
                  <tr key={acc._id} className="border-b last:border-0">
                    <td className="py-2 pr-2">
                      <input type="checkbox" checked={selectedIds.includes(acc._id)} onChange={() => toggleSelect(acc._id)} />
                    </td>
                    <td className="py-2 pr-4">{acc.firstname} {acc.lastname}</td>
                    <td className="py-2 pr-4">{acc.id_number}</td>
                    <td className="py-2 pr-4">{acc.role}</td>
                    <td className="py-2 pr-4">
                      <button
                        className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs"
                        onClick={() => downloadPDF(acc)}
                        disabled={downloadingId === acc._id}
                      >
                        {downloadingId === acc._id ? 'Preparing…' : 'Download PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">No archived accounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedPerformanceModal;
