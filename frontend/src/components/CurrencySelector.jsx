import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useCurrencyStore } from '../store/currencyStore';

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
];

const CurrencySelector = () => {
  const { currency, setCurrency, fetchRates } = useCurrencyStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const selectedCurrency = currencies.find(c => c.code === currency);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group"
      >
        <Globe size={14} className="text-primary group-hover:rotate-12 transition-transform" />
        <span className="text-[10px] font-black text-white uppercase tracking-widest">{currency}</span>
        <ChevronDown size={12} className={`text-textMuted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-2">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrency(c.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      currency === c.code 
                        ? 'bg-primary/20 text-white' 
                        : 'text-textMuted hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-black uppercase tracking-widest">{c.code}</span>
                      <span className="text-[8px] font-bold opacity-50 uppercase">{c.name}</span>
                    </div>
                    {currency === c.code ? (
                      <Check size={14} className="text-primary" />
                    ) : (
                      <span className="text-xs font-black opacity-30">{c.symbol}</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CurrencySelector;
