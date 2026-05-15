import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail, User, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  const { register, isAuthenticated, error, clearError, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    return () => clearError();
  }, [isAuthenticated, navigate, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
    } catch (err) {
      // Error handled in store
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row-reverse">
      {/* Right side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-[#0a0f1d] p-16 flex-col justify-between border-l border-white/5 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
           <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-success/10 blur-[100px]" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20" 
                style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
        </div>

        <div className="relative z-10 flex justify-end">
          <motion.div 
            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3 text-primary font-black text-3xl tracking-tighter uppercase"
          >
            <span>TradeWise</span>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
              <TrendingUp size={28} />
            </div>
          </motion.div>
        </div>
        
        <div className="relative z-10 text-right">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <h1 className="text-6xl font-black mt-20 mb-8 text-white leading-[1.1] tracking-tighter uppercase">
              Join the <br /> Collective <span className="text-primary">.</span>
            </h1>
            <p className="text-textMuted text-xl max-w-md ml-auto font-medium leading-relaxed">
              Get $100,000 in virtual capital instantly. Track habits, simulate growth, and master the markets.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 text-right">
          <div className="flex gap-8 items-center justify-end mb-12">
            {[
              { label: 'Latency', val: '< 50ms' },
              { label: 'Insights', val: 'Real-time' },
              { label: 'Security', val: 'AES-256' }
            ].map(s => (
              <div key={s.label} className="text-right">
                <p className="text-white font-black text-xl tracking-tighter">{s.val}</p>
                <p className="text-[10px] text-textMuted font-black uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-textMuted font-black uppercase tracking-[0.3em]">
            Institutional Grade Simulator v2.4
          </p>
        </div>
      </div>

      {/* Left side - Register Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-[#050810] relative">
        <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none" 
             style={{backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(16,185,129,0.1) 0%, transparent 50%)'}}></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md glass p-10 rounded-[40px] border border-white/10 shadow-2xl relative z-10"
        >
          <div className="text-center mb-10">
            <div className="md:hidden flex items-center justify-center gap-2 text-primary font-black text-2xl mb-8 tracking-tighter uppercase">
               <TrendingUp size={24} /> TradeWise
            </div>
            <h2 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">Create Account</h2>
            <p className="text-textMuted font-bold text-xs uppercase tracking-widest">Register your credentials on the network</p>
          </div>

          {error && (
            <motion.div 
              initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="mb-8 p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs font-black uppercase tracking-widest text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-textMuted uppercase tracking-[0.2em] ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted group-focus-within:text-primary transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] text-white font-bold transition-all placeholder:text-white/10"
                  placeholder="Operational Handle"
                />
              </div>
            </div>

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
              <label className="block text-[10px] font-black text-textMuted uppercase tracking-[0.2em] ml-1">Secure Passkey</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] text-white font-bold transition-all placeholder:text-white/10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-5 px-6 bg-primary hover:bg-primaryHover text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all mt-4 disabled:opacity-50 shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Deploy Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-textMuted text-xs font-bold uppercase tracking-widest">
            Already registered?{' '}
            <Link to="/login" className="text-primary hover:text-primaryHover transition-colors border-b border-primary/20 pb-0.5">
              Access Terminal
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
