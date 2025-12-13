import { useState, useEffect } from 'react';
import type { Dividend, ExchangeRates, DateRange } from '../types';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { loadExchangeRates, getDateRange, getExchangeRate } from '../utils/exchangeRates';
import { calculateTotalDollars, calculateTotalEuros } from '../utils/calculations';

export function useDividendCalculator() {
  const [mounted, setMounted] = useState(false);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [dollarAmount, setDollarAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    // Defer state updates to avoid cascading renders warning
    queueMicrotask(() => {
      const storedDividends = loadFromStorage<Dividend[]>('dividends', []);
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

    const newDividend: Dividend = {
      id: Date.now().toString(),
      dollarAmount: dollars,
      paymentDate,
      euroAmount: dollars / rate,
      exchangeRate: rate,
    };

    const updatedDividends = [...dividends, newDividend];
    setDividends(updatedDividends);
    saveToStorage('dividends', updatedDividends);
    
    setDollarAmount('');
    setPaymentDate('');
  };

  const handleDelete = (id: string) => {
    const updatedDividends = dividends.filter(d => d.id !== id);
    setDividends(updatedDividends);
    saveToStorage('dividends', updatedDividends);
  };

  const totalDollars = calculateTotalDollars(dividends);
  const totalEuros = calculateTotalEuros(dividends);

  return {
    // State
    mounted,
    dividends,
    dollarAmount,
    paymentDate,
    isFormOpen,
    dateRange,
    totalDollars,
    totalEuros,
    // State setters
    setDollarAmount,
    setPaymentDate,
    // Actions
    toggleForm,
    handleSubmit,
    handleDelete,
  };
}
