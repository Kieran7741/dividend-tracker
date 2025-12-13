import type { Dividend } from '../types';
import { calculateUSWithholding, calculateEUTax, calculateForeignTaxCredit, calculateNetDividend, US_WITHHOLDING_WITH_TREATY } from './taxCalculations';

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      return JSON.parse(stored);
    }
    return defaultValue;
  } catch (error) {
    console.error(`Failed to load ${key} from storage:`, error);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error);
  }
}

/**
 * Migrate old dividend data to include tax fields
 * This ensures backwards compatibility with existing stored dividends
 */
export function migrateDividend(dividend: Partial<Dividend> & { dollarAmount: number; exchangeRate: number }): Dividend {
  // If dividend already has tax fields, return as is
  if ('usWithholdingRate' in dividend && 'netAmountUSD' in dividend) {
    return dividend as Dividend;
  }

  // Apply default 15% US withholding for old dividends
  const usWithholdingRate = US_WITHHOLDING_WITH_TREATY;
  const usWithholdingAmount = calculateUSWithholding(dividend.dollarAmount, usWithholdingRate);
  
  // Calculate EU tax if country is specified (shouldn't be in old data, but handle it)
  let euTaxAmount = 0;
  let foreignTaxCredit = 0;
  
  if (dividend.euCountry && dividend.euTaxRate) {
    euTaxAmount = calculateEUTax(
      dividend.dollarAmount,
      dividend.euTaxRate,
      dividend.exchangeRate
    );
    foreignTaxCredit = calculateForeignTaxCredit(usWithholdingAmount, euTaxAmount);
  }
  
  // Calculate net amounts
  const netAmountUSD = calculateNetDividend(
    dividend.dollarAmount,
    usWithholdingAmount,
    euTaxAmount,
    foreignTaxCredit
  );
  const netAmountEUR = netAmountUSD / dividend.exchangeRate;

  return {
    ...dividend,
    usWithholdingRate,
    usWithholdingAmount,
    euTaxAmount: dividend.euTaxAmount || euTaxAmount || undefined,
    foreignTaxCredit: dividend.foreignTaxCredit || foreignTaxCredit || undefined,
    netAmountUSD,
    netAmountEUR,
  };
}

/**
 * Load dividends from storage and migrate old data
 */
export function loadDividends(): Dividend[] {
  const stored = loadFromStorage<Array<Partial<Dividend> & { dollarAmount: number; exchangeRate: number }>>('dividends', []);
  return stored.map(migrateDividend);
}
