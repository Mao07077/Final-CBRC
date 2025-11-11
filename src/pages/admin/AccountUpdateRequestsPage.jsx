import { useEffect, useState } from "react";
import useRequestStore from "../../store/admin/requestStore";
import RequestsTable from "../../features/admin/adminUpdateRequests/components/RequestsTable";
import RequestDetailsModal from "../../features/admin/adminUpdateRequests/components/RequestDetailsModal";
import Toast from "../../components/common/Toast";

const AccountUpdateRequestsPage = () => {
  const { fetchRequests, isLoading, error } = useRequestStore();
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const handler = (e) => {
      const { type, message } = e.detail || {};
      if (message) {
        setToastMessage(message);
      }
    };
    window.addEventListener('toast', handler);
    return () => window.removeEventListener('toast', handler);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-primary-dark mb-6 self-start">
        Account Update Requests
      </h1>

      {error && (
        <p className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</p>
      )}
      {isLoading ? <p>Loading requests...</p> : <RequestsTable />}

      <RequestDetailsModal />
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default AccountUpdateRequestsPage;
