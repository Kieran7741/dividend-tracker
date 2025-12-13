import { useState, useEffect } from 'react';
import type { Dividend, ExchangeRates, DateRange } from '../types';
import { loadDividends, saveToStorage, loadFromStorage } from '../utils/storage';
import { loadExchangeRates, getDateRange, getExchangeRate } from '../utils/exchangeRates';
import { calculateTotalDollars, calculateTotalEuros } from '../utils/calculations';
import { 
  calculateUSWithholding, 
  calculateIrishTax,
  calculateNetDividend,
  getTotalUSWithholding,
  getTotalEUTax,
  getTotalNetDividendsUSD,
  getTotalNetDividendsEUR,
  US_WITHHOLDING_WITH_TREATY,
  EU_COUNTRY_TAX_RATES,
  IRISH_STANDARD_RATE,
  IRISH_HIGHER_RATE
} from '../utils/taxCalculations';

export function useDividendCalculator() {
  const [mounted, setMounted] = useState(false);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [dollarAmount, setDollarAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [usWithholdingRate, setUsWithholdingRate] = useState(US_WITHHOLDING_WITH_TREATY);
  const [euCountry, setEuCountry] = useState('');
  const [irishMarginalRate, setIrishMarginalRate] = useState<number>(IRISH_HIGHER_RATE);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    // Defer state updates to avoid cascading renders warning
    queueMicrotask(() => {
      const storedDividends = loadDividends(); // Use migration-aware loader
      const storedFormOpen = loadFromStorage<boolean>('isFormOpen', true);
      
      setDividends(storedDividends);
      setIsFormOpen(storedFormOpen);
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    const loadRates = async () => {
      const rates = await loadExchangeRates();
      setExchangeRates(rates);
      const range = getDateRange(rates);
      setDateRange(range);
    };
    loadRates();
  }, []);

  const toggleForm = () => {
    const newState = !isFormOpen;
    setIsFormOpen(newState);
    saveToStorage('isFormOpen', newState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dollars = parseFloat(dollarAmount);
    if (isNaN(dollars) || !paymentDate) return;

    const rate = getExchangeRate(exchangeRates, paymentDate);
    if (!rate) {
      alert('Exchange rate not available for this date. Please select a different date.');
      return;
    }

    // Calculate tax amounts
    const usWithholdingAmount = calculateUSWithholding(dollars, usWithholdingRate);
    
    let euTaxAmount: number | undefined;
    let foreignTaxCredit: number | undefined;
    
    // If Ireland is selected, use proper Irish tax calculation
    let irishIncomeTax: number | undefined
    let irishUSC: number | undefined
    let irishPRSI: number | undefined
    let irishTaxPayableEur: number | undefined

    if (euCountry === 'IE') {
      const irishTax = calculateIrishTax(dollars, usWithholdingAmount, irishMarginalRate, rate);
      euTaxAmount = irishTax.irishTaxLiability; // total before credit
      foreignTaxCredit = irishTax.foreignTaxCredit; // credit against Income Tax only
      irishIncomeTax = irishTax.incomeTax;
      irishUSC = irishTax.usc;
      irishPRSI = irishTax.prsi;
      irishTaxPayableEur = irishTax.totalPayable;
    }

    // Net USD received from broker (after US withholding only)
    const netAmountUSD = dollars - usWithholdingAmount;
    // Net EUR after paying Irish tax later
    const netAmountEUR = netAmountUSD / rate - (irishTaxPayableEur || 0);

    const newDividend: Dividend = {
      id: Date.now().toString(),
      dollarAmount: dollars,
      paymentDate,
      euroAmount: dollars / rate,
      exchangeRate: rate,
      usWithholdingRate,
      usWithholdingAmount,
      euCountry: euCountry || undefined,
      irishMarginalRate: euCountry === 'IE' ? irishMarginalRate : undefined,
      irishIncomeTax,
      irishUSC,
      irishPRSI,
      euTaxAmount,
      foreignTaxCredit,
      irishTaxPayableEur,
      netAmountUSD,
      netAmountEUR,
    };

    const updatedDividends = [...dividends, newDividend];
    setDividends(updatedDividends);
    saveToStorage('dividends', updatedDividends);
    
    setDollarAmount('');
    setPaymentDate('');
    setEuCountry('');
  };

  const handleDelete = (id: string) => {
    const updatedDividends = dividends.filter(d => d.id !== id);
    setDividends(updatedDividends);
    saveToStorage('dividends', updatedDividends);
  };

  const totalDollars = calculateTotalDollars(dividends);
  const totalEuros = calculateTotalEuros(dividends);
  const totalUSWithholding = getTotalUSWithholding(dividends);
  const totalEUTax = getTotalEUTax(dividends);
  const totalNetUSD = getTotalNetDividendsUSD(dividends);
  const totalNetEUR = getTotalNetDividendsEUR(dividends);
  const totalIrishPayable = dividends.reduce((sum, d) => sum + (d.irishTaxPayableEur || 0), 0);

  return {
    // State
    mounted,
    dividends,
    dollarAmount,
    paymentDate,
    usWithholdingRate,
    euCountry,
    irishMarginalRate,
    isFormOpen,
    dateRange,
    totalDollars,
    totalEuros,
    totalUSWithholding,
    totalEUTax,
    totalNetUSD,
    totalNetEUR,
    totalIrishPayable,
    euCountryRates: EU_COUNTRY_TAX_RATES,
    // State setters
    setDollarAmount,
    setPaymentDate,
    setUsWithholdingRate,
    setEuCountry,
    setIrishMarginalRate,
    // Actions
    toggleForm,
    handleSubmit,
    handleDelete,
  };
}
