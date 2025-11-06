import type { ExchangeRates, DateRange } from '../types';

export async function loadExchangeRates(): Promise<ExchangeRates> {
  try {
    const response = await fetch('/exchange-rates.json');
    const rates = await response.json();
    return rates;
  } catch (error) {
    console.error('Failed to load exchange rates:', error);
    return {};
  }
}

export function getDateRange(rates: ExchangeRates): DateRange | null {
  const dates = Object.keys(rates).sort();
  if (dates.length > 0) {
    return {
      min: dates[0],
      max: dates[dates.length - 1]
    };
  }
  return null;
}

export function getExchangeRate(rates: ExchangeRates, date: string): number | null {
  return rates[date] ?? null;
}
