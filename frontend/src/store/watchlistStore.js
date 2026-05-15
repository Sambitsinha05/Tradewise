import { create } from 'zustand';
import { api } from './authStore';
import { toast } from 'react-toastify';

export const useWatchlistStore = create((set, get) => ({
  watchlist: null,
  alerts: [], // Store active alerts
  isLoading: false,
  isActionLoading: false,

  fetchWatchlist: async () => {
    set({ isLoading: true });
    try {
      const [watchRes, alertRes] = await Promise.all([
        api.get('/watchlist'),
        api.get('/alerts')
      ]);
      set({ 
        watchlist: watchRes.data, 
        alerts: alertRes.data 
      });
    } catch (error) {
      console.error('Failed to sync watchlist/alerts', error);
      toast.error('Could not sync watchlist data');
    } finally {
      set({ isLoading: false });
    }
  },

  addAsset: async (symbol) => {
    set({ isActionLoading: true });
    try {
      await api.post('/watchlist/add', { symbol: symbol.toUpperCase() });
      await get().fetchWatchlist();
      toast.success(`${symbol.toUpperCase()} added to watchlist`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add asset';
      toast.error(message);
    } finally {
      set({ isActionLoading: false });
    }
  },

  removeAsset: async (symbol) => {
    set({ isActionLoading: true });
    try {
      await api.post('/watchlist/remove', { symbol: symbol.toUpperCase() });
      await get().fetchWatchlist();
      toast.info(`${symbol.toUpperCase()} removed`);
    } catch (error) {
      toast.error('Failed to remove asset');
    } finally {
      set({ isActionLoading: false });
    }
  },

  // Toggle or Create Alert
  toggleAlert: async (symbol, currentPrice) => {
    const existingAlert = get().alerts.find(a => a.symbol === symbol.toUpperCase());
    
    // Optimistic Update
    const previousAlerts = get().alerts;
    if (existingAlert) {
      set({
        alerts: previousAlerts.map(a => 
          a.symbol === symbol.toUpperCase() ? { ...a, enabled: !a.enabled } : a
        )
      });
    } else {
      set({
        alerts: [...previousAlerts, { symbol: symbol.toUpperCase(), enabled: true, isOptimistic: true }]
      });
    }

    try {
      const res = await api.post('/alerts', {
        symbol: symbol.toUpperCase(),
        targetPrice: currentPrice * 1.05, // Default 5% above
        condition: '>',
        alertType: 'PRICE_ABOVE'
      });

      // Update with real data from server
      set({
        alerts: get().alerts.map(a => 
          a.symbol === symbol.toUpperCase() ? res.data : a
        )
      });

      toast.success(`Alert ${res.data.enabled ? 'Enabled' : 'Disabled'} for ${symbol.toUpperCase()}`);
    } catch (error) {
      // Rollback on failure
      set({ alerts: previousAlerts });
      const message = error.response?.data?.message || 'Network error';
      toast.error(`Failed to update alerts: ${message}`);
    }
  }
}));
