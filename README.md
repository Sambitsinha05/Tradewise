# TradeWise - Institutional Grade Fintech Platform

TradeWise is a modern, full-stack trading simulation and portfolio management platform designed to provide a realistic, institutional-grade experience. It features real-time simulated market data, deep quantitative analytics, dual-currency support, and behavioral trading insights.

## Features

- **Live Market Simulation:** Advanced simulated market data engine using Geometric Brownian Motion (Box-Muller Gaussian sampling) and asset-specific volatility profiles.
- **Institutional Analytics:** Comprehensive quantitative risk metrics including Sharpe Ratio, Sortino Ratio (downside risk), Parametric VaR (95% and 99%), CAGR, Alpha, Beta, and Herfindahl Index for concentration risk.
- **Real-time Event System:** Integrated notification center with live trade confirmations (Toast stack), price alerts, and system-wide messaging via a unified event-driven architecture.
- **Dual-Currency Architecture:** Seamlessly toggle between USD (native) and a localized currency across the entire application for a truly global experience.
- **Behavioral Trading Journal:** Log trades with emotional states and strategies, and view quantitative analysis correlating your psychology (e.g., trading when anxious) to realized PnL.
- **Recruiter-Ready Demo Mode:** Instantly populate a fresh account with a realistic blue-chip portfolio, 390-minute intraday historical bars, and actionable analytics with a single click.
- **Fractional Trading Engine:** Execute trades by amount (e.g., $100) or by shares. The system calculates precise fractional units down to 6 decimal places, supporting micro-investing.
- **Responsive & Premium UI:** Built with React, TailwindCSS, and Framer Motion, featuring a dark glassmorphism design, mobile-optimized bottom navigation, and zero-layout-shift skeleton loaders.

## Tech Stack

### Frontend
- **React 18** (Vite)
- **Zustand** (State Management)
- **React Router Dom** (Routing)
- **TailwindCSS** (Styling & Layout)
- **Framer Motion** (Animations)
- **Recharts** (Data Visualization)
- **Lucide React** (Icons)

### Backend
- **Node.js & Express.js**
- **MongoDB & Mongoose**
- **Socket.io** (Real-time data streaming)
- **JWT** (Authentication)

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### Installation

1. **Clone the repository**
2. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

4. **Run the Application**
   Open two terminals:
   ```bash
   # Terminal 1 (Backend)
   cd backend
   npm run dev

   # Terminal 2 (Frontend)
   cd frontend
   npm run dev
   ```

## Key Architectural Decisions

- **State Management:** Migrated to `Zustand` for leaner, hook-based global state compared to Redux, enabling simpler async actions for API calls.
- **Simulation Engine:** Built a custom fallback `marketDataService` that uses drift and volatility variables so the app remains perfectly functional and realistic without paying for expensive live stock API tiers.
- **Accounting:** Implemented FIFO logic for tracking realized PnL in the `tradingService` to mirror real brokerage accounting.

## License
MIT License
