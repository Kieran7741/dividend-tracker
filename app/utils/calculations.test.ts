import {
  calculateTotalDollars,
  calculateTotalEuros,
  calculateProfitPerShare,
  calculateTotalProfit,
  calculatePercentageGain,
  calculateTotalInvestment,
  calculateCurrentValue,
  calculatePortfolioProfit,
  getPurchasePriceEur,
} from './calculations';
import type { Dividend, Share, ExchangeRates, TickerPrice } from '../types';

describe('calculations utilities', () => {
  describe('dividend calculations', () => {
    describe('calculateTotalDollars', () => {
      it('should calculate total dollars from dividends', () => {
        const dividends: Dividend[] = [
          { id: '1', dollarAmount: 100, euroAmount: 90, paymentDate: '2024-01-01', exchangeRate: 1.1 },
          { id: '2', dollarAmount: 200, euroAmount: 180, paymentDate: '2024-01-02', exchangeRate: 1.1 },
          { id: '3', dollarAmount: 50, euroAmount: 45, paymentDate: '2024-01-03', exchangeRate: 1.1 },
        ];

        expect(calculateTotalDollars(dividends)).toBe(350);
      });

      it('should return 0 for empty array', () => {
        expect(calculateTotalDollars([])).toBe(0);
      });

      it('should handle single dividend', () => {
        const dividends: Dividend[] = [
          { id: '1', dollarAmount: 123.45, euroAmount: 100, paymentDate: '2024-01-01', exchangeRate: 1.1 },
        ];

        expect(calculateTotalDollars(dividends)).toBe(123.45);
      });

      it('should handle decimal values', () => {
        const dividends: Dividend[] = [
          { id: '1', dollarAmount: 10.5, euroAmount: 9, paymentDate: '2024-01-01', exchangeRate: 1.1 },
          { id: '2', dollarAmount: 20.75, euroAmount: 18, paymentDate: '2024-01-02', exchangeRate: 1.1 },
        ];

        expect(calculateTotalDollars(dividends)).toBe(31.25);
      });
    });

    describe('calculateTotalEuros', () => {
      it('should calculate total euros from dividends', () => {
        const dividends: Dividend[] = [
          { id: '1', dollarAmount: 100, euroAmount: 90.91, paymentDate: '2024-01-01', exchangeRate: 1.1 },
          { id: '2', dollarAmount: 200, euroAmount: 181.82, paymentDate: '2024-01-02', exchangeRate: 1.1 },
          { id: '3', dollarAmount: 50, euroAmount: 45.45, paymentDate: '2024-01-03', exchangeRate: 1.1 },
        ];

        expect(calculateTotalEuros(dividends)).toBeCloseTo(318.18, 2);
      });

      it('should return 0 for empty array', () => {
        expect(calculateTotalEuros([])).toBe(0);
      });

      it('should handle single dividend', () => {
        const dividends: Dividend[] = [
          { id: '1', dollarAmount: 100, euroAmount: 85.5, paymentDate: '2024-01-01', exchangeRate: 1.1 },
        ];

        expect(calculateTotalEuros(dividends)).toBe(85.5);
      });
    });
  });

  describe('share calculations', () => {
    describe('calculateProfitPerShare', () => {
      it('should calculate profit per share with gain', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 150,
          purchaseDate: '2024-01-01',
        };

        expect(calculateProfitPerShare(share, 200)).toBe(50);
      });

      it('should calculate profit per share with loss', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 150,
          purchaseDate: '2024-01-01',
        };

        expect(calculateProfitPerShare(share, 100)).toBe(-50);
      });

      it('should return 0 for no change in price', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 150,
          purchaseDate: '2024-01-01',
        };

        expect(calculateProfitPerShare(share, 150)).toBe(0);
      });

      it('should handle decimal prices', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 123.45,
          purchaseDate: '2024-01-01',
        };

        expect(calculateProfitPerShare(share, 145.67)).toBeCloseTo(22.22, 2);
      });
    });

    describe('calculateTotalProfit', () => {
      it('should calculate total profit with gain', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 150,
          purchaseDate: '2024-01-01',
        };

        expect(calculateTotalProfit(share, 200)).toBe(500);
      });

      it('should calculate total profit with loss', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 150,
          purchaseDate: '2024-01-01',
        };

        expect(calculateTotalProfit(share, 100)).toBe(-500);
      });

      it('should handle fractional shares', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 2.5,
          purchasePrice: 100,
          purchaseDate: '2024-01-01',
        };

        expect(calculateTotalProfit(share, 150)).toBe(125);
      });
    });

    describe('calculatePercentageGain', () => {
      it('should calculate percentage gain', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 100,
          purchaseDate: '2024-01-01',
        };

        expect(calculatePercentageGain(share, 150)).toBe(50);
      });

      it('should calculate percentage loss', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 100,
          purchaseDate: '2024-01-01',
        };

        expect(calculatePercentageGain(share, 75)).toBe(-25);
      });

      it('should return 0 for no change', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 100,
          purchaseDate: '2024-01-01',
        };

        expect(calculatePercentageGain(share, 100)).toBe(0);
      });

      it('should calculate percentage for large gains', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 50,
          purchaseDate: '2024-01-01',
        };

        expect(calculatePercentageGain(share, 150)).toBe(200);
      });

      it('should handle decimal percentages', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 100,
          purchaseDate: '2024-01-01',
        };

        expect(calculatePercentageGain(share, 110.5)).toBeCloseTo(10.5, 1);
      });
    });

    describe('calculateTotalInvestment', () => {
      it('should calculate total investment for multiple shares', () => {
        const shares: Share[] = [
          { id: '1', ticker: 'AAPL', sharesHeld: 10, purchasePrice: 150, purchaseDate: '2024-01-01' },
          { id: '2', ticker: 'GOOGL', sharesHeld: 5, purchasePrice: 2000, purchaseDate: '2024-01-02' },
          { id: '3', ticker: 'MSFT', sharesHeld: 20, purchasePrice: 300, purchaseDate: '2024-01-03' },
        ];

        expect(calculateTotalInvestment(shares)).toBe(17500);
      });

      it('should return 0 for empty array', () => {
        expect(calculateTotalInvestment([])).toBe(0);
      });

      it('should handle single share', () => {
        const shares: Share[] = [
          { id: '1', ticker: 'AAPL', sharesHeld: 10, purchasePrice: 150, purchaseDate: '2024-01-01' },
        ];

        expect(calculateTotalInvestment(shares)).toBe(1500);
      });

      it('should handle fractional shares', () => {
        const shares: Share[] = [
          { id: '1', ticker: 'AAPL', sharesHeld: 2.5, purchasePrice: 100, purchaseDate: '2024-01-01' },
        ];

        expect(calculateTotalInvestment(shares)).toBe(250);
      });
    });

    describe('calculateCurrentValue', () => {
      it('should calculate current value for multiple shares', () => {
        const shares: Share[] = [
          { id: '1', ticker: 'AAPL', sharesHeld: 10, purchasePrice: 150, purchaseDate: '2024-01-01' },
          { id: '2', ticker: 'GOOGL', sharesHeld: 5, purchasePrice: 2000, purchaseDate: '2024-01-02' },
          { id: '3', ticker: 'MSFT', sharesHeld: 20, purchasePrice: 300, purchaseDate: '2024-01-03' },
        ];

        const tickerPrices: TickerPrice = {
          AAPL: 200,
          GOOGL: 2500,
          MSFT: 350,
        };

        expect(calculateCurrentValue(shares, tickerPrices)).toBe(21500);
      });

      it('should return 0 for empty shares array', () => {
        expect(calculateCurrentValue([], { AAPL: 200 })).toBe(0);
      });

      it('should handle missing ticker prices', () => {
        const shares: Share[] = [
          { id: '1', ticker: 'AAPL', sharesHeld: 10, purchasePrice: 150, purchaseDate: '2024-01-01' },
          { id: '2', ticker: 'GOOGL', sharesHeld: 5, purchasePrice: 2000, purchaseDate: '2024-01-02' },
        ];

        const tickerPrices: TickerPrice = {
          AAPL: 200,
        };

        expect(calculateCurrentValue(shares, tickerPrices)).toBe(2000);
      });

      it('should handle empty ticker prices object', () => {
        const shares: Share[] = [
          { id: '1', ticker: 'AAPL', sharesHeld: 10, purchasePrice: 150, purchaseDate: '2024-01-01' },
        ];

        expect(calculateCurrentValue(shares, {})).toBe(0);
      });

      it('should handle fractional shares', () => {
        const shares: Share[] = [
          { id: '1', ticker: 'AAPL', sharesHeld: 2.5, purchasePrice: 100, purchaseDate: '2024-01-01' },
        ];

        const tickerPrices: TickerPrice = {
          AAPL: 150,
        };

        expect(calculateCurrentValue(shares, tickerPrices)).toBe(375);
      });
    });

    describe('calculatePortfolioProfit', () => {
      it('should calculate portfolio profit with gain', () => {
        const shares: Share[] = [
          { id: '1', ticker: 'AAPL', sharesHeld: 10, purchasePrice: 150, purchaseDate: '2024-01-01' },
          { id: '2', ticker: 'GOOGL', sharesHeld: 5, purchasePrice: 2000, purchaseDate: '2024-01-02' },
        ];

        const tickerPrices: TickerPrice = {
          AAPL: 200,
          GOOGL: 2500,
        };

        const result = calculatePortfolioProfit(shares, tickerPrices);
        expect(result.totalProfit).toBe(3000);
        expect(result.totalProfitPercentage).toBeCloseTo(26.09, 2);
      });

      it('should calculate portfolio profit with loss', () => {
        const shares: Share[] = [
          { id: '1', ticker: 'AAPL', sharesHeld: 10, purchasePrice: 150, purchaseDate: '2024-01-01' },
        ];

        const tickerPrices: TickerPrice = {
          AAPL: 100,
        };

        const result = calculatePortfolioProfit(shares, tickerPrices);
        expect(result.totalProfit).toBe(-500);
        expect(result.totalProfitPercentage).toBeCloseTo(-33.33, 2);
      });

      it('should return zero profit for no change', () => {
        const shares: Share[] = [
          { id: '1', ticker: 'AAPL', sharesHeld: 10, purchasePrice: 150, purchaseDate: '2024-01-01' },
        ];

        const tickerPrices: TickerPrice = {
          AAPL: 150,
        };

        const result = calculatePortfolioProfit(shares, tickerPrices);
        expect(result.totalProfit).toBe(0);
        expect(result.totalProfitPercentage).toBe(0);
      });

      it('should return 0 percentage for empty portfolio', () => {
        const result = calculatePortfolioProfit([], {});
        expect(result.totalProfit).toBe(0);
        expect(result.totalProfitPercentage).toBe(0);
      });

      it('should handle missing ticker prices', () => {
        const shares: Share[] = [
          { id: '1', ticker: 'AAPL', sharesHeld: 10, purchasePrice: 150, purchaseDate: '2024-01-01' },
          { id: '2', ticker: 'GOOGL', sharesHeld: 5, purchasePrice: 2000, purchaseDate: '2024-01-02' },
        ];

        const tickerPrices: TickerPrice = {
          AAPL: 200,
        };

        const result = calculatePortfolioProfit(shares, tickerPrices);
        expect(result.totalProfit).toBe(-9500);
        expect(result.totalProfitPercentage).toBeCloseTo(-82.61, 2);
      });
    });

    describe('getPurchasePriceEur', () => {
      it('should calculate purchase price in euros', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 150,
          purchaseDate: '2024-01-01',
        };

        const exchangeRates: ExchangeRates = {
          '2024-01-01': 1.1,
        };

        expect(getPurchasePriceEur(share, exchangeRates)).toBeCloseTo(136.36, 2);
      });

      it('should return null when exchange rate is not available', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 150,
          purchaseDate: '2024-01-01',
        };

        const exchangeRates: ExchangeRates = {
          '2024-01-02': 1.1,
        };

        expect(getPurchasePriceEur(share, exchangeRates)).toBeNull();
      });

      it('should return null for empty exchange rates', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 150,
          purchaseDate: '2024-01-01',
        };

        expect(getPurchasePriceEur(share, {})).toBeNull();
      });

      it('should handle different exchange rates', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 200,
          purchaseDate: '2024-01-01',
        };

        const exchangeRates: ExchangeRates = {
          '2024-01-01': 1.25,
        };

        expect(getPurchasePriceEur(share, exchangeRates)).toBe(160);
      });

      it('should handle decimal purchase prices', () => {
        const share: Share = {
          id: '1',
          ticker: 'AAPL',
          sharesHeld: 10,
          purchasePrice: 123.45,
          purchaseDate: '2024-01-01',
        };

        const exchangeRates: ExchangeRates = {
          '2024-01-01': 1.15,
        };

        expect(getPurchasePriceEur(share, exchangeRates)).toBeCloseTo(107.35, 2);
      });
    });
  });
});
