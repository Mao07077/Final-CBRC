import React from "react";
import useReportStore from "../../../../store/admin/reportStore";
import Modal from "../../../../components/common/Modal";

const DetailRow = ({ label, value }) => (
  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value}</dd>
  </div>
);

const ReportDetailsModal = () => {
  const { selectedReport, closeModal, updateReportStatus } = useReportStore();

  if (!selectedReport) {
    return null;
  }

  const handleStatusChange = (e) => {
    updateReportStatus(selectedReport._id, e.target.value);
  }

  return (
    <Modal
      isOpen={!!selectedReport}
      onClose={closeModal}
      title={`Report: ${selectedReport.issue}`}
      style={{ maxWidth: '300px', width: '100%' }}
    >
      <div className="mt-4 space-y-6">
        {selectedReport.screenshot && (
          <div className="mb-4 flex justify-center">
            <img
              src={selectedReport.screenshot.startsWith('http') ? selectedReport.screenshot : `${process.env.REACT_APP_API_URL}/${selectedReport.screenshot}`}
              alt="Screenshot"
              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
              className="rounded-lg border"
            />
          </div>
        )}

        <div className="border-t border-gray-200">
          <dl>
            <DetailRow label="Student" value={selectedReport.student} />
              {selectedReport.studentId && (
                <DetailRow label="Student ID" value={selectedReport.studentId} />
              )}
            <DetailRow label="Date" value={selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleString() : ''} />
            <DetailRow label="Description" value={<p className="whitespace-pre-wrap">{selectedReport.issue}</p>} />
              {selectedReport.messages && selectedReport.messages.length > 0 && (
                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Messages</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <ul className="list-disc pl-4">
                      {selectedReport.messages.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                <select
                  value={selectedReport.status}
                  onChange={handleStatusChange}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
                >
                  <option>Pending</option>
                  <option>Resolved</option>
                  <option>Archived</option>
                </select>
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReportDetailsModal;
