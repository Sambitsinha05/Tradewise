import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Smile, 
  Frown, 
  Target, 
  ShieldAlert,
  Search,
  Filter,
  PlusCircle,
  BrainCircuit,
  PieChart as PieIcon,
  MessageSquare
} from 'lucide-react';
import { api } from '../store/authStore';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

import { useCurrencyStore } from '../store/currencyStore';
import { JournalSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const Journal = () => {
  const { format, formatNative } = useCurrencyStore();
  const [entries, setEntries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('entries'); // entries, insights

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [entriesRes, analyticsRes] = await Promise.all([
        api.get('/journal'),
        api.get('/journal/analytics')
      ]);
      setEntries(entriesRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching journal data', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <JournalSkeleton />;
  }

  const emotionData = analytics ? Object.keys(analytics.emotionPerformance).map(key => ({
    name: key,
    value: Math.abs(analytics.emotionPerformance[key].totalPnL),
    trades: analytics.emotionPerformance[key].tradeCount
  })) : [];

  const strategyData = analytics ? Object.keys(analytics.strategyPerformance).map(key => ({
    name: key,
    value: Math.abs(analytics.strategyPerformance[key].totalPnL)
  })) : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-1">
            {label || payload[0].name}
          </p>
          <p className="text-white font-black text-lg">
            {format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black rounded uppercase tracking-widest">Unique Feature</span>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Trading Journal</h1>
          </div>
          <p className="text-textMuted font-medium">Connect your emotions and strategies to your P&L for behavioral excellence.</p>
        </div>

        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-tighter ${
              activeTab === 'entries' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-textMuted hover:text-white'
            }`}
          >
            <BookOpen size={16} /> Entries
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-tighter ${
              activeTab === 'insights' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-textMuted hover:text-white'
            }`}
          >
            <BrainCircuit size={16} /> Behavioral Insights
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'entries' ? (
          <motion.div 
            key="entries" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {entries.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {entries.map((entry) => (
                  <div key={entry._id} className="glass p-6 rounded-[32px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Left: Trade Info */}
                      <div className="lg:w-48 flex-shrink-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-tighter ${
                            entry.tradeType === 'BUY' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                          }`}>
                            {entry.tradeType}
                          </span>
                          <span className="text-white font-black text-xl tracking-tighter">{entry.symbol}</span>
                        </div>
                        <div className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-4">
                          {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-white">
                            <Target size={14} className="text-primary" />
                            {entry.strategy}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-white">
                            {entry.emotionalState === 'CONFIDENT' ? <Smile size={14} className="text-success" /> : 
                             entry.emotionalState === 'ANXIOUS' ? <Frown size={14} className="text-danger" /> :
                             <Activity size={14} className="text-primary" />}
                            {entry.emotionalState}
                          </div>
                        </div>
                      </div>

                      {/* Right: Reasoning & Lessons */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h4 className="text-[10px] font-black text-textMuted uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <MessageSquare size={12} /> Reasoning
                          </h4>
                          <p className="text-sm text-white/80 leading-relaxed font-medium">
                            {entry.reasoning}
                          </p>
                        </div>

                        {(entry.mistakes?.length > 0 || entry.lessonsLearned) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            {entry.mistakes?.length > 0 && (
                              <div>
                                <h4 className="text-[10px] font-black text-danger uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                  <ShieldAlert size={12} /> Mistakes
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {entry.mistakes.map((m, i) => (
                                    <span key={i} className="px-2 py-1 bg-danger/10 text-danger text-[10px] font-bold rounded-lg border border-danger/10">
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {entry.lessonsLearned && (
                              <div>
                                <h4 className="text-[10px] font-black text-success uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                  <BookOpen size={12} /> Lessons
                                </h4>
                                <p className="text-[11px] text-white/60 italic font-medium">
                                  {entry.lessonsLearned}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                type="journal" 
                title="Silence is Golden" 
                message="Your trading journal is empty. Record your psychology after trades to uncover behavioral patterns." 
              />
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="insights" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Behavioral Summary */}
            <div className="glass p-8 rounded-[32px] border border-white/5 bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center text-primary shadow-2xl">
                  <BrainCircuit size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter mb-2">Quant Behavioral Analysis</h2>
                  <p className="text-textMuted font-medium text-lg leading-snug">
                    {analytics?.insights?.message}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Emotion Performance */}
              <div className="glass p-10 rounded-[40px] border border-white/5 bg-white/[0.01] h-[500px] flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <PieIcon className="text-primary" size={24} />
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">PnL Weighted Emotions</h3>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={emotionData} cx="50%" cy="50%" innerRadius={100} outerRadius={140} paddingAngle={8} dataKey="value" stroke="none">
                        {emotionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Strategy Performance */}
              <div className="glass p-10 rounded-[40px] border border-white/5 bg-white/[0.01] h-[500px] flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <Target className="text-success" size={24} />
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Strategy Effectiveness</h3>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={strategyData} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} fontWeight="bold" width={80} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                        {strategyData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Journal;
