import { loadExchangeRates, getDateRange, getExchangeRate } from './exchangeRates';
import type { ExchangeRates } from '../types';

describe('exchangeRates utilities', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('loadExchangeRates', () => {
    it('should load exchange rates successfully', async () => {
      const mockRates: ExchangeRates = {
        '2024-01-01': 1.1,
        '2024-01-02': 1.15,
        '2024-01-03': 1.12,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockRates,
      });

      const result = await loadExchangeRates();
      expect(result).toEqual(mockRates);
      expect(global.fetch).toHaveBeenCalledWith('/exchange-rates.json');
    });

    it('should return empty object when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await loadExchangeRates();
      expect(result).toEqual({});
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load exchange rates:',
        expect.any(Error)
      );
    });

    it('should return empty object when JSON parsing fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await loadExchangeRates();
      expect(result).toEqual({});
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load exchange rates:',
        expect.any(Error)
      );
    });

    it('should handle empty response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({}),
      });

      const result = await loadExchangeRates();
      expect(result).toEqual({});
    });
  });

  describe('getDateRange', () => {
    it('should return date range from rates object', () => {
      const rates: ExchangeRates = {
        '2024-03-15': 1.1,
        '2024-01-01': 1.15,
        '2024-12-31': 1.12,
        '2024-06-15': 1.13,
      };

      const result = getDateRange(rates);
      expect(result).toEqual({
        min: '2024-01-01',
        max: '2024-12-31',
      });
    });

    it('should return null for empty rates object', () => {
      const result = getDateRange({});
      expect(result).toBeNull();
    });

    it('should handle single date', () => {
      const rates: ExchangeRates = {
        '2024-01-01': 1.1,
      };

      const result = getDateRange(rates);
      expect(result).toEqual({
        min: '2024-01-01',
        max: '2024-01-01',
      });
    });

    it('should handle two dates', () => {
      const rates: ExchangeRates = {
        '2024-12-31': 1.12,
        '2024-01-01': 1.1,
      };

      const result = getDateRange(rates);
      expect(result).toEqual({
        min: '2024-01-01',
        max: '2024-12-31',
      });
    });

    it('should sort dates correctly', () => {
      const rates: ExchangeRates = {
        '2024-05-15': 1.1,
        '2024-02-20': 1.15,
        '2024-11-30': 1.12,
        '2024-01-01': 1.13,
      };

      const result = getDateRange(rates);
      expect(result).toEqual({
        min: '2024-01-01',
        max: '2024-11-30',
      });
    });
  });

  describe('getExchangeRate', () => {
    const rates: ExchangeRates = {
      '2024-01-01': 1.1,
      '2024-01-15': 1.15,
      '2024-02-01': 1.12,
    };

    it('should return exchange rate for valid date', () => {
      expect(getExchangeRate(rates, '2024-01-01')).toBe(1.1);
      expect(getExchangeRate(rates, '2024-01-15')).toBe(1.15);
      expect(getExchangeRate(rates, '2024-02-01')).toBe(1.12);
    });

    it('should return null for non-existent date', () => {
      expect(getExchangeRate(rates, '2024-03-01')).toBeNull();
      expect(getExchangeRate(rates, '2023-12-31')).toBeNull();
    });

    it('should return null for empty rates object', () => {
      expect(getExchangeRate({}, '2024-01-01')).toBeNull();
    });

    it('should return null for invalid date format', () => {
      expect(getExchangeRate(rates, 'invalid-date')).toBeNull();
      expect(getExchangeRate(rates, '')).toBeNull();
    });

    it('should handle rate value of zero', () => {
      const ratesWithZero: ExchangeRates = {
        '2024-01-01': 0,
      };
      expect(getExchangeRate(ratesWithZero, '2024-01-01')).toBe(0);
    });

    it('should handle negative rate values', () => {
      const ratesWithNegative: ExchangeRates = {
        '2024-01-01': -1.5,
      };
      expect(getExchangeRate(ratesWithNegative, '2024-01-01')).toBe(-1.5);
    });

    it('should handle decimal rate values', () => {
      const ratesWithDecimals: ExchangeRates = {
        '2024-01-01': 1.123456,
      };
      expect(getExchangeRate(ratesWithDecimals, '2024-01-01')).toBe(1.123456);
    });
  });
});
