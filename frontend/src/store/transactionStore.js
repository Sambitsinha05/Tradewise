import { create } from 'zustand';
import { api } from './authStore';

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  stats: null,
  isLoading: false,

  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/transactions');
      set({ transactions: res.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const res = await api.get('/transactions/stats');
      set({ stats: res.data });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  exportCSV: () => {
    const { transactions } = get();
    if (!transactions.length) return;

    const headers = ['Symbol', 'Type', 'Quantity', 'Price', 'Amount', 'Date', 'PnL'];
    const rows = transactions.map(t => [
      t.symbol,
      t.type,
      t.quantity,
      t.price,
      t.totalAmount,
      new Date(t.createdAt).toLocaleString(),
      t.realizedPnL || 0
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "tradewise_transactions.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}));
