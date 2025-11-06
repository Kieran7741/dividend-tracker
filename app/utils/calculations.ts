import type { Dividend, Share, ExchangeRates, TickerPrice } from '../types';

// Dividend calculations
export function calculateTotalDollars(dividends: Dividend[]): number {
  return dividends.reduce((sum, d) => sum + d.dollarAmount, 0);
}

export function calculateTotalEuros(dividends: Dividend[]): number {
  return dividends.reduce((sum, d) => sum + d.euroAmount, 0);
}

// Share calculations
export function calculateProfitPerShare(share: Share, currentPrice: number): number {
  return currentPrice - share.purchasePrice;
}

export function calculateTotalProfit(share: Share, currentPrice: number): number {
  return (currentPrice - share.purchasePrice) * share.sharesHeld;
}

export function calculatePercentageGain(share: Share, currentPrice: number): number {
  return ((currentPrice - share.purchasePrice) / share.purchasePrice) * 100;
}

export function calculateTotalInvestment(shares: Share[]): number {
  return shares.reduce((sum, s) => sum + (s.purchasePrice * s.sharesHeld), 0);
}

export function calculateCurrentValue(shares: Share[], tickerPrices: TickerPrice): number {
  return shares.reduce((sum, s) => sum + ((tickerPrices[s.ticker] || 0) * s.sharesHeld), 0);
}

export function calculatePortfolioProfit(shares: Share[], tickerPrices: TickerPrice): {
  totalProfit: number;
  totalProfitPercentage: number;
} {
  const totalInvestment = calculateTotalInvestment(shares);
  const currentValue = calculateCurrentValue(shares, tickerPrices);
  const totalProfit = currentValue - totalInvestment;
  const totalProfitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
  
  return { totalProfit, totalProfitPercentage };
}

export function getPurchasePriceEur(share: Share, exchangeRates: ExchangeRates): number | null {
  const rate = exchangeRates[share.purchaseDate];
  if (!rate) return null;
  return share.purchasePrice / rate;
}
