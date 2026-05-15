import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, api } from '../store/authStore';
import { 
  LayoutDashboard, 
  Briefcase, 
  Activity, 
  BookOpen, 
  Calculator, 
  LogOut, 
  Bell, 
  Menu,
  X,
  Search,
  Play,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import MarketTicker from './MarketTicker';
import CurrencySelector from './CurrencySelector';
import { useCurrencyStore } from '../store/currencyStore';
import { useNotificationStore } from '../store/notificationStore';
import { NotificationPanel, ToastStack } from './NotificationPanel';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const { format } = useCurrencyStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount, togglePanel, fetchNotifications } = useNotificationStore();


  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const handleGlobalSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setShowResults(true);
  };

  // Debounced search — fires 300ms after user stops typing
  useEffect(() => {
    if (searchQuery.length < 2) return;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/market/search?query=${searchQuery}`);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('Global search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Markets', path: '/markets', icon: <Activity size={20} /> },
    { name: 'Portfolio', path: '/portfolio', icon: <Briefcase size={20} /> },
    { name: 'Deep Analytics', path: '/analytics', icon: <Activity size={20} /> },
    { name: 'Watchlist', path: '/watchlist', icon: <Activity size={20} /> },
    { name: 'Trading Journal', path: '/journal', icon: <BookOpen size={20} /> },
    { name: 'Simulator', path: '/simulator', icon: <Calculator size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-white/5">
        <div className="p-6 flex items-center gap-2 text-primary font-bold text-xl border-b border-white/5">
          <Activity size={24} />
          <span>TradeWise</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-textMuted hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-textMuted truncate">Virtual: {format(user?.virtualBalance || 0)}</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-surface/50 backdrop-blur-md border-b border-white/5 z-10">
          <div className="flex items-center md:hidden">
            <Activity size={24} className="text-primary" />
            <span className="ml-2 text-primary font-black tracking-tighter text-lg">TradeWise</span>
          </div>

          {/* Global Search Bar - Top Center */}
          <div className="hidden md:flex flex-1 justify-center max-w-2xl px-8 relative" ref={searchRef}>
            <div className="w-full group relative">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:bg-white/10 focus-within:border-primary/50 transition-all shadow-lg">
                <Search size={18} className="text-textMuted group-focus-within:text-primary mr-3" />
                <input 
                  type="text"
                  placeholder="Instant Search: AAPL, TSLA, NVDA..."
                  className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-textMuted/40 font-medium"
                  value={searchQuery}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                />
                <div className="flex items-center gap-2 ml-2 border-l border-white/10 pl-2">
                  {['AAPL', 'TSLA', 'NVDA'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => navigate(`/markets/${s}`)}
                      className="text-[10px] font-bold text-textMuted hover:text-primary transition-colors px-1.5 py-0.5 rounded bg-white/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Global Search Results Dropdown */}
              <AnimatePresence>
                {showResults && (searchResults.length > 0 || isSearching) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 glass border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden max-h-[400px]"
                  >
                    {isSearching ? (
                      <div className="p-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-primary mr-3"></div>
                        <span className="text-xs text-textMuted">Searching markets...</span>
                      </div>
                    ) : (
                      <div className="p-2">
                        {searchResults.map((stock) => (
                          <button
                            key={stock.symbol}
                            onClick={() => {
                              navigate(`/markets/${stock.symbol}`);
                              setShowResults(false);
                              setSearchQuery('');
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                {stock.symbol[0]}
                              </div>
                              <div>
                                <span className="font-bold text-white text-sm block group-hover:text-primary transition-colors">{stock.symbol}</span>
                                <span className="text-[10px] text-textMuted line-clamp-1">{stock.description}</span>
                              </div>
                            </div>
                            <div className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-textMuted uppercase font-bold">
                              {stock.type || 'Stock'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/markets')}
              className="trade-action-btn hidden lg:flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl border border-primary/20 transition-all font-bold text-xs"
            >
              <Zap size={14} />
              Quick Trade
            </button>
            <CurrencySelector />
            <button
              onClick={togglePanel}
              className="relative text-textMuted hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-primary/40"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </button>
          </div>

          {/* Notification Panel (portal-like fixed position) */}
          <NotificationPanel />
        </header>

        <MarketTicker />

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Global Toast Stack */}
        <ToastStack />

      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 pb-safe z-50">
        <div className="flex items-center justify-around p-2">
          {[
            { name: 'Home', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Markets', path: '/markets', icon: <Activity size={20} /> },
            { name: 'Portfolio', path: '/portfolio', icon: <Briefcase size={20} /> },
            { name: 'Watchlist', path: '/watchlist', icon: <Search size={20} /> },
          ].map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                  isActive ? 'text-primary' : 'text-textMuted hover:text-white'
                }`}
              >
                <div className={`mb-1 transition-transform ${isActive ? '-translate-y-1' : ''}`}>
                  {item.icon}
                </div>
                {isActive && (
                  <span className="text-[9px] font-black uppercase tracking-widest absolute bottom-2">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
