import {
  calculateUSWithholding,
  calculateEUTax,
  calculateIrishTax,
  calculateForeignTaxCredit,
  calculateNetDividend,
  getTotalUSWithholding,
  getTotalEUTax,
  getTotalForeignTaxCredit,
  getTotalNetDividendsUSD,
  getTotalNetDividendsEUR,
  getTotalTaxPaid,
  getEUCountryRate,
  US_WITHHOLDING_WITH_TREATY,
  US_WITHHOLDING_WITHOUT_TREATY,
} from './taxCalculations';
import type { Dividend } from '../types';

describe('Tax Calculations', () => {
  describe('calculateUSWithholding', () => {
    it('calculates 15% withholding correctly', () => {
      expect(calculateUSWithholding(100, 15)).toBe(15);
      expect(calculateUSWithholding(250, 15)).toBe(37.5);
    });

    it('calculates 30% withholding correctly', () => {
      expect(calculateUSWithholding(100, 30)).toBe(30);
      expect(calculateUSWithholding(250, 30)).toBe(75);
    });

    it('handles zero amount', () => {
      expect(calculateUSWithholding(0, 15)).toBe(0);
    });

    it('handles decimal amounts', () => {
      expect(calculateUSWithholding(123.45, 15)).toBeCloseTo(18.52, 2);
    });
  });

  describe('calculateEUTax', () => {
    it('calculates EU tax correctly', () => {
      // $100 at rate of 1.1 USD/EUR = €90.91
      // 25% tax = €22.73
      const result = calculateEUTax(100, 25, 1.1);
      expect(result).toBeCloseTo(22.73, 2);
    });

    it('handles different exchange rates', () => {
      const result = calculateEUTax(100, 30, 1.2);
      expect(result).toBeCloseTo(25, 2);
    });

    it('handles zero tax rate', () => {
      expect(calculateEUTax(100, 0, 1.1)).toBe(0);
    });

    it('handles zero amount', () => {
      expect(calculateEUTax(0, 25, 1.1)).toBe(0);
    });
  });

  describe('calculateIrishTax', () => {
    it('calculates Irish tax for higher rate taxpayer correctly', () => {
      // $100 dividend, $15 US withholding, exchange rate 1.1
      // €90.91 gross, Irish tax @ 52.1% = €47.36
      // US withholding in EUR = €13.64
      // Foreign tax credit = min(€13.64, €47.36) = €13.64
      // Net Irish tax = €47.36 - €13.64 = €33.72
      const result = calculateIrishTax(100, 15, 52.0, 1.1);
      expect(result.irishTaxLiability).toBeCloseTo(47.27, 1);
      expect(result.foreignTaxCredit).toBeCloseTo(13.64, 1);
      expect(result.netIrishTax).toBeCloseTo(33.64, 1);
    });

    it('calculates Irish tax for standard rate taxpayer correctly', () => {
      // $100 dividend, $15 US withholding, exchange rate 1.1
      // €90.91 gross, Irish tax @ 24.6% = €22.36
      // US withholding in EUR = €13.64
      // Foreign tax credit = min(€13.64, €22.36) = €13.64
      // Net Irish tax = €22.36 - €13.64 = €8.72
      const result = calculateIrishTax(100, 15, 24.5, 1.1);
      expect(result.irishTaxLiability).toBeCloseTo(22.27, 1);
      expect(result.foreignTaxCredit).toBeCloseTo(13.64, 1);
      expect(result.netIrishTax).toBeCloseTo(8.64, 1);
    });

    it('limits foreign tax credit to Irish tax liability', () => {
      // $100 dividend, $30 US withholding (no treaty), exchange rate 1.1
      // €90.91 gross, Irish tax @ 24.6% = €22.36
      // US withholding in EUR = €27.27
      // Foreign tax credit = min(€27.27, €22.36) = €22.36
      // Net Irish tax = €22.36 - €22.36 = €0 (fully covered)
      const result = calculateIrishTax(100, 30, 24.5, 1.1);
      expect(result.irishTaxLiability).toBeCloseTo(22.27, 2);
      expect(result.foreignTaxCredit).toBeCloseTo(18.18, 2);
      expect(result.netIrishTax).toBeCloseTo(4.09, 2);
    });
  });

  describe('calculateForeignTaxCredit', () => {
    it('returns the lesser of US withholding and domestic tax', () => {
      expect(calculateForeignTaxCredit(15, 25)).toBe(15);
      expect(calculateForeignTaxCredit(30, 20)).toBe(20);
    });

    it('handles equal amounts', () => {
      expect(calculateForeignTaxCredit(20, 20)).toBe(20);
    });

    it('handles zero amounts', () => {
      expect(calculateForeignTaxCredit(0, 25)).toBe(0);
      expect(calculateForeignTaxCredit(15, 0)).toBe(0);
    });
  });

  describe('calculateNetDividend', () => {
    it('calculates net after US withholding only', () => {
      const result = calculateNetDividend(100, 15);
      expect(result).toBe(85);
    });

    it('calculates net after US withholding and EU tax', () => {
      const result = calculateNetDividend(100, 15, 25);
      expect(result).toBe(60);
    });

    it('applies foreign tax credit correctly', () => {
      // $100 - $15 US withholding - ($25 EU tax - $15 credit) = $75
      const result = calculateNetDividend(100, 15, 25, 15);
      expect(result).toBe(75);
    });

    it('does not give negative EU tax when credit exceeds EU tax', () => {
      // $100 - $15 US withholding - max(0, $10 EU tax - $15 credit) = $85
      const result = calculateNetDividend(100, 15, 10, 15);
      expect(result).toBe(85);
    });

    it('handles zero amounts', () => {
      expect(calculateNetDividend(0, 0)).toBe(0);
    });
  });

  describe('Aggregation functions', () => {
    const mockDividends: Dividend[] = [
      {
        id: '1',
        dollarAmount: 100,
        euroAmount: 90,
        paymentDate: '2024-01-01',
        exchangeRate: 1.1,
        usWithholdingRate: 15,
        usWithholdingAmount: 15,
        euCountry: 'IE',
        euTaxRate: 25,
        euTaxAmount: 22.5,
        foreignTaxCredit: 15,
        netAmountUSD: 77.5,
        netAmountEUR: 70,
      },
      {
        id: '2',
        dollarAmount: 200,
        euroAmount: 180,
        paymentDate: '2024-02-01',
        exchangeRate: 1.1,
        usWithholdingRate: 15,
        usWithholdingAmount: 30,
        netAmountUSD: 170,
        netAmountEUR: 154,
      },
      {
        id: '3',
        dollarAmount: 150,
        euroAmount: 135,
        paymentDate: '2024-03-01',
        exchangeRate: 1.1,
        usWithholdingRate: 30,
        usWithholdingAmount: 45,
        euCountry: 'DE',
        euTaxRate: 26.375,
        euTaxAmount: 32.34,
        foreignTaxCredit: 32.34,
        netAmountUSD: 105,
        netAmountEUR: 95,
      },
    ];

    describe('getTotalUSWithholding', () => {
      it('calculates total US withholding', () => {
        expect(getTotalUSWithholding(mockDividends)).toBe(90);
      });

      it('handles empty array', () => {
        expect(getTotalUSWithholding([])).toBe(0);
      });
    });

    describe('getTotalEUTax', () => {
      it('calculates total EU tax', () => {
        expect(getTotalEUTax(mockDividends)).toBeCloseTo(54.84, 2);
      });

      it('handles missing EU tax fields', () => {
        const dividends: Dividend[] = [mockDividends[1]];
        expect(getTotalEUTax(dividends)).toBe(0);
      });
    });

    describe('getTotalForeignTaxCredit', () => {
      it('calculates total foreign tax credit', () => {
        expect(getTotalForeignTaxCredit(mockDividends)).toBeCloseTo(47.34, 2);
      });

      it('handles missing credit fields', () => {
        const dividends: Dividend[] = [mockDividends[1]];
        expect(getTotalForeignTaxCredit(dividends)).toBe(0);
      });
    });

    describe('getTotalNetDividendsUSD', () => {
      it('calculates total net dividends in USD', () => {
        expect(getTotalNetDividendsUSD(mockDividends)).toBe(352.5);
      });
    });

    describe('getTotalNetDividendsEUR', () => {
      it('calculates total net dividends in EUR', () => {
        expect(getTotalNetDividendsEUR(mockDividends)).toBe(319);
      });
    });

    describe('getTotalTaxPaid', () => {
      it('calculates total tax paid correctly', () => {
        // Dividend 1: 15 + max(0, 22.5 - 15) = 15 + 7.5 = 22.5
        // Dividend 2: 30 + max(0, 0 - 0) = 30
        // Dividend 3: 45 + max(0, 32.34 - 32.34) = 45
        // Total: 97.5
        expect(getTotalTaxPaid(mockDividends)).toBeCloseTo(97.5, 2);
      });

      it('handles empty array', () => {
        expect(getTotalTaxPaid([])).toBe(0);
      });
    });
  });

  describe('getEUCountryRate', () => {
    it('returns correct rate for Ireland', () => {
      expect(getEUCountryRate('IE')).toBe(25);
    });

    it('returns null for unknown country', () => {
      expect(getEUCountryRate('XX')).toBeNull();
      expect(getEUCountryRate('US')).toBeNull();
      expect(getEUCountryRate('DE')).toBeNull();
    });
  });

  describe('Constants', () => {
    it('defines correct US withholding rates', () => {
      expect(US_WITHHOLDING_WITH_TREATY).toBe(15);
      expect(US_WITHHOLDING_WITHOUT_TREATY).toBe(30);
    });
  });
});
