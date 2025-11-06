'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Share {
  id: string;
  ticker: string;
  sharesHeld: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
}

export default function Shares() {
  const [shares, setShares] = useState<Share[]>([]);
  const [ticker, setTicker] = useState('');
  const [sharesHeld, setSharesHeld] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(true);

  useEffect(() => {
    loadShares();
    loadFormState();
  }, []);

  const loadShares = () => {
    try {
      const stored = localStorage.getItem('shares');
      if (stored) {
        setShares(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFormState = () => {
    try {
      const stored = localStorage.getItem('isSharesFormOpen');
      if (stored !== null) {
        setIsFormOpen(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load form state:', error);
    }
  };

  const toggleForm = () => {
    const newState = !isFormOpen;
    setIsFormOpen(newState);
    localStorage.setItem('isSharesFormOpen', JSON.stringify(newState));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const shares_held = parseFloat(sharesHeld);
    const purchase_price = parseFloat(purchasePrice);
    const current_price = parseFloat(currentPrice);
    
    if (isNaN(shares_held) || isNaN(purchase_price) || isNaN(current_price) || !ticker || !purchaseDate) {
      return;
    }

    const newShare: Share = {
      id: Date.now().toString(),
      ticker: ticker.toUpperCase(),
      sharesHeld: shares_held,
      purchasePrice: purchase_price,
      currentPrice: current_price,
      purchaseDate,
    };

    const updatedShares = [...shares, newShare];
    setShares(updatedShares);
    localStorage.setItem('shares', JSON.stringify(updatedShares));
    
    setTicker('');
    setSharesHeld('');
    setPurchasePrice('');
    setCurrentPrice('');
    setPurchaseDate('');
  };

  const handleDelete = (id: string) => {
    const updatedShares = shares.filter(s => s.id !== id);
    setShares(updatedShares);
    localStorage.setItem('shares', JSON.stringify(updatedShares));
  };

  const handleUpdateCurrentPrice = (id: string, newPrice: number) => {
    const updatedShares = shares.map(s => 
      s.id === id ? { ...s, currentPrice: newPrice } : s
    );
    setShares(updatedShares);
    localStorage.setItem('shares', JSON.stringify(updatedShares));
  };

  const calculateProfit = (share: Share) => {
    return (share.currentPrice - share.purchasePrice) * share.sharesHeld;
  };

  const calculateProfitPerShare = (share: Share) => {
    return share.currentPrice - share.purchasePrice;
  };

  const calculatePercentageGain = (share: Share) => {
    return ((share.currentPrice - share.purchasePrice) / share.purchasePrice) * 100;
  };

  const totalInvestment = shares.reduce((sum, s) => sum + (s.purchasePrice * s.sharesHeld), 0);
  const currentValue = shares.reduce((sum, s) => sum + (s.currentPrice * s.sharesHeld), 0);
  const totalProfit = currentValue - totalInvestment;
  const totalProfitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

  const handleExport = () => {
    const headers = ['Ticker', 'Shares Held', 'Purchase Price', 'Current Price', 'Purchase Date', 'Profit per Share', 'Total Profit', 'Gain %'];
    const rows = shares.map(s => [
      s.ticker,
      s.sharesHeld.toString(),
      s.purchasePrice.toFixed(2),
      s.currentPrice.toFixed(2),
      new Date(s.purchaseDate).toLocaleDateString(),
      calculateProfitPerShare(s).toFixed(2),
      calculateProfit(s).toFixed(2),
      calculatePercentageGain(s).toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total Investment,$${totalInvestment.toFixed(2)}`,
      `Current Value,$${currentValue.toFixed(2)}`,
      `Total Profit,$${totalProfit.toFixed(2)},${totalProfitPercentage.toFixed(2)}%`
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shares-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
        {shares.length > 0 && (
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
                      Purchase Price
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
                <tbody className="divide-y divide-gray-200">
                  {shares.map((share) => {
                    const profitPerShare = calculateProfitPerShare(share);
                    const totalProfit = calculateProfit(share);
                    const percentageGain = calculatePercentageGain(share);
                    
                    return (
                      <tr key={share.id} className="hover:bg-gray-50">
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
                          <input
                            type="number"
                            step="0.01"
                            value={share.currentPrice}
                            onChange={(e) => handleUpdateCurrentPrice(share.id, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${profitPerShare >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${profitPerShare.toFixed(2)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${totalProfit.toFixed(2)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${percentageGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {percentageGain >= 0 ? '+' : ''}{percentageGain.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(share.purchaseDate).toLocaleDateString()}
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
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
