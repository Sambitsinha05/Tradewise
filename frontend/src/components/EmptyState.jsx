import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Search, Briefcase, Zap } from 'lucide-react';

const icons = {
  portfolio: <Briefcase size={40} className="text-primary/40" />,
  chart: <TrendingUp size={40} className="text-success/40" />,
  search: <Search size={40} className="text-amber-400/40" />,
  dashboard: <LayoutDashboard size={40} className="text-primary/40" />,
};

export const EmptyState = ({ 
  type = 'portfolio', 
  title = "No Data Found", 
  message = "Start exploring to see your analytics here.",
  actionText,
  onAction
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="relative mb-6">
        {/* Animated Background Rings */}
        <div className="absolute inset-0 m-auto w-24 h-24 bg-primary/5 rounded-full animate-ping" />
        <div className="absolute inset-0 m-auto w-16 h-16 bg-primary/10 rounded-full animate-pulse" />
        
        {/* Main Icon */}
        <div className="relative w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl">
          {icons[type] || icons.portfolio}
        </div>
      </div>

      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-sm text-textMuted font-medium max-w-[240px] leading-relaxed mb-6">
        {message}
      </p>

      {actionText && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest group"
        >
          <Zap size={14} className="group-hover:scale-110 transition-transform" />
          {actionText}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
