import { create } from 'zustand';
import { api } from './authStore';

export const useMarketStore = create((set, get) => ({
  selectedSymbol: 'AAPL',
  selectedStockData: null,
  chartData: [],
  chartMode: 'intraday', // 'intraday' | '1W' | '1M' | '3M' | '1Y'
  isLoading: false,
  error: null,

  setChartMode: async (mode) => {
    set({ chartMode: mode });
    const { selectedSymbol } = get();
    if (selectedSymbol) await get()._fetchChartData(selectedSymbol, mode);
  },

  selectStock: async (symbol) => {
    const cleanSymbol = symbol.toUpperCase();
    set({ selectedSymbol: cleanSymbol, isLoading: true, error: null, chartData: [] });

    try {
      const [quoteRes] = await Promise.all([
        api.get(`/market/stock/${cleanSymbol}`),
      ]);
      set({ selectedStockData: quoteRes.data });
      await get()._fetchChartData(cleanSymbol, get().chartMode);
    } catch (err) {
      console.error('Error selecting stock:', err);
      set({ error: err.response?.data?.message || 'Failed to load stock data', isLoading: false });
    }
  },

  _fetchChartData: async (symbol, mode) => {
    set({ isLoading: true });
    try {
      let data;
      if (mode === 'intraday') {
        const res = await api.get(`/market/intraday/${symbol}?points=120`); // 2h of minute bars
        data = res.data.map(d => ({
          time: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: d.price,
          volume: d.volume,
        }));
      } else {
        const daysMap = { '1W': 7, '1M': 30, '3M': 90, '1Y': 252 };
        const days = daysMap[mode] || 30;
        const res = await api.get(`/market/history/${symbol}?days=${days}`);
        data = res.data.map(d => ({
          time: d.date,
          price: d.close,
          sma20: d.sma20,
          sma50: d.sma50,
          volume: d.volume,
        }));
      }
      set({ chartData: data, isLoading: false });
    } catch (err) {
      console.error('Chart fetch error:', err);
      set({ isLoading: false });
    }
  },

  updateLivePrice: (update) => {
    const { selectedStockData, chartData, selectedSymbol } = get();
    if (selectedStockData && update.symbol === selectedSymbol) {
      const newPoint = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: update.currentPrice,
        volume: Math.floor(Math.random() * 50000) + 5000,
      };
      set({
        selectedStockData: { ...selectedStockData, ...update },
        chartData: [...chartData, newPoint].slice(-120),
      });
    }
  },
}));
