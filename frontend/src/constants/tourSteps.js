export const TOUR_STEPS = [
  {
    target: '.dashboard-header',
    content: 'Welcome to TradeWise! This is your control center for all trading activities.',
    title: 'Your Command Center',
    placement: 'bottom',
    route: '/dashboard',
    disableBeacon: true,
  },
  {
    target: '.valuation-card',
    content: 'Monitor your total portfolio valuation and real-time P/L performance right here.',
    title: 'Portfolio Valuation',
    placement: 'bottom',
    route: '/dashboard',
  },
  {
    target: '.trade-action-btn',
    content: 'Ready to trade? This Quick Trade button takes you straight to the Market Terminal.',
    title: 'Instant Execution',
    placement: 'bottom',
    route: '/dashboard',
  },
  {
    target: '.sidebar-nav',
    content: 'Navigate between your Portfolio, Watchlist, AI Analytics, and Trading Journal.',
    title: 'Global Navigation',
    placement: 'right',
    route: '/dashboard',
  },
  {
    target: '.market-ticker-container',
    content: 'Get real-time price feeds for all major global indices and crypto assets.',
    title: 'Live Market Data',
    placement: 'bottom',
    route: '/dashboard',
  },
  {
    target: '.portfolio-stats-grid',
    content: 'Deep dive into your risk-adjusted returns and alpha metrics here.',
    title: 'Portfolio Intelligence',
    placement: 'bottom',
    route: '/portfolio',
  },
  {
    target: '.holdings-table',
    content: 'Manage your active positions, view unrealized gains, and execute rebalancing trades.',
    title: 'Asset Management',
    placement: 'top',
    route: '/portfolio',
  },
  {
    target: '.ai-analytics-insights',
    content: 'Our AI engine analyzes your behavior to provide actionable risk recommendations.',
    title: 'AI Risk Advisory',
    placement: 'top',
    route: '/analytics',
  }
];
