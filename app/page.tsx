'use client';

import Link from 'next/link';
import { useDividendCalculator } from './hooks/useDividendCalculator';
import { downloadCSV, formatDate, getCurrentDateString } from './utils/export';
import WarningBanner from './components/WarningBanner';

export default function Home() {
  const {
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
    totalNetUSD,
    totalNetEUR,
    totalIrishPayable,
    euCountryRates,
    setDollarAmount,
    setPaymentDate,
    setUsWithholdingRate,
    setEuCountry,
    setIrishMarginalRate,
    toggleForm,
    handleSubmit,
    handleDelete,
  } = useDividendCalculator();

  const handleExport = () => {
    const headers = [
      'Payment Date',
      'Gross USD',
      'Exchange Rate',
      'Gross EUR',
      'US Withholding Rate',
      'US Withholding Amount',
      'EU Country',
      'Irish Marginal Rate',
      'Irish Tax Liability (EUR)',
      'Foreign Tax Credit (EUR)',
      'Net USD',
      'Net EUR'
    ];
    const rows = dividends.map(d => [
      formatDate(d.paymentDate),
      d.dollarAmount.toFixed(2),
      d.exchangeRate.toFixed(4),
      d.euroAmount.toFixed(2),
      `${d.usWithholdingRate}%`,
      d.usWithholdingAmount.toFixed(2),
      d.euCountry || '',
      d.irishMarginalRate ? `${d.irishMarginalRate}%` : '',
      d.euTaxAmount ? d.euTaxAmount.toFixed(2) : '',
      d.foreignTaxCredit ? d.foreignTaxCredit.toFixed(2) : '',
      d.netAmountUSD.toFixed(2),
      d.netAmountEUR.toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total,${totalDollars.toFixed(2)},,${totalEuros.toFixed(2)},,,,,,,${totalNetUSD.toFixed(2)},${totalNetEUR.toFixed(2)}`
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
        
        <WarningBanner />

        <h2 className="text-3xl font-bold mb-2 text-gray-900">Dividend Tax Calculator</h2>
        <p className="text-gray-600 mb-8">
          Track your US dividend payments with accurate Irish tax calculations. Calculates US withholding tax (15% with treaty, 30% without), Irish tax liability at your marginal rate (20%/40% Income Tax + PRSI + USC), and foreign tax credit relief. All amounts use official ECB exchange rates. Note: all data is stored locally in your browser.
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
                  <p className="mt-1 text-xs text-gray-500">
                    {dateRange 
                      ? `Exchange rates available from ${formatDate(dateRange.min)} to ${formatDate(dateRange.max)}`
                      : 'Exchange rates available from 04/01/1999 to 12/12/2025'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    US Withholding Tax Rate
                  </label>
                  <select
                    value={usWithholdingRate}
                    onChange={(e) => setUsWithholdingRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value={15}>15% (with tax treaty)</option>
                    <option value={30}>30% (without tax treaty)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EU Country (Optional)
                  </label>
                  <select
                    value={euCountry}
                    onChange={(e) => setEuCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">None</option>
                    {euCountryRates.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.rate}%)
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select Ireland to calculate Irish tax liability with proper marginal rate and foreign tax credit
                  </p>
                </div>
                {euCountry === 'IE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Irish Tax Rate
                    </label>
                    <select
                      value={irishMarginalRate}
                      onChange={(e) => setIrishMarginalRate(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value={52}>Higher rate taxpayer (52.0% = 40% IT + 4% PRSI + 8% USC)</option>
                      <option value={24.5}>Standard rate taxpayer (24.5% = 20% IT + 4% PRSI + 0.5% USC)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Your Irish tax liability will be calculated at your marginal rate, with credit for US withholding tax
                    </p>
                  </div>
                )}
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
        {mounted && dividends.length > 0 && (
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross USD
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      US Tax
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Irish Tax
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net USD
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net EUR
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dividends.map((dividend) => (
                    <tr key={dividend.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(dividend.paymentDate)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ${dividend.dollarAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ${dividend.usWithholdingAmount.toFixed(2)}
                        <span className="text-xs text-gray-500 ml-1">({dividend.usWithholdingRate}%)</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {dividend.irishTaxPayableEur != null ? (
                          (() => {
                            const incomeTax = dividend.irishIncomeTax ?? 0;
                            const credit = dividend.foreignTaxCredit ?? 0;
                            const incomeAfterCredit = Math.max(0, incomeTax - credit);
                            const usc = dividend.irishUSC ?? 0;
                            const prsi = dividend.irishPRSI ?? 0;
                            const total = dividend.irishTaxPayableEur ?? incomeAfterCredit + usc + prsi;
                            const tooltip = `Irish tax payable = (Income Tax €${incomeTax.toFixed(2)} − Credit €${credit.toFixed(2)}) + USC €${usc.toFixed(2)} + PRSI €${prsi.toFixed(2)} = €${total.toFixed(2)}`;
                            return (
                              <span
                                className="underline decoration-dotted cursor-help"
                                title={tooltip}
                              >
                                €{total.toFixed(2)}
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        ${dividend.netAmountUSD.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        €{dividend.netAmountEUR.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      Total
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      ${totalDollars.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      ${totalUSWithholding.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {totalIrishPayable > 0 ? `€${totalIrishPayable.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      ${totalNetUSD.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      €{totalNetEUR.toFixed(2)}
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
