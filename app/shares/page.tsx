'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Share, TickerPrice, ExchangeRates } from '../types';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { loadExchangeRates } from '../utils/exchangeRates';
import { 
  calculateProfitPerShare, 
  calculateTotalProfit, 
  calculatePercentageGain,
  calculateTotalInvestment,
  calculateCurrentValue,
  calculatePortfolioProfit,
  getPurchasePriceEur
} from '../utils/calculations';
import { downloadCSV, formatDate, getCurrentDateString } from '../utils/export';

export default function Shares() {
  const [shares, setShares] = useState<Share[]>([]);
  const [tickerPrices, setTickerPrices] = useState<TickerPrice>({});
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [ticker, setTicker] = useState('');
  const [sharesHeld, setSharesHeld] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(true);

  useEffect(() => {
    const storedShares = loadFromStorage<Share[]>('shares', []);
    setShares(storedShares);
    setLoading(false);

    const storedPrices = loadFromStorage<TickerPrice>('tickerPrices', {});
    setTickerPrices(storedPrices);

    const storedFormState = loadFromStorage<boolean>('isSharesFormOpen', true);
    setIsFormOpen(storedFormState);

    const loadRates = async () => {
      const rates = await loadExchangeRates();
      setExchangeRates(rates);
    };
    loadRates();
  }, []);

  const toggleForm = () => {
    const newState = !isFormOpen;
    setIsFormOpen(newState);
    saveToStorage('isSharesFormOpen', newState);
  };

  // Auto-populate current price when ticker changes
  useEffect(() => {
    if (ticker) {
      const tickerUpper = ticker.toUpperCase();
      const existingPrice = tickerPrices[tickerUpper];
      if (existingPrice !== undefined) {
        setCurrentPrice(existingPrice.toString());
      }
    }
  }, [ticker, tickerPrices]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const shares_held = parseFloat(sharesHeld);
    const purchase_price = parseFloat(purchasePrice);
    const current_price = parseFloat(currentPrice);
    
    if (isNaN(shares_held) || isNaN(purchase_price) || isNaN(current_price) || !ticker || !purchaseDate) {
      return;
    }

    const tickerUpper = ticker.toUpperCase();
    
    const newShare: Share = {
      id: Date.now().toString(),
      ticker: tickerUpper,
      sharesHeld: shares_held,
      purchasePrice: purchase_price,
      purchaseDate,
    };

    const updatedShares = [...shares, newShare];
    setShares(updatedShares);
    saveToStorage('shares', updatedShares);
    
    // Update ticker price
    const updatedPrices = { ...tickerPrices, [tickerUpper]: current_price };
    setTickerPrices(updatedPrices);
    saveToStorage('tickerPrices', updatedPrices);
    
    setTicker('');
    setSharesHeld('');
    setPurchasePrice('');
    setCurrentPrice('');
    setPurchaseDate('');
  };

  const handleDelete = (id: string) => {
    const updatedShares = shares.filter(s => s.id !== id);
    setShares(updatedShares);
    saveToStorage('shares', updatedShares);
  };

  const handleUpdateCurrentPrice = (ticker: string, newPrice: number) => {
    const updatedPrices = { ...tickerPrices, [ticker]: newPrice };
    setTickerPrices(updatedPrices);
    saveToStorage('tickerPrices', updatedPrices);
  };

  const getCurrentPrice = (ticker: string) => {
    return tickerPrices[ticker] || 0;
  };

  const totalInvestment = calculateTotalInvestment(shares);
  const currentValue = calculateCurrentValue(shares, tickerPrices);
  const { totalProfit, totalProfitPercentage } = calculatePortfolioProfit(shares, tickerPrices);

  const handleExport = () => {
    const headers = ['Ticker', 'Shares Held', 'Purchase Price (USD)', 'Purchase Price (EUR)', 'Current Price', 'Purchase Date', 'Profit per Share', 'Total Profit', 'Gain %'];
    const rows = shares.map(s => {
      const currentPrice = getCurrentPrice(s.ticker);
      const eurPrice = getPurchasePriceEur(s, exchangeRates);
      return [
        s.ticker,
        s.sharesHeld.toString(),
        s.purchasePrice.toFixed(2),
        eurPrice ? eurPrice.toFixed(2) : 'N/A',
        currentPrice.toFixed(2),
        formatDate(s.purchaseDate),
        calculateProfitPerShare(s, currentPrice).toFixed(2),
        calculateTotalProfit(s, currentPrice).toFixed(2),
        calculatePercentageGain(s, currentPrice).toFixed(2)
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total Investment,$${totalInvestment.toFixed(2)}`,
      `Current Value,$${currentValue.toFixed(2)}`,
      `Total Profit,$${totalProfit.toFixed(2)},${totalProfitPercentage.toFixed(2)}%`
    ].join('\n');
    
    downloadCSV(csvContent, `shares-${getCurrentDateString()}.csv`);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Dividends
          </Link>
        </div>
        
        <h2 className="text-3xl font-bold mb-2 text-gray-900">Share Holdings Tracker</h2>
        <p className="text-gray-600 mb-8">
          Track your share holdings and monitor profit per share. All data is stored locally in your browser.
        </p>

        {/* Entry Form */}
        <div className="bg-white rounded-lg shadow mb-6">
          <button
            onClick={toggleForm}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-xl font-semibold text-gray-900">Add Share Holding</h3>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticker Symbol
                    </label>
                    <input
                      type="text"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value)}
                      placeholder="AAPL"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shares Held
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.001"
                      value={sharesHeld}
                      onChange={(e) => setSharesHeld(e.target.value)}
                      placeholder="100"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Price (USD)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="150.00"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Price (USD)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={currentPrice}
                      onChange={(e) => setCurrentPrice(e.target.value)}
                      placeholder="175.00"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Share Holding
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {shares.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Investment</h4>
              <p className="text-2xl font-bold text-gray-900">${totalInvestment.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Current Value</h4>
              <p className="text-2xl font-bold text-gray-900">${currentValue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Profit</h4>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalProfit.toFixed(2)} ({totalProfitPercentage >= 0 ? '+' : ''}{totalProfitPercentage.toFixed(2)}%)
              </p>
            </div>
          </div>
        )}

        {/* Shares Table */}
        {shares.length > 0 && (() => {
          // Group shares by year
          const sharesByYear = shares.reduce((acc, share) => {
            const year = new Date(share.purchaseDate).getFullYear();
            if (!acc[year]) {
              acc[year] = [];
            }
            acc[year].push(share);
            return acc;
          }, {} as Record<number, Share[]>);

          // Sort shares within each year by date (ascending - oldest first)
          Object.keys(sharesByYear).forEach(year => {
            sharesByYear[Number(year)].sort((a, b) => 
              new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
            );
          });

          // Sort years in ascending order (oldest first)
          const sortedYears = Object.keys(sharesByYear).map(Number).sort((a, b) => a - b);

          return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="flex items-center justify-between p-6 pb-4">
                <h3 className="text-xl font-semibold text-gray-900">Share Holdings</h3>
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
                        Ticker
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shares
                      </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Price (USD)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Price (EUR)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit/Share
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Profit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gain %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchase Date
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedYears.map(year => {
                      const yearShares = sharesByYear[year];
                      return (
                        <React.Fragment key={year}>
                          {/* Year divider */}
                          <tr className="bg-gray-100">
                            <td colSpan={10} className="px-6 py-3">
                              <div className="font-semibold text-gray-700 text-sm">
                                {year}
                              </div>
                            </td>
                          </tr>
                          {/* Shares for this year */}
                          {yearShares.map((share, index) => {
                            const currentPrice = getCurrentPrice(share.ticker);
                            const profitPerShare = calculateProfitPerShare(share, currentPrice);
                            const shareProfit = calculateTotalProfit(share, currentPrice);
                            const percentageGain = calculatePercentageGain(share, currentPrice);
                            const eurPrice = getPurchasePriceEur(share, exchangeRates);
                            
                            // Check if this is the first occurrence of this ticker across all shares
                            const isFirstOccurrence = shares.findIndex(s => s.ticker === share.ticker) === shares.findIndex(s => s.id === share.id);
                            
                            return (
                              <tr key={share.id} className="hover:bg-gray-50 border-b border-gray-200">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {share.ticker}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {share.sharesHeld}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  ${share.purchasePrice.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {eurPrice ? `€${eurPrice.toFixed(2)}` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {isFirstOccurrence ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={currentPrice}
                                      onChange={(e) => handleUpdateCurrentPrice(share.ticker, parseFloat(e.target.value) || 0)}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  ) : (
                                    <span>${currentPrice.toFixed(2)}</span>
                                  )}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${profitPerShare >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${profitPerShare.toFixed(2)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${shareProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${shareProfit.toFixed(2)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${percentageGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {percentageGain >= 0 ? '+' : ''}{percentageGain.toFixed(2)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(share.purchaseDate)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                  <button
                                    onClick={() => handleDelete(share.id)}
                                    className="text-red-600 hover:text-red-800 font-medium"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    </main>
  );
}
