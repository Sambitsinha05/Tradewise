import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  const { login, isAuthenticated, error, clearError, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    return () => clearError();
  }, [isAuthenticated, navigate, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled in the store
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-[#0a0f1d] p-16 flex-col justify-between border-r border-white/5 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-success/10 blur-[100px]" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20" 
                style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
        </div>

        <div className="relative z-10">
          <motion.div 
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3 text-primary font-black text-3xl tracking-tighter uppercase"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
              <TrendingUp size={28} />
            </div>
            <span>TradeWise</span>
          </motion.div>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <h1 className="text-6xl font-black mt-20 mb-8 text-white leading-[1.1] tracking-tighter uppercase">
              The Alpha <br /> Terminal <span className="text-primary">.</span>
            </h1>
            <p className="text-textMuted text-xl max-w-md font-medium leading-relaxed">
              Master the markets with risk-free paper trading, institutional-grade analytics, and behavioral insights.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10">
          <div className="flex gap-8 items-center mb-12">
            {[
              { label: 'Users', val: '50k+' },
              { label: 'Trades', val: '2.4M' },
              { label: 'Accuracy', val: '99.9%' }
            ].map(s => (
              <div key={s.label}>
                <p className="text-white font-black text-xl tracking-tighter">{s.val}</p>
                <p className="text-[10px] text-textMuted font-black uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-textMuted font-black uppercase tracking-[0.3em]">
            © 2026 TradeWise Intel Corp.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-[#050810] relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none" 
             style={{backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(59,130,246,0.15) 0%, transparent 50%)'}}></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md glass p-10 rounded-[40px] border border-white/10 shadow-2xl relative z-10"
        >
          <div className="text-center mb-12">
            <div className="md:hidden flex items-center justify-center gap-2 text-primary font-black text-2xl mb-8 tracking-tighter uppercase">
               <TrendingUp size={24} /> TradeWise
            </div>
            <h2 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">Terminal Login</h2>
            <p className="text-textMuted font-bold text-xs uppercase tracking-widest">Identify yourself to access the grid</p>
          </div>

          {error && (
            <motion.div 
              initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="mb-8 p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs font-black uppercase tracking-widest text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-textMuted uppercase tracking-[0.2em] ml-1">Secure Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] text-white font-bold transition-all placeholder:text-white/10"
                  placeholder="name@agency.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="block text-[10px] font-black text-textMuted uppercase tracking-[0.2em]">Passkey</label>
                <a href="#" className="text-[10px] font-black text-primary hover:text-primaryHover uppercase tracking-widest transition-colors">Reset Access</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] text-white font-bold transition-all placeholder:text-white/10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-5 px-6 bg-primary hover:bg-primaryHover text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all disabled:opacity-50 shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Initialize Session <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-textMuted text-xs font-bold uppercase tracking-widest">
            New Operator?{' '}
            <Link to="/register" className="text-primary hover:text-primaryHover transition-colors border-b border-primary/20 pb-0.5">
              Request Access
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
