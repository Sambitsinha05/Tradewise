import cron from 'node-cron';
import Alert from '../models/alertModel.js';
import Portfolio from '../models/portfolioModel.js';
import Notification from '../models/notificationModel.js';
import { getQuote } from '../services/marketDataService.js';

/**
 * Starts cron jobs when the server boots to monitor price thresholds and volatility
 */
export const startAlertMonitoring = (io) => {
  // 1. DEDICATED PRICE ALERTS ENGINE (Runs every 1 minute)
  cron.schedule('* * * * *', async () => {
    try {
      const activeAlerts = await Alert.find({ enabled: true });

      for (const alert of activeAlerts) {
        try {
          const quote = await getQuote(alert.symbol);
          const currentPrice = quote.currentPrice;
          let triggered = false;

          if (alert.condition === '>' && currentPrice >= alert.targetPrice) {
            triggered = true;
          } else if (alert.condition === '<' && currentPrice <= alert.targetPrice) {
            triggered = true;
          } else if (alert.alertType === 'PRICE_ABOVE' && currentPrice >= alert.targetPrice) {
            triggered = true;
          } else if (alert.alertType === 'PRICE_BELOW' && currentPrice <= alert.targetPrice) {
            triggered = true;
          }

          if (triggered) {
            const alertData = {
              symbol: alert.symbol,
              title: 'Threshold Breach \uD83D\uDEA8',
              message: `${alert.symbol} ${alert.condition === '>' ? 'surged above' : 'dropped below'} target $${alert.targetPrice}. Current: $${currentPrice}`,
              type: alert.condition === '>' ? 'BULLISH' : 'BEARISH'
            };

            // 1. Emit Live Socket Event
            io.to(`user:${alert.userId}`).emit('price_alert', alertData);

            // 2. Persist to Database
            await Notification.create({
              user: alert.userId,
              type: 'PRICE_ALERT',
              title: alertData.title,
              message: alertData.message,
              data: { symbol: alert.symbol, price: currentPrice, target: alert.targetPrice }
            });

            // Auto-disable triggered alert to prevent spamming
            alert.enabled = false;
            alert.lastTriggered = new Date();
            await alert.save();
          }
        } catch (e) {
          console.error(`[ALERT ENGINE] Error checking ${alert.symbol}:`, e.message);
        }
      }
    } catch (error) {
      console.error('[ALERT ENGINE CRITICAL] Cron failure:', error);
    }
  });

  // 2. PORTFOLIO VOLATILITY ALERTS (Runs every 10 minutes)
  cron.schedule('*/10 * * * *', async () => {
    try {
      const portfolios = await Portfolio.find({});
      
      for (const portfolio of portfolios) {
        if (!portfolio.holdings || portfolio.holdings.length === 0) continue;

        for (const holding of portfolio.holdings) {
          try {
            const quote = await getQuote(holding.symbol);
            
            if (Math.abs(quote.percentChange) >= 5.0) {
              const volData = {
                symbol: holding.symbol,
                title: 'High Volatility \u26A0\uFE0F',
                message: `${holding.symbol} is ${quote.percentChange >= 0 ? 'up' : 'down'} ${Math.abs(quote.percentChange)}% today.`,
                type: quote.percentChange >= 0 ? 'BULLISH' : 'BEARISH'
              };

              io.to(`user:${portfolio.user}`).emit('volatility_alert', volData);

              await Notification.create({
                user: portfolio.user,
                type: 'RISK_WARNING',
                title: volData.title,
                message: volData.message,
                data: { symbol: holding.symbol, change: quote.percentChange }
              });
            }
          } catch (error) {
            // Ignore fetch errors
          }
        }
      }
    } catch (error) {
      console.error('Error in Volatility Alert Cron:', error);
    }
  });

  console.log('--- PRODUCTION ALERT ENGINE INITIALIZED ---');
};
