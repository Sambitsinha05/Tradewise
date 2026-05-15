import axios from 'axios';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// ─── Volatility Profiles (Geometric Brownian Motion) ─────────────────────────
// vol = daily sigma, bias = daily drift (positive = slight upward trend)
const VOLATILITY_PROFILES = {
  'AAPL': { vol: 0.012, bias: 0.0004, sector: 'Technology', exchange: 'NASDAQ' },
  'MSFT': { vol: 0.011, bias: 0.0005, sector: 'Technology', exchange: 'NASDAQ' },
  'GOOGL': { vol: 0.014, bias: 0.0004, sector: 'Technology', exchange: 'NASDAQ' },
  'AMZN': { vol: 0.016, bias: 0.0004, sector: 'Consumer Cyclical', exchange: 'NASDAQ' },
  'META': { vol: 0.018, bias: 0.0003, sector: 'Technology', exchange: 'NASDAQ' },
  'TSLA': { vol: 0.032, bias: 0.0006, sector: 'Consumer Cyclical', exchange: 'NASDAQ' },
  'NVDA': { vol: 0.038, bias: 0.0012, sector: 'Technology', exchange: 'NASDAQ' },
  'AMD': { vol: 0.030, bias: 0.0008, sector: 'Technology', exchange: 'NASDAQ' },
  'BTC': { vol: 0.045, bias: 0.0008, sector: 'Crypto', exchange: 'CRYPTO' },
  'ETH': { vol: 0.050, bias: 0.0007, sector: 'Crypto', exchange: 'CRYPTO' },
  'SPY': { vol: 0.007, bias: 0.0003, sector: 'ETF', exchange: 'NYSE' },
  'QQQ': { vol: 0.010, bias: 0.0004, sector: 'ETF', exchange: 'NASDAQ' },
  'JPM': { vol: 0.013, bias: 0.0003, sector: 'Financial Services', exchange: 'NYSE' },
  'BA':  { vol: 0.022, bias: -0.0002, sector: 'Industrials', exchange: 'NYSE' },
  'INTC': { vol: 0.020, bias: -0.0003, sector: 'Technology', exchange: 'NASDAQ' },
  'DEFAULT': { vol: 0.018, bias: 0.0004, sector: 'General', exchange: 'NYSE' }
};

// Realistic stable base prices per symbol (persist across sessions in memory)
const BASE_PRICES = {
  'AAPL': 189.50, 'MSFT': 415.20, 'GOOGL': 175.40, 'AMZN': 198.80,
  'META': 505.30, 'TSLA': 178.60, 'NVDA': 875.20, 'AMD': 168.40,
  'BTC': 67500.00, 'ETH': 3620.00, 'SPY': 532.10, 'QQQ': 457.80,
  'JPM': 205.60, 'BA': 168.30, 'INTC': 31.20
};

// In-memory price tracking for realistic continuity
const priceCache = {};

const isKeyValid = (key) => key && key !== 'your_alpha_vantage_api_key' && key !== 'your_finnhub_api_key';

/**
 * Box-Muller transform for Gaussian random variable (proper GBM)
 */
const gaussianRandom = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

/**
 * GBM-based price evolution
 * nextPrice = prevPrice * exp((drift - 0.5 * vol²) * dt + vol * sqrt(dt) * Z)
 */
const simulateNextPrice = (prevPrice, symbol, dt = 1/252) => {
  const profile = VOLATILITY_PROFILES[symbol.toUpperCase()] || VOLATILITY_PROFILES['DEFAULT'];
  const { bias: mu, vol: sigma } = profile;
  const Z = gaussianRandom();
  const logReturn = (mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * Z;
  const nextPrice = prevPrice * Math.exp(logReturn);
  // Clamp to ±8% daily max for UI sanity
  const maxChange = prevPrice * 0.08;
  return Math.min(prevPrice + maxChange, Math.max(prevPrice - maxChange, nextPrice));
};

/**
 * Get or initialize a symbol's current price from cache
 */
const getBasePrice = (symbol) => {
  const s = symbol.toUpperCase();
  if (!priceCache[s]) {
    priceCache[s] = BASE_PRICES[s] || (50 + (s.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 450));
  }
  return priceCache[s];
};

// ─── Public API ──────────────────────────────────────────────────────────────

export const getQuote = async (symbol) => {
  const apiKey = process.env.FINNHUB_API_KEY;
  const symbolUpper = symbol.toUpperCase().replace('MOCK_', '');

  if (!isKeyValid(apiKey)) {
    return _generateMockQuote(symbolUpper);
  }

  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
      params: { symbol: symbolUpper, token: apiKey },
      timeout: 5000
    });
    const data = response.data;
    if (!data || data.c === 0) return _generateMockQuote(symbolUpper);

    // Update cache with live price
    priceCache[symbolUpper] = data.c;

    return {
      symbol: symbolUpper,
      currentPrice: data.c,
      change: data.d ?? 0,
      percentChange: data.dp ?? 0,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      volume: Math.floor(Math.random() * 5000000) + 1000000,
      timestamp: new Date().toISOString(),
      isMock: false,
      sector: VOLATILITY_PROFILES[symbolUpper]?.sector || 'General',
      exchange: VOLATILITY_PROFILES[symbolUpper]?.exchange || 'NYSE',
    };
  } catch (error) {
    return _generateMockQuote(symbolUpper);
  }
};

const _generateMockQuote = (symbol) => {
  const prevPrice = getBasePrice(symbol);
  const currentPrice = simulateNextPrice(prevPrice, symbol);
  // Persist new price
  priceCache[symbol] = currentPrice;
  const change = currentPrice - prevPrice;

  return {
    symbol,
    currentPrice: +currentPrice.toFixed(2),
    change: +change.toFixed(2),
    percentChange: +((change / prevPrice) * 100).toFixed(2),
    high: +(currentPrice * 1.018).toFixed(2),
    low: +(currentPrice * 0.982).toFixed(2),
    open: +(prevPrice * 1.002).toFixed(2),
    previousClose: +prevPrice.toFixed(2),
    volume: Math.floor(Math.random() * 8000000) + 800000,
    timestamp: new Date().toISOString(),
    isMock: true,
    sector: VOLATILITY_PROFILES[symbol]?.sector || 'General',
    exchange: VOLATILITY_PROFILES[symbol]?.exchange || 'NYSE',
  };
};

/**
 * Generate realistic intraday data (390 one-minute bars = 6.5 hr trading day)
 */
export const getIntradayData = (symbol, points = 390) => {
  const symbolUpper = symbol.toUpperCase();
  const openPrice = getBasePrice(symbolUpper);
  const profile = VOLATILITY_PROFILES[symbolUpper] || VOLATILITY_PROFILES['DEFAULT'];
  const intradayVol = profile.vol * 0.3; // intraday vol ~30% of daily

  const data = [];
  let price = openPrice;
  // Market open: 9:30 AM EST today
  const marketOpen = new Date();
  marketOpen.setHours(9, 30, 0, 0);

  for (let i = 0; i < points; i++) {
    const Z = gaussianRandom();
    const dt = 1 / points;
    price = price * Math.exp((profile.bias * dt) + intradayVol * Math.sqrt(dt) * Z);
    price = Math.max(openPrice * 0.85, Math.min(openPrice * 1.15, price));

    const ts = new Date(marketOpen.getTime() + i * 60000);
    const baseVolume = Math.floor(Math.random() * 50000) + 10000;
    // Volume spikes at open and close
    const volumeMultiplier = (i < 30 || i > 360) ? 3 : 1;

    data.push({
      time: ts.toISOString(),
      price: +price.toFixed(2),
      open: +(price * 0.9998).toFixed(2),
      close: +price.toFixed(2),
      high: +(price * 1.0012).toFixed(2),
      low: +(price * 0.9988).toFixed(2),
      volume: baseVolume * volumeMultiplier,
    });
  }
  return data;
};

/**
 * Generate multi-day historical OHLCV data
 */
export const getHistoricalData = (symbol, days = 90) => {
  const symbolUpper = symbol.toUpperCase();
  const profile = VOLATILITY_PROFILES[symbolUpper] || VOLATILITY_PROFILES['DEFAULT'];

  let price = BASE_PRICES[symbolUpper] || 150;
  const data = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dayOpen = price;
    // Generate OHLC for the day (4 ticks inside the day)
    const intradayHigh = dayOpen * (1 + Math.abs(gaussianRandom()) * profile.vol * 0.5);
    const intradayLow = dayOpen * (1 - Math.abs(gaussianRandom()) * profile.vol * 0.5);
    price = simulateNextPrice(price, symbolUpper);
    const dayClose = price;

    // Compute SMA placeholders (filled in by frontend or calculated later)
    data.push({
      date: date.toISOString().split('T')[0],
      open: +dayOpen.toFixed(2),
      high: +Math.max(dayOpen, dayClose, intradayHigh).toFixed(2),
      low: +Math.min(dayOpen, dayClose, intradayLow).toFixed(2),
      close: +dayClose.toFixed(2),
      volume: Math.floor(Math.random() * 8000000) + 500000,
    });
  }

  // Compute 20-day and 50-day SMAs
  const closes = data.map(d => d.close);
  data.forEach((d, i) => {
    d.sma20 = i >= 19 ? +(closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20).toFixed(2) : null;
    d.sma50 = i >= 49 ? +(closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50).toFixed(2) : null;
  });

  return data;
};

export const searchStocks = async (query) => {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!isKeyValid(apiKey)) {
    const allStocks = [
      { symbol: 'AAPL', description: 'Apple Inc.', type: 'Common Stock' },
      { symbol: 'MSFT', description: 'Microsoft Corporation', type: 'Common Stock' },
      { symbol: 'GOOGL', description: 'Alphabet Inc.', type: 'Common Stock' },
      { symbol: 'AMZN', description: 'Amazon.com Inc.', type: 'Common Stock' },
      { symbol: 'META', description: 'Meta Platforms Inc.', type: 'Common Stock' },
      { symbol: 'TSLA', description: 'Tesla Inc.', type: 'Common Stock' },
      { symbol: 'NVDA', description: 'NVIDIA Corporation', type: 'Common Stock' },
      { symbol: 'AMD', description: 'Advanced Micro Devices', type: 'Common Stock' },
      { symbol: 'BTC', description: 'Bitcoin', type: 'Crypto' },
      { symbol: 'ETH', description: 'Ethereum', type: 'Crypto' },
      { symbol: 'SPY', description: 'SPDR S&P 500 ETF Trust', type: 'ETF' },
      { symbol: 'QQQ', description: 'Invesco QQQ Trust', type: 'ETF' },
      { symbol: 'JPM', description: 'JPMorgan Chase & Co.', type: 'Common Stock' },
      { symbol: 'BA', description: 'Boeing Co.', type: 'Common Stock' },
      { symbol: 'INTC', description: 'Intel Corporation', type: 'Common Stock' },
    ];
    const q = query.toUpperCase();
    return allStocks.filter(s =>
      s.symbol.includes(q) || s.description.toUpperCase().includes(q)
    );
  }

  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/search`, {
      params: { q: query, token: apiKey },
      timeout: 5000
    });
    return (response.data.result || [])
      .filter(s => s.type === 'Common Stock' || s.type === 'ETP')
      .slice(0, 10)
      .map(s => ({ symbol: s.symbol, description: s.description, type: s.type }));
  } catch {
    return [];
  }
};

export const getMarketGainersLosers = async () => {
  const gainers = ['NVDA', 'AMD', 'TSLA', 'AMZN', 'META'].map(s => ({
    ticker: s,
    price: getBasePrice(s).toFixed(2),
    change_percentage: `+${(Math.random() * 5 + 1).toFixed(2)}%`,
  }));
  const losers = ['BA', 'INTC', 'JPM'].map(s => ({
    ticker: s,
    price: getBasePrice(s).toFixed(2),
    change_percentage: `-${(Math.random() * 5 + 1).toFixed(2)}%`,
  }));
  const mostActive = ['AAPL', 'MSFT', 'SPY', 'QQQ'].map(s => ({
    ticker: s,
    price: getBasePrice(s).toFixed(2),
    change_percentage: `${(Math.random() > 0.5 ? '+' : '-')}${(Math.random() * 2).toFixed(2)}%`,
  }));
  return { gainers, losers, mostActive };
};

export const getTrendingNews = async () => {
  const apiKey = process.env.FINNHUB_API_KEY;

  const mockNews = [
    { id: 1, headline: 'NVIDIA Surpasses $2T Market Cap Milestone as AI Demand Accelerates', source: 'Bloomberg', summary: 'NVIDIA\'s data center segment continues to drive record revenue as hyperscalers expand AI infrastructure investments...', url: '#', datetime: new Date().toISOString() },
    { id: 2, headline: 'Federal Reserve Signals Rate Pause, Markets Rally on Soft Landing Narrative', source: 'Reuters', summary: 'Equity markets surged after Fed minutes revealed consensus on holding rates, boosting risk appetite...', url: '#', datetime: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, headline: 'Bitcoin ETF Inflows Hit Record $1.2B in Single Day', source: 'CoinDesk', summary: 'Institutional demand for spot Bitcoin ETFs continues to surge as BlackRock and Fidelity products see massive capital flows...', url: '#', datetime: new Date(Date.now() - 7200000).toISOString() },
    { id: 4, headline: 'Tesla Q1 Deliveries Miss Estimates; Stock Volatile in After-Hours Trading', source: 'CNBC', summary: 'Tesla reported 386,810 vehicle deliveries for Q1 2025, falling short of the 457,000 analyst consensus estimate...', url: '#', datetime: new Date(Date.now() - 10800000).toISOString() },
    { id: 5, headline: 'S&P 500 Closes at Record High as Tech Sector Drives Broad-Based Rally', source: 'MarketWatch', summary: 'The benchmark index gained 1.2% with technology and communication services leading sector performance...', url: '#', datetime: new Date(Date.now() - 14400000).toISOString() },
  ];

  if (!isKeyValid(apiKey)) return mockNews;

  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/news`, {
      params: { category: 'general', token: apiKey },
      timeout: 5000
    });
    if (!response.data?.length) return mockNews;
    return response.data.slice(0, 8).map(n => ({
      id: n.id,
      headline: n.headline,
      summary: n.summary,
      url: n.url,
      source: n.source,
      datetime: new Date(n.datetime * 1000).toISOString(),
    }));
  } catch {
    return mockNews;
  }
};

export const getVolatilityProfile = (symbol) =>
  VOLATILITY_PROFILES[symbol.toUpperCase()] || VOLATILITY_PROFILES['DEFAULT'];
