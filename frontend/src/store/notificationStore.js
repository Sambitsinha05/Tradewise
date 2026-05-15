import { create } from 'zustand';
import { api } from './authStore';

const ICONS = {
  TRADE_EXECUTED: '⚡',
  PRICE_ALERT: '📈',
  PROFIT_MILESTONE: '🏆',
  RISK_WARNING: '⚠️',
  DIVERSIFICATION_ALERT: '📊',
  SYSTEM: 'ℹ️',
};

const COLORS = {
  TRADE_EXECUTED: 'primary',
  PRICE_ALERT: 'success',
  PROFIT_MILESTONE: 'yellow-400',
  RISK_WARNING: 'danger',
  DIVERSIFICATION_ALERT: 'primary',
  SYSTEM: 'textMuted',
};

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,

  // Live toast queue (client-side only, ephemeral)
  toasts: [],

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      set({ notifications: notifRes.data, unreadCount: countRes.data.count, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  },

  markOneRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set(state => ({
        notifications: state.notifications.map(n =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  },

  clearAll: async () => {
    try {
      await api.delete('/notifications');
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  },

  togglePanel: () => set(state => ({ isOpen: !state.isOpen })),
  closePanel: () => set({ isOpen: false }),

  // Client-side ephemeral toast (for immediate feedback)
  addToast: (type, title, message) => {
    const id = Date.now();
    set(state => ({
      toasts: [...state.toasts, { id, type, title, message, icon: ICONS[type], color: COLORS[type] }]
    }));
    // Auto-dismiss after 4s
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },

  dismissToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  getIcon: (type) => ICONS[type] || 'ℹ️',
  getColor: (type) => COLORS[type] || 'textMuted',
}));
