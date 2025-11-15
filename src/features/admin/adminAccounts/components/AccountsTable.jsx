import { FiArchive, FiClock } from "react-icons/fi";
import useAccountStore from "../../../../store/admin/accountStore";
import { useState } from "react";
import Modal from "../../../../components/common/Modal";
import adminService from "../../../../services/adminService";

const AccountsTable = ({ accounts, selectedIds, onSelectionChange }) => {
  const { archiveAccount } = useAccountStore();
  const [scheduleModal, setScheduleModal] = useState({ open: false, account: null, when: "" });
  const [examDetail, setExamDetail] = useState({ open: false, account: null });
  const openSchedule = (acc) => {
    setScheduleModal({ open: true, account: acc, when: "" });
  };
  const submitSchedule = async () => {
    if (!scheduleModal.account || !scheduleModal.when) return;
    try {
      await adminService.setExamPromptSchedule(scheduleModal.account.id_number, scheduleModal.when);
      setScheduleModal({ open: false, account: null, when: "" });
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Exam prompt scheduled.' } }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Failed to schedule.' } }));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange(accounts.map((acc) => acc._id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id) => {
    onSelectionChange((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Table for medium and larger screens */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="p-4">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                  onChange={handleSelectAll}
                  checked={selectedIds.length === accounts.length && accounts.length > 0}
                />
              </th>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">ID Number</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Created</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc._id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                    checked={selectedIds.includes(acc._id)}
                    onChange={() => handleSelectOne(acc._id)}
                  />
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{acc.firstname} {acc.lastname}</td>
                <td className="px-6 py-4">{acc.id_number}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      {
                        admin: "bg-blue-100 text-blue-800",
                        instructor: "bg-green-100 text-green-800",
                        student: "bg-yellow-100 text-yellow-800",
                      }[acc.role] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {acc.role}
                  </span>
                </td>
                
                <td className="px-6 py-4">{acc.createdAt ? new Date(acc.createdAt).toLocaleString() : '—'}</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  {!acc.archived && (
                    <button onClick={() => archiveAccount(acc._id)} className="p-2 text-gray-500 hover:text-red-600" title="Archive">
                      <FiArchive />
                    </button>
                  )}
                  {acc.role === 'student' && (
                    <>
                      <button onClick={() => openSchedule(acc)} className="p-2 text-gray-500 hover:text-amber-600" title="Schedule Exam Prompt">
                        <FiClock />
                      </button>
                      <button onClick={() => setExamDetail({ open: true, account: acc })} className="px-2 py-1 text-xs border rounded">View</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards for small screens */}
      <div className="md:hidden">
        {accounts.map((acc) => (
          <div key={acc._id} className="border-b p-4 flex items-start gap-4">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
              checked={selectedIds.includes(acc._id)}
              onChange={() => handleSelectOne(acc._id)}
            />
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-gray-900">{acc.firstname} {acc.lastname}</p>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${{
                    admin: "bg-blue-100 text-blue-800",
                    instructor: "bg-green-100 text-green-800",
                    student: "bg-yellow-100 text-yellow-800",
                  }[acc.role] || "bg-gray-100 text-gray-800"}`}
                >
                  {acc.role}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">ID: {acc.id_number}</p>
              <div className="flex items-center gap-2">
                {!acc.archived && (
                  <button onClick={() => archiveAccount(acc._id)} className="p-2 text-gray-500 hover:text-red-600"><FiArchive className="mr-1"/> Archive</button>
                )}
                {acc.role === 'student' && (
                  <>
                    <button onClick={() => openSchedule(acc)} className="p-2 text-gray-500 hover:text-amber-600"><FiClock className="mr-1"/> Exam Prompt</button>
                    <button onClick={() => setExamDetail({ open: true, account: acc })} className="px-2 py-1 text-xs border rounded">View Exam</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={scheduleModal.open} onClose={() => setScheduleModal({ open: false, account: null, when: "" })} title="Schedule Exam Prompt" maxWidth="max-w-md">
        <div className="space-y-3">
          <div className="text-sm text-gray-700">Student: <span className="font-semibold">{scheduleModal.account?.firstname} {scheduleModal.account?.lastname}</span> ({scheduleModal.account?.id_number})</div>
          <label className="block text-sm font-medium text-gray-700">Prompt Date</label>
          <input type="date" className="border rounded px-3 py-2 w-full" value={scheduleModal.when} onChange={(e) => setScheduleModal(s => ({ ...s, when: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setScheduleModal({ open: false, account: null, when: "" })} className="px-3 py-2 bg-gray-100 rounded">Cancel</button>
            <button onClick={submitSchedule} className="px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">Schedule</button>
          </div>
        </div>
      </Modal>

      {/* Exam details modal */}
      <Modal isOpen={examDetail.open} onClose={() => setExamDetail({ open: false, account: null })} title="Exam Responses" maxWidth="max-w-md">
        {examDetail.account ? (
          <div className="space-y-2 text-sm">
            <div><span className="font-semibold">Student:</span> {examDetail.account.firstname} {examDetail.account.lastname} ({examDetail.account.id_number})</div>
            <div><span className="font-semibold">Status:</span> {examDetail.account.examFlow?.status || '—'}</div>
            <div><span className="font-semibold">Prompt Date:</span> {examDetail.account.examFlow?.promptScheduleAt ? new Date(examDetail.account.examFlow.promptScheduleAt).toLocaleDateString() : '—'}</div>
            <div><span className="font-semibold">Exam Date:</span> {examDetail.account.examFlow?.examDate ? new Date(examDetail.account.examFlow.examDate).toLocaleDateString() : '—'}</div>
            {examDetail.account.examFlow?.declineReason && (
              <div><span className="font-semibold">Reason (declined):</span> {examDetail.account.examFlow.declineReason}</div>
            )}
            {examDetail.account.examFlow?.feedback && (
              <div><span className="font-semibold">Feedback:</span> {examDetail.account.examFlow.feedback}</div>
            )}
            <div><span className="font-semibold">Result:</span> {examDetail.account.examFlow?.result || '—'}</div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default AccountsTable;
