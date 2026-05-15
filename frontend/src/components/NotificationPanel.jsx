import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Trash2, Zap, TrendingUp, AlertTriangle, BarChart2, Info, ShieldAlert } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';

const TYPE_CONFIG = {
  TRADE_EXECUTED: { icon: <Zap size={14} />, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  PRICE_ALERT: { icon: <TrendingUp size={14} />, color: 'text-success', bg: 'bg-success/10 border-success/20' },
  PROFIT_MILESTONE: { icon: <TrendingUp size={14} />, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  RISK_WARNING: { icon: <ShieldAlert size={14} />, color: 'text-danger', bg: 'bg-danger/10 border-danger/20' },
  DIVERSIFICATION_ALERT: { icon: <BarChart2 size={14} />, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  SYSTEM: { icon: <Info size={14} />, color: 'text-textMuted', bg: 'bg-white/5 border-white/10' },
};

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const NotificationPanel = () => {
  const { notifications, unreadCount, isOpen, isLoading, closePanel, markAllRead, markOneRead, clearAll } = useNotificationStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={closePanel}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-16 right-4 z-50 w-96 max-h-[80vh] flex flex-col glass border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-primary" />
                <h3 className="font-black text-white text-sm uppercase tracking-widest">Alerts</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-black rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-textMuted hover:text-success transition-colors"
                    title="Mark all read"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-textMuted hover:text-danger transition-colors"
                    title="Clear all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button onClick={closePanel} className="p-1.5 rounded-lg hover:bg-white/10 text-textMuted hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                    <Bell size={28} className="text-textMuted opacity-40" />
                  </div>
                  <div>
                    <p className="font-black text-white text-sm">All clear</p>
                    <p className="text-[11px] text-textMuted mt-1">No alerts yet. Start trading to see activity.</p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => {
                  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM;
                  return (
                    <motion.div
                      key={notif._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => !notif.isRead && markOneRead(notif._id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all hover:bg-white/[0.03] ${config.bg} ${!notif.isRead ? 'ring-1 ring-white/10' : 'opacity-60'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${config.color} flex-shrink-0`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-xs font-black uppercase tracking-wide ${config.color}`}>{notif.title}</p>
                            {!notif.isRead && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />}
                          </div>
                          <p className="text-[11px] text-white/70 font-medium mt-1 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] text-textMuted mt-2">{timeAgo(notif.createdAt)}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Toast Stack ────────────────────────────────────────────────────────────

export const ToastStack = () => {
  const { toasts, dismissToast } = useNotificationStore();

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.SYSTEM;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`pointer-events-auto w-80 p-4 glass border rounded-2xl shadow-2xl ${config.bg}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${config.color}`}>{config.icon}</div>
                <div className="flex-1">
                  <p className={`text-xs font-black uppercase tracking-wide ${config.color}`}>{toast.title}</p>
                  <p className="text-[11px] text-white/80 font-medium mt-0.5">{toast.message}</p>
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="text-textMuted hover:text-white transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPanel;
