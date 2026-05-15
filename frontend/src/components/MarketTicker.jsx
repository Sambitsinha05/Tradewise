import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useSocketStore } from '../store/socketStore';

const MarketTicker = () => {
  const { liveStockData } = useSocketStore();

  // Mock major indices if live data isn't available for them yet
  const indices = [
    { symbol: 'S&P 500', value: '4,783.45', change: '+1.24%', up: true },
    { symbol: 'NASDAQ', value: '15,011.35', change: '-0.38%', up: false },
    { symbol: 'DOW J', value: '37,689.50', change: '+0.45%', up: true },
    { symbol: 'BTC/USD', value: '64,231.10', change: '+3.12%', up: true },
    { symbol: 'ETH/USD', value: '3,452.15', change: '+2.45%', up: true },
    { symbol: 'GOLD', value: '2,156.40', change: '-0.15%', up: false },
  ];

  return (
    <div className="w-full bg-surface/40 backdrop-blur-sm border-b border-white/5 py-2 overflow-hidden whitespace-nowrap">
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="flex gap-12 items-center"
      >
        {/* Double the list for seamless loop */}
        {[...indices, ...indices].map((index, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[10px] font-black text-textMuted uppercase tracking-widest">{index.symbol}</span>
            <span className="text-xs font-black text-white">{index.value}</span>
            <span className={`text-[10px] font-black flex items-center gap-1 ${index.up ? 'text-success' : 'text-danger'}`}>
              {index.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {index.change}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default MarketTicker;
