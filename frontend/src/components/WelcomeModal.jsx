import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Zap, Compass, X } from 'lucide-react';
import { usePortfolioStore } from '../store/portfolioStore';
import { useState } from 'react';

const WelcomeModal = ({ isOpen, onClose }) => {
  const { setupDemo, isLoading } = usePortfolioStore();
  const [isSettingUp, setIsSettingUp] = useState(false);

  const handleSetupDemo = async () => {
    setIsSettingUp(true);
    await setupDemo();
    setIsSettingUp(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass w-full max-w-2xl rounded-[32px] border border-white/10 shadow-2xl relative z-10 overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/20 rounded-full blur-[100px]" />

            <div className="p-10 text-center space-y-8 relative">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-textMuted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-20 h-20 bg-primary/20 rounded-3xl mx-auto flex items-center justify-center border border-primary/30 shadow-[0_0_40px_rgba(59,130,246,0.3)]">
                <Briefcase size={40} className="text-primary" />
              </div>

              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Welcome to TradeWise</h2>
                <p className="text-textMuted font-medium max-w-md mx-auto leading-relaxed">
                  The institutional-grade fintech platform. To get started quickly, we can populate your account with a realistic demo portfolio, historical transactions, and quantitative analytics.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left mt-8">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3">
                  <div className="mt-1">
                    <Zap size={16} className="text-success" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Instant Data</h4>
                    <p className="text-[10px] text-textMuted mt-1">Blue-chip assets, transactions, and live charts instantly loaded.</p>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3">
                  <div className="mt-1">
                    <Compass size={16} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Explore Features</h4>
                    <p className="text-[10px] text-textMuted mt-1">Test the simulator, journal, and deep analytics without risk.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-white/10">
                <button 
                  onClick={onClose}
                  className="px-8 py-3 rounded-2xl border border-white/10 hover:bg-white/5 font-black text-white text-xs tracking-widest uppercase transition-all"
                >
                  Start Fresh
                </button>
                <button 
                  onClick={handleSetupDemo}
                  disabled={isSettingUp || isLoading}
                  className="px-8 py-3 rounded-2xl bg-primary hover:bg-primaryHover text-white font-black text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center gap-2 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {(isSettingUp || isLoading) ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Loading Data...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap size={16} /> Load Demo Portfolio
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
