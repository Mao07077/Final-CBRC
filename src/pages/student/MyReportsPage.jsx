import { useEffect, useState } from "react";
import useReportStore from "../../store/student/reportStore";

const FeedbackModal = ({ open, onClose, report, onMarkRead }) => {
  if (!open || !report) return null;
  const handleMarkRead = async () => {
    const ok = await onMarkRead(report.id);
    if (ok) onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg bg-white rounded-md shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Admin Feedback</h3>
        <div className="text-sm text-gray-700 whitespace-pre-wrap min-h-24 border rounded p-3">
          {report.feedback || "No feedback yet."}
        </div>
        {report.feedbackAt && (
          <p className="mt-2 text-xs text-gray-500">Given: {new Date(report.feedbackAt).toLocaleString()}</p>
        )}
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded border">Close</button>
          {!!report.feedback && !report.feedbackRead && (
            <button onClick={handleMarkRead} className="px-3 py-1.5 text-sm rounded bg-indigo-600 text-white">Mark as read</button>
          )}
        </div>
      </div>
    </div>
  );
};

const MyReportsPage = () => {
  const { reports, loadingReports, error, fetchMyReports, markFeedbackRead } = useReportStore();
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchMyReports();
  }, [fetchMyReports]);

  const openModal = (r) => {
    setSelected(r);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setSelected(null);
  };

  return (
    <div className="bg-white rounded-md shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">My Reports</h1>
        <button onClick={fetchMyReports} className="px-3 py-1.5 text-sm rounded border">Refresh</button>
      </div>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      {loadingReports ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Issue</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Feedback</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{r.issue}</td>
                  <td className="py-2 pr-4">{r.date}</td>
                  <td className="py-2 pr-4">{r.status}</td>
                  <td className="py-2 pr-4">
                    {r.feedback ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="truncate max-w-[240px] text-gray-700">{r.feedback}</span>
                        {!r.feedbackRead && (
                          <span className="text-[10px] text-white bg-red-600 rounded-full px-2 py-0.5">New</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      className="px-2 py-1 text-xs rounded border"
                      onClick={() => openModal(r)}
                      disabled={!r.feedback}
                      title={r.feedback ? "View feedback" : "No feedback yet"}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">No reports yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <FeedbackModal open={open} onClose={closeModal} report={selected} onMarkRead={markFeedbackRead} />
    </div>
  );
};

export default MyReportsPage;
