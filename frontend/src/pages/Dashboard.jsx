import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Briefcase,
  Activity,
  Award,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { api, useAuthStore } from '../store/authStore';
import { usePortfolioStore } from '../store/portfolioStore';
import { useSocketStore } from '../store/socketStore';
import { useCurrencyStore } from '../store/currencyStore';
import WelcomeModal from '../components/WelcomeModal';
import { DashboardSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { holdings, fetchPortfolio, valuation, fetchValuation, transactions } = usePortfolioStore();
  const { liveStockData } = useSocketStore();
  const { format, formatNative, formatDual, currency } = useCurrencyStore();
  
  const [analytics, setAnalytics] = useState(null);
  const [news, setNews] = useState([]);
  const [history, setHistory] = useState([]);
  const [timeframe, setTimeframe] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    fetchValuation();
  }, [fetchValuation]);

  useEffect(() => {
    if (!isLoading && holdings.length === 0) {
      setShowWelcome(true);
    }
  }, [isLoading, holdings.length]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, newsRes, historyRes] = await Promise.all([
          api.get('/portfolio/analytics'),
          api.get('/market/trending'),
          api.get(`/portfolio/history?timeframe=${timeframe}`),
          fetchPortfolio()
        ]);
        setAnalytics(analyticsRes.data);
        setNews(newsRes.data);
        setHistory(historyRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe, fetchPortfolio]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Calculate real-time net worth and performers
  const portfolioMetrics = holdings.reduce((acc, h) => {
    const livePrice = liveStockData[h.symbol]?.currentPrice || h.averageCost;
    const prevClose = liveStockData[h.symbol]?.previousClose || h.averageCost;
    const value = h.quantity * livePrice;
    const cost = h.quantity * h.averageCost;
    const todayChange = (livePrice - prevClose) * h.quantity;

    acc.totalValue += value;
    acc.totalCost += cost;
    acc.todayPnL += todayChange;

    const returnPercent = ((livePrice - h.averageCost) / h.averageCost) * 100;
    if (!acc.best || returnPercent > acc.best.return) {
      acc.best = { symbol: h.symbol, return: returnPercent };
    }
    if (!acc.worst || returnPercent < acc.worst.return) {
      acc.worst = { symbol: h.symbol, return: returnPercent };
    }

    return acc;
  }, { totalValue: 0, totalCost: 0, todayPnL: 0, best: null, worst: null });

  // Add today's realized PnL to Today's P/L metric
  const todayRealizedPnL = transactions
    .filter(t => t.type === 'SELL' && new Date(t.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
  
  const finalTodayPnL = portfolioMetrics.todayPnL + todayRealizedPnL;

  const purchasingPower = user?.virtualBalance || 0;
  const netWorth = portfolioMetrics.totalValue + purchasingPower;

  const healthScore = analytics?.healthScore || 100;
  
  const overviewCards = [
    {
      title: 'Net Worth',
      value: formatDual(netWorth).converted,
      icon: <Briefcase className="text-primary" size={24} />,
      subtitle: 'Live Asset Valuation',
    },
    {
      title: "Today's P&L",
      value: `${finalTodayPnL >= 0 ? '+' : ''}${format(finalTodayPnL)}`,
      icon: <Activity className={finalTodayPnL >= 0 ? 'text-success' : 'text-danger'} size={24} />,
      subtitle: currency !== 'USD' ? `≈ ${formatNative(finalTodayPnL)}` : 'Current Session Performance',
    },
    {
      title: 'Total Return',
      value: `${(valuation?.totalPnL || 0) >= 0 ? '+' : ''}${format(valuation?.totalPnL || 0)}`,
      icon: <TrendingUp className={(valuation?.totalPnL || 0) >= 0 ? 'text-success' : 'text-danger'} size={24} />,
      subtitle: `${((valuation?.totalPnL || 0) / (valuation?.totalCostBasis || 1) * 100).toFixed(2)}% All-time`,
    },
    {
      title: 'Portfolio Health',
      value: `${healthScore}/100`,
      icon: <ShieldCheck className={healthScore > 70 ? 'text-success' : 'text-danger'} size={24} />,
      subtitle: analytics?.riskCategory ? `${analytics.riskCategory} Risk Profile` : 'Healthy Condition',
    },
    {
      title: 'Best Performer',
      value: portfolioMetrics.best ? portfolioMetrics.best.symbol : 'N/A',
      icon: <TrendingUp className="text-success" size={24} />,
      subtitle: portfolioMetrics.best ? `${portfolioMetrics.best.return.toFixed(2)}% Return` : 'No holdings yet',
    },
    {
      title: 'Worst Performer',
      value: portfolioMetrics.worst ? portfolioMetrics.worst.symbol : 'N/A',
      icon: <TrendingDown className="text-danger" size={24} />,
      subtitle: portfolioMetrics.worst ? `${portfolioMetrics.worst.return.toFixed(2)}% Return` : 'No holdings yet',
    },
    {
      title: 'Realized Gains',
      value: format(valuation?.realizedPnL || 0),
      icon: <Award className="text-yellow-400" size={24} />,
      subtitle: 'Booked Profit & Loss',
    },
    {
      title: 'Available Cash',
      value: format(user?.virtualBalance || 0),
      icon: <DollarSign className="text-primary" size={24} />,
      subtitle: 'Buying Power',
    }
  ];


  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="space-y-8 pb-8">
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-textMuted">Here's what's happening with your investments today.</p>
        </div>
        {holdings.length === 0 && (
          <button
            onClick={async () => {
              try {
                await api.post('/demo/setup');
                window.location.reload();
              } catch (e) {
                console.error(e);
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20"
          >
            <Zap size={18} />
            Initialize Demo Portfolio
          </button>
        )}
      </div>

      {/* Overview Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {overviewCards.map((card, idx) => (
          <motion.div 
            key={idx}
            variants={itemVariants}
            className={`glass p-6 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-all hover-scale glow-card`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {card.icon}
              </div>
            </div>
            <div>
              <p className="text-textMuted text-sm font-medium mb-1">{card.title}</p>
              <h3 className="text-3xl font-bold text-white mb-2 tracking-tighter">{card.value}</h3>
              <p className="text-xs text-textMuted">{card.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Grid for Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Portfolio Growth */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass rounded-2xl p-6 flex flex-col h-[400px]"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Portfolio Growth</h2>
            <div className="flex gap-2">
              <button onClick={() => setTimeframe('1M')} className={`px-3 py-1 rounded text-xs transition-colors ${timeframe === '1M' ? 'bg-primary text-white' : 'bg-white/10 text-textMuted hover:bg-white/20'}`}>1M</button>
              <button onClick={() => setTimeframe('1Y')} className={`px-3 py-1 rounded text-xs transition-colors ${timeframe === '1Y' ? 'bg-primary text-white' : 'bg-white/10 text-textMuted hover:bg-white/20'}`}>1Y</button>
              <button onClick={() => setTimeframe('all')} className={`px-3 py-1 rounded text-xs transition-colors ${timeframe === 'all' ? 'bg-primary text-white' : 'bg-white/10 text-textMuted hover:bg-white/20'}`}>ALL</button>
            </div>
          </div>
          
          <div className="flex-1 w-full">
            {history && history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    minTickGap={30}
                    tick={{ fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tickFormatter={(tick) => format(tick).split('.')[0]}
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    formatter={(value) => [format(value), 'Total Value']}
                  />
                  <Area type="monotone" dataKey="totalValue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState 
                type="chart" 
                title="Historical Data Pending" 
                message="We're tracking your portfolio. Check back tomorrow for your first growth data point." 
              />
            )}
          </div>
        </motion.div>

        {/* Right Column: Market News Widget */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 h-[400px] flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Market News</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {news && news.length > 0 ? (
              news.slice(0, 8).map((item) => (
                <a 
                  key={item.id} 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group"
                >
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">{item.source}</p>
                  <h4 className="text-sm text-white font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors">{item.headline}</h4>
                  <p className="text-xs text-textMuted line-clamp-2 leading-relaxed">{item.summary}</p>
                </a>
              ))
            ) : (
              <EmptyState 
                type="news" 
                title="News Offline" 
                message="Connecting to market news terminals... Check your connection." 
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
