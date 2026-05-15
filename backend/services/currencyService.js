import axios from 'axios';

let cachedRates = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 156.4
};
let lastFetched = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const getExchangeRates = async () => {
  const now = Date.now();
  if (now - lastFetched < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    // Attempting to fetch from a public API if available, else fallback to hardcoded
    const response = await axios.get('https://open.er-api.com/v6/latest/USD');
    if (response.data && response.data.rates) {
      cachedRates = {
        USD: 1,
        INR: response.data.rates.INR,
        EUR: response.data.rates.EUR,
        GBP: response.data.rates.GBP,
        JPY: response.data.rates.JPY
      };
      lastFetched = now;
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates, using cached/fallback:', error.message);
  }

  return cachedRates;
};
