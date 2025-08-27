import { useEffect, useState, useCallback } from "react";
import useAccountStore from "../../store/admin/accountStore";
import AccountsToolbar from "../../features/admin/adminAccounts/components/AccountsToolbar";
import AccountsTable from "../../features/admin/adminAccounts/components/AccountsTable";
import AccountForm from "../../features/admin/adminAccounts/components/AccountForm";
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
        <AccountForm />
      </Modal>
    </div>
  );
};

export default AccountsManagementPage;
