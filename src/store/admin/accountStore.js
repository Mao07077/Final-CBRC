import { create } from "zustand";
import axios from "../../api/axios";

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
      const response = await axios.get('/api/admin/accounts');
      if (response.data.success) {
        const accounts = response.data.accounts || [];
        set({ 
          accounts, 
          filteredAccounts: accounts, 
          isLoading: false 
        });
      } else {
        throw new Error('Failed to fetch accounts');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      set({ 
        error: 'Failed to fetch accounts', 
        isLoading: false,
        accounts: [],
        filteredAccounts: []
      });
    }
  },

  saveAccount: (accountData) => {
    set({ isLoading: true });
    const { accounts, editingAccount } = get();
    let updatedAccounts;

    if (editingAccount) {
      // Update
      updatedAccounts = accounts.map((acc) =>
        acc._id === editingAccount._id ? { ...acc, ...accountData } : acc
      );
    } else {
      // Create
      const newAccount = {
        ...accountData,
        _id: Date.now().toString(),
        is_verified: accountData.role !== "student",
      };
      updatedAccounts = [...accounts, newAccount];
    }

    set({
      accounts: updatedAccounts,
      filteredAccounts: updatedAccounts,
      isLoading: false,
      isModalOpen: false,
      editingAccount: null,
    });
  },

  deleteAccount: (accountId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this account? This is permanent."
      )
    )
      return;

    set((state) => {
      const updatedAccounts = state.accounts.filter(
        (acc) => acc._id !== accountId
      );
      return {
        accounts: updatedAccounts,
        filteredAccounts: updatedAccounts,
      };
    });
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
