import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ShieldCheck, Zap, X } from 'lucide-react';
import { useOnboardingStore } from '../store/onboardingStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../store/authStore';
import { toast } from 'react-toastify';

const OnboardingModal = () => {
  const { isWelcomeOpen, setWelcomeOpen, startTour } = useOnboardingStore();
  const { updateOnboarding, user } = useAuthStore();

  if (!isWelcomeOpen) return null;

  const handleSkip = async () => {
    console.log('[Onboarding] User skipped onboarding modal');
    setWelcomeOpen(false);
    // Persist to backend and local
    await updateOnboarding(true);
    localStorage.setItem('tradewise_onboarding_completed', 'true');
  };

  const handleStartTour = () => {
    console.log('[Onboarding] User starting tour from modal');
    setWelcomeOpen(false);
    startTour();
  };

  const handleLoadDemo = async () => {
    try {
      console.log('[Onboarding] Initializing demo environment...');
      await api.post('/demo/setup');
      toast.success('Professional demo portfolio loaded successfully!');
      setWelcomeOpen(false);
      startTour();
    } catch (error) {
      console.error('Demo setup failed:', error);
      toast.error('Failed to load demo portfolio.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleSkip}
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
        >
          {/* Glowing background effect */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[100px]" />

          <button 
            onClick={handleSkip}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl mb-6">
              <Rocket className="text-blue-500" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome to TradeWise, {user?.name.split(' ')[0]}!</h2>
            <p className="text-slate-400">The next-generation terminal for professional trading and portfolio intelligence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <ShieldCheck className="text-green-500" size={20} />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Secure Execution</h4>
                  <p className="text-xs text-slate-400">Institutional-grade order execution with slippage simulation.</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Zap className="text-purple-500" size={20} />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">AI Intelligence</h4>
                  <p className="text-xs text-slate-400">Real-time risk metrics and behavioral analytics on every trade.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleLoadDemo}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              Start Guided Tour & Load Demo Portfolio
            </button>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleStartTour}
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                Quick Tour Only
              </button>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                Skip Onboarding
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
