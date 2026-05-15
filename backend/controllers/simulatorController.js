// @desc    Calculate SIP / Compound Growth Simulation
// @route   POST /api/simulator/calculate
// @access  Public or Private
export const calculateSimulation = (req, res, next) => {
  try {
    const {
      initialInvestment = 0,
      monthlyContribution = 0,
      annualReturnRate = 10, // 10% default
      investmentDurationYears = 10,
      inflationRate = 3, // 3% default inflation
    } = req.body;

    const months = investmentDurationYears * 12;
    const monthlyReturnRate = (annualReturnRate / 100) / 12;
    
    let currentBalance = initialInvestment;
    let totalInvested = initialInvestment;
    
    const yearlyData = [];

    // Push year 0 (Starting point)
    yearlyData.push({
      year: 0,
      totalInvested: initialInvestment,
      futureValue: initialInvestment,
      inflationAdjustedValue: initialInvestment,
    });

    for (let m = 1; m <= months; m++) {
      // Add monthly contribution
      currentBalance += monthlyContribution;
      totalInvested += monthlyContribution;

      // Apply compound interest for the month
      currentBalance = currentBalance * (1 + monthlyReturnRate);

      // Record data at the end of every 12 months
      if (m % 12 === 0) {
        const year = m / 12;
        // Adjust for inflation: Future Value / (1 + inflation rate)^year
        const inflationFactor = Math.pow(1 + inflationRate / 100, year);
        const inflationAdjustedValue = currentBalance / inflationFactor;

        yearlyData.push({
          year,
          totalInvested: Math.round(totalInvested),
          futureValue: Math.round(currentBalance),
          inflationAdjustedValue: Math.round(inflationAdjustedValue),
        });
      }
    }

    const finalFutureValue = currentBalance;
    const finalInflationAdjustedValue = currentBalance / Math.pow(1 + inflationRate / 100, investmentDurationYears);
    const totalWealthGained = finalFutureValue - totalInvested;

    res.status(200).json({
      summary: {
        totalInvested: Math.round(totalInvested),
        estimatedFutureValue: Math.round(finalFutureValue),
        inflationAdjustedValue: Math.round(finalInflationAdjustedValue),
        totalWealthGained: Math.round(totalWealthGained),
      },
      projectionData: yearlyData,
    });
  } catch (error) {
    next(error);
  }
};
