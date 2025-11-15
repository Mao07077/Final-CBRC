import { useEffect, useState, useCallback } from "react";
import useAccountStore from "../../store/admin/accountStore";
import AccountsToolbar from "../../features/admin/adminAccounts/components/AccountsToolbar";
import AccountsTable from "../../features/admin/adminAccounts/components/AccountsTable";
import SignupForm from "../../features/authentication/components/SignupForm";
import Modal from "../../components/common/Modal";

const AccountsManagementPage = () => {
  const {
    filteredAccounts,
    fetchAccounts,
    filterAccounts,
    isLoading,
    error,
    isModalOpen,
    editingAccount,
    closeModal,
  } = useAccountStore();
  const [filters, setFilters] = useState({ query: "", role: "" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [archivedAccounts, setArchivedAccounts] = useState([]);
  const [archivedQuery, setArchivedQuery] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleFilterChange = useCallback(
    (newFilter) => {
      const updatedFilters = { ...filters, ...newFilter };
      setFilters(updatedFilters);
      filterAccounts(updatedFilters);
      setSelectedIds([]); // Reset selection on filter change
    },
    [filters, filterAccounts]
  );

  const selectedAccounts = filteredAccounts.filter((acc) =>
    selectedIds.includes(acc._id)
  );

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-primary-dark mb-6 self-start">
        Accounts Management
      </h1>

      <AccountsToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        selectedAccounts={selectedAccounts}
      />
      <div className="mb-4 flex gap-2">
        <button onClick={() => { openModal(null); }} className="px-3 py-2 rounded border border-indigo-600 text-indigo-600 text-sm">Create Account</button>
        <button onClick={async () => { const list = await useAccountStore.getState().fetchArchivedAccounts(); setArchivedAccounts(list); setArchivedOpen(true); }} className="px-3 py-2 rounded border border-gray-600 text-gray-700 text-sm">Archived Accounts</button>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg my-4">{error}</p>}
      {isLoading ? (
        <p>Loading accounts...</p>
      ) : (
        <AccountsTable
          accounts={filteredAccounts}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAccount ? "Edit Account" : "Create New Account"}
      >
        {/* Use Signup form inside modal in admin mode (no auto-login or redirect) */}
        <SignupForm
          asAdmin
          onCancel={closeModal}
          onSuccess={async () => {
            await fetchAccounts();
            closeModal();
          }}
        />
      </Modal>
      {archivedOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Archived Accounts</h2>
              <button onClick={() => setArchivedOpen(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <input
              type="text"
              placeholder="Search archived accounts..."
              className="border rounded px-3 py-2 mb-4 w-full"
              value={archivedQuery}
              onChange={(e) => setArchivedQuery(e.target.value)}
            />
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID Number</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {archivedAccounts
                  .filter(acc => {
                    const q = archivedQuery.toLowerCase();
                    if (!q) return true;
                    const name = `${acc.firstname} ${acc.lastname}`.toLowerCase();
                    return name.includes(q) || String(acc.id_number).toLowerCase().includes(q) || String(acc.role).toLowerCase().includes(q);
                  })
                  .map(acc => (
                  <tr key={acc._id}>
                    <td>{acc.firstname} {acc.lastname}</td>
                    <td>{acc.id_number}</td>
                    <td>{acc.role}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => { await useAccountStore.getState().unarchiveAccount(acc._id); const list = await useAccountStore.getState().fetchArchivedAccounts(); setArchivedAccounts(list); }}
                          className="px-3 py-1 rounded bg-green-600 text-white"
                        >Restore</button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await (await import('../../services/adminService')).default.getArchivedPerformance(acc.id_number);
                              const data = res.snapshot || res;
                              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `archived_performance_${acc.id_number}.json`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            } catch (e) {
                              alert('Failed to download performance');
                            }
                          }}
                          className="px-3 py-1 rounded border"
                        >Download Performance</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsManagementPage;
