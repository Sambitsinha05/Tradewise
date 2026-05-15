import Alert from '../models/alertModel.js';

// @desc    Get all alerts for user
// @route   GET /api/alerts
// @access  Private
export const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or Toggle alert
// @route   POST /api/alerts
// @access  Private
export const createOrToggleAlert = async (req, res) => {
  try {
    const { symbol, enabled, targetPrice, alertType, condition } = req.body;
    const userId = req.user._id;

    if (!symbol) {
      return res.status(400).json({ message: 'Symbol is required' });
    }

    let alert = await Alert.findOne({ userId, symbol });

    if (alert) {
      // Toggle if already exists and no specific enabled state provided, or update
      alert.enabled = enabled !== undefined ? enabled : !alert.enabled;
      if (targetPrice) alert.targetPrice = targetPrice;
      if (alertType) alert.alertType = alertType;
      if (condition) alert.condition = condition;
      
      await alert.save();
      console.log(`[ALERT] Toggled alert for ${symbol} to ${alert.enabled}`);
      return res.json(alert);
    }

    // Create new
    alert = new Alert({
      userId,
      symbol,
      enabled: enabled !== undefined ? enabled : true,
      targetPrice,
      alertType: alertType || 'PRICE_ABOVE',
      condition: condition || '>',
    });

    await alert.save();
    console.log(`[ALERT] Created alert for ${symbol}`);
    res.status(201).json(alert);
  } catch (error) {
    console.error(`[ALERT ERROR] ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete alert
// @route   DELETE /api/alerts/:symbol
// @access  Private
export const deleteAlert = async (req, res) => {
  try {
    const { symbol } = req.params;
    const userId = req.user._id;

    const result = await Alert.findOneAndDelete({ userId, symbol });
    
    if (!result) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    console.log(`[ALERT] Deleted alert for ${symbol}`);
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
