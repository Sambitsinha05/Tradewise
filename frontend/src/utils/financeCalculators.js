/**
 * Professional Financial Calculation Engine
 * Handles compound interest, SIP, inflation, CAGR and projection series
 */

/**
 * Calculates Future Value of SIP + Lumpsum
 * @param {number} P - Initial Investment (Principal)
 * @param {number} PMT - Monthly Contribution
 * @param {number} r - Annual Return Rate (in percentage)
 * @param {number} t - Time in Years
 * @returns {number} Future Value
 */
export const calculateFutureValue = (P, PMT, r, t) => {
  const i = r / 100 / 12; // Monthly interest rate
  const n = t * 12; // Total number of months
  
  // Future Value of Lumpsum
  const fvLumpsum = P * Math.pow(1 + i, n);
  
  // Future Value of SIP
  let fvSIP = 0;
  if (i > 0) {
    fvSIP = PMT * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  } else {
    fvSIP = PMT * n;
  }
  
  return fvLumpsum + fvSIP;
};

/**
 * Calculates Inflation Adjusted Value
 * @param {number} futureValue - The value in future dollars
 * @param {number} inflationRate - Annual inflation rate (in percentage)
 * @param {number} years - Time in years
 * @returns {number} Value in today's dollars
 */
export const adjustForInflation = (futureValue, inflationRate, years) => {
  return futureValue / Math.pow(1 + inflationRate / 100, years);
};

/**
 * Generates Yearly Time-Series Data for Charts with Scenarios
 */
export const generateScenarioProjections = (P, PMT, r, t, vol, inflationRate = 3) => {
  const scenarios = ['base', 'optimistic', 'pessimistic'];
  const results = {};

  scenarios.forEach(scenario => {
    const adjustedReturn = scenario === 'optimistic' ? r + (vol * 0.5) : 
                           scenario === 'pessimistic' ? r - (vol * 0.5) : r;
    
    results[scenario] = [];
    for (let year = 0; year <= t; year++) {
      const fv = calculateFutureValue(P, PMT, adjustedReturn, year);
      const invested = P + (PMT * 12 * year);
      const inflationAdjusted = adjustForInflation(fv, inflationRate, year);
      
      results[scenario].push({
        year,
        futureValue: Math.round(fv),
        totalInvested: Math.round(invested),
        inflationAdjustedValue: Math.round(inflationAdjusted),
      });
    }
  });
  
  return results;
};

/**
 * Simplified Monte Carlo Simulation
 * Returns probability distribution of terminal wealth
 */
export const runMonteCarloSimulation = (P, PMT, r, t, vol, iterations = 100) => {
  const outcomes = [];
  const annualMean = r / 100;
  const annualVol = vol / 100;

  for (let i = 0; i < iterations; i++) {
    let balance = P;
    for (let year = 1; year <= t; year++) {
      // Geometric Brownian Motion step (simplified)
      const shock = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 1.732; // Approx Normal
      const yearlyReturn = Math.exp((annualMean - 0.5 * annualVol**2) + annualVol * shock);
      balance = (balance + (PMT * 12)) * yearlyReturn;
    }
    outcomes.push(balance);
  }

  outcomes.sort((a, b) => a - b);
  return {
    median: outcomes[Math.floor(iterations * 0.5)],
    p10: outcomes[Math.floor(iterations * 0.1)],
    p90: outcomes[Math.floor(iterations * 0.9)],
  };
};

/**
 * Generates Yearly Time-Series Data for Charts
 */
export const generateProjectionSeries = (P, PMT, r, t, inflationRate = 3) => {
  const series = [];
  
  for (let year = 0; year <= t; year++) {
    const fv = calculateFutureValue(P, PMT, r, year);
    const invested = P + (PMT * 12 * year);
    const inflationAdjusted = adjustForInflation(fv, inflationRate, year);
    
    series.push({
      year,
      futureValue: Math.round(fv),
      totalInvested: Math.round(invested),
      inflationAdjustedValue: Math.round(inflationAdjusted),
      gains: Math.round(fv - invested)
    });
  }
  
  return series;
};

/**
 * FIRE Calculator (Financial Independence, Retire Early)
 * @param {number} annualExpenses - Current annual expenses
 * @param {number} withdrawalRate - Safe withdrawal rate (usually 4%)
 * @returns {number} FIRE target amount
 */
export const calculateFIRETarget = (annualExpenses, withdrawalRate = 4) => {
  return annualExpenses * (100 / withdrawalRate);
};

/**
 * Calculates Wealth Multiple
 * @param {number} futureValue 
 * @param {number} invested 
 * @returns {number} 
 */
export const calculateWealthMultiple = (futureValue, invested) => {
  return invested > 0 ? futureValue / invested : 0;
};
