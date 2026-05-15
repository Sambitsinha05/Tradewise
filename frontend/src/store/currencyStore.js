import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './authStore';

export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      currency: 'USD',
      rates: {
        USD: 1,
        INR: 83.5,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 156.4
      },
      symbols: {
        USD: '$',
        INR: '₹',
        EUR: '€',
        GBP: '£',
        JPY: '¥'
      },
      isLoading: false,

      setCurrency: (currency) => set({ currency }),

      fetchRates: async () => {
        set({ isLoading: true });
        try {
          const res = await api.get('/market/currencies');
          set({ rates: res.data, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch rates:', error);
          set({ isLoading: false });
        }
      },

      convert: (amount, from = 'USD') => {
        const { currency, rates } = get();
        if (!rates[from]) return amount;
        // First convert to USD if from is not USD
        const usdAmount = from === 'USD' ? amount : amount / rates[from];
        // Then convert to target currency
        return usdAmount * rates[currency];
      },

      // Formats in user's selected currency
      format: (amount, from = 'USD') => {
        const { currency } = get();
        const converted = get().convert(amount, from);
        
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(converted);
      },

      // Formats in the asset's original currency (usually USD for this app)
      formatNative: (amount, nativeCurrency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: nativeCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      },

      // Returns both for premium UI
      formatDual: (amount, from = 'USD') => {
        const { currency } = get();
        const native = get().formatNative(amount, from);
        const converted = get().format(amount, from);
        
        return {
          native,
          converted,
          isConverted: currency !== from
        };
      },

      getSymbol: () => {
        const { currency, symbols } = get();
        return symbols[currency];
      }
    }),
    {
      name: 'tradewise-currency-storage',
      partialize: (state) => ({ currency: state.currency }),
    }
  )
);
