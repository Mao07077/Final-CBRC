import { create } from "zustand";
import adminService from "../../services/adminService";

const useAccountStore = create((set, get) => ({
  accounts: [],
  filteredAccounts: [],
  isLoading: false,
  error: null,
  isModalOpen: false,
  editingAccount: null,

  // --- Actions ---
  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminService.getAllAccounts();
      if (response.success) {
        const accounts = response.accounts || [];
        set({ accounts, filteredAccounts: accounts, isLoading: false });
      } else {
        throw new Error('Failed to fetch accounts');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      set({ error: 'Failed to fetch accounts', isLoading: false, accounts: [], filteredAccounts: [] });
    }
  },

  saveAccount: async (accountData) => {
    set({ isLoading: true });
    const { accounts, editingAccount } = get();
    try {
      if (editingAccount) {
        const response = await adminService.updateAccount(editingAccount._id, accountData);
        if (!response.success) throw new Error('Update failed');
        const updated = response.account;
        const newAccounts = accounts.map(acc => acc._id === editingAccount._id ? updated : acc);
        set({ accounts: newAccounts, filteredAccounts: newAccounts });
      } else {
        const response = await adminService.createAccount(accountData);
        if (!response.success) throw new Error('Create failed');
        const created = response.account;
        const newAccounts = [...accounts, created];
        set({ accounts: newAccounts, filteredAccounts: newAccounts });
      }
      set({ isLoading: false, isModalOpen: false, editingAccount: null });
    } catch (e) {
      console.error('Save account error', e);
      set({ isLoading: false, error: 'Failed to save account' });
    }
  },

  archiveAccount: async (accountId) => {
    if (!window.confirm("Archive this account? The user will lose access.")) return;
    try {
      const response = await adminService.archiveAccount(accountId);
      if (!response.success) throw new Error('Archive failed');
      // Refresh
      await get().fetchAccounts();
    } catch (e) {
      console.error('Archive account error', e);
      set({ error: 'Failed to archive account' });
    }
  },
  unarchiveAccount: async (accountId) => {
    try {
      const response = await adminService.unarchiveAccount(accountId);
      if (!response.success) throw new Error('Unarchive failed');
      await get().fetchAccounts();
    } catch (e) {
      console.error('Unarchive account error', e);
      set({ error: 'Failed to unarchive account' });
    }
  },
  fetchArchivedAccounts: async () => {
    try {
      const res = await adminService.getArchivedAccounts();
      return res.accounts || [];
    } catch (e) {
      return [];
    }
  },

  filterAccounts: (filters) => {
    const { accounts } = get();
    const { query = "", role = "" } = filters;
    const lowerCaseQuery = query.toLowerCase();

    const results = accounts.filter((acc) => {
      const name = `${acc.firstname} ${acc.lastname}`;
      const matchesQuery =
        name.toLowerCase().includes(lowerCaseQuery) ||
        acc.id_number?.includes(lowerCaseQuery);
      const matchesRole = role
        ? acc.role.toLowerCase() === role.toLowerCase()
        : true;
      return matchesQuery && matchesRole;
    });

    set({ filteredAccounts: results });
  },

  // --- Modal Control ---
  openModal: (account = null) =>
    set({ isModalOpen: true, editingAccount: account, error: null }),
  closeModal: () => set({ isModalOpen: false, editingAccount: null }),
}));

export default useAccountStore;
