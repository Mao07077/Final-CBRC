import { create } from "zustand";
import axios from "../../api/axiosClient";
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

  deleteAccount: async (accountId) => {
    if (!window.confirm("Delete this account permanently?")) return;
    try {
      const response = await adminService.deleteAccount(accountId);
      if (!response.success) throw new Error('Delete failed');
      set(state => {
        const updatedAccounts = state.accounts.filter(acc => acc._id !== accountId);
        return { accounts: updatedAccounts, filteredAccounts: updatedAccounts };
      });
    } catch (e) {
      console.error('Delete account error', e);
      set({ error: 'Failed to delete account' });
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
