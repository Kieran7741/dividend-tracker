'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Dividend, ExchangeRates, DateRange } from './types';
import { loadFromStorage, saveToStorage } from './utils/storage';
import { loadExchangeRates, getDateRange, getExchangeRate } from './utils/exchangeRates';
import { calculateTotalDollars, calculateTotalEuros } from './utils/calculations';
import { downloadCSV, formatDate, getCurrentDateString } from './utils/export';

export default function Home() {
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [dollarAmount, setDollarAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  useEffect(() => {
    const storedDividends = loadFromStorage<Dividend[]>('dividends', []);
    setDividends(storedDividends);
    setLoading(false);

    const storedFormState = loadFromStorage<boolean>('isFormOpen', true);
    setIsFormOpen(storedFormState);

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

  const handleExport = () => {
    const headers = ['Payment Date', 'USD Amount', 'Exchange Rate', 'EUR Amount'];
    const rows = dividends.map(d => [
      formatDate(d.paymentDate),
      d.dollarAmount.toFixed(2),
      d.exchangeRate.toFixed(4),
      d.euroAmount.toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total,${totalDollars.toFixed(2)},,${totalEuros.toFixed(2)}`
    ].join('\n');
    
    downloadCSV(csvContent, `dividends-${getCurrentDateString()}.csv`);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-end">
          <Link 
            href="/shares" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View Share Holdings →
          </Link>
        </div>
        
        <h2 className="text-3xl font-bold mb-2 text-gray-900">Gross Dividend Calculator</h2>
        <p className="text-gray-600 mb-8">
          Track your USD dividend payments and calculate their EUR value using official ECB exchange rates. Note: this tool does not send any data to a server; all information is stored locally in your browser.
        </p>
        {/* Entry Form */}
        <div className="bg-white rounded-lg shadow mb-6">
          <button
            onClick={toggleForm}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-xl font-semibold text-gray-900">Add Dividend Payment</h3>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${isFormOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isFormOpen && (
            <div className="px-6 pb-6 border-t border-gray-200">
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={dollarAmount}
                    onChange={(e) => setDollarAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    min={dateRange?.min}
                    max={dateRange?.max}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  {dateRange && (
                    <p className="mt-1 text-xs text-gray-500">
                      Exchange rates available from {formatDate(dateRange.min)} to {formatDate(dateRange.max)}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Dividend
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Dividends Table */}
        {dividends.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="text-xl font-semibold text-gray-900">Dividend Payments</h3>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      USD Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exchange Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      EUR Amount
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dividends.map((dividend) => (
                    <tr key={dividend.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(dividend.paymentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ${dividend.dollarAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {dividend.exchangeRate.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        €{dividend.euroAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => handleDelete(dividend.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      ${totalDollars.toFixed(2)}
                    </td>
                    <td></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      €{totalEuros.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
