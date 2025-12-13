import { renderHook, act, waitFor } from '@testing-library/react';
import { useDividendCalculator } from './useDividendCalculator';
import * as storage from '../utils/storage';
import * as exchangeRates from '../utils/exchangeRates';

// Mock dependencies
jest.mock('../utils/storage');
jest.mock('../utils/exchangeRates');
jest.mock('../utils/taxCalculations', () => ({
  ...jest.requireActual('../utils/taxCalculations'),
}));

describe('useDividendCalculator', () => {
  const mockExchangeRates = {
    '2024-01-01': 1.1,
    '2024-01-15': 1.15,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.loadDividends as jest.Mock) = jest.fn().mockReturnValue([]);
    (storage.loadFromStorage as jest.Mock).mockReturnValue(true);
    (storage.saveToStorage as jest.Mock).mockImplementation(() => {});
    (exchangeRates.loadExchangeRates as jest.Mock).mockResolvedValue(mockExchangeRates);
    (exchangeRates.getDateRange as jest.Mock).mockReturnValue({
      min: '2024-01-01',
      max: '2024-01-15',
    });
    (exchangeRates.getExchangeRate as jest.Mock).mockImplementation((rates, date) => rates[date]);
    
    // Mock alert
    global.alert = jest.fn();
  });

  it('should initialize with empty dividends', async () => {
    const { result } = renderHook(() => useDividendCalculator());
    expect(result.current.dividends).toEqual([]);
    
    // Wait for async effects to complete
    await waitFor(() => {
      expect(exchangeRates.loadExchangeRates).toHaveBeenCalled();
    });
  });

  it('should load dividends from storage on mount', async () => {
    const storedDividends = [
      {
        id: '1',
        dollarAmount: 100,
        paymentDate: '2024-01-01',
        euroAmount: 90.91,
        exchangeRate: 1.1,
        usWithholdingRate: 15,
        usWithholdingAmount: 15,
        netAmountUSD: 85,
        netAmountEUR: 77.27,
      },
    ];
    (storage.loadDividends as jest.Mock).mockReturnValue(storedDividends);

    const { result } = renderHook(() => useDividendCalculator());
    
    await waitFor(() => {
      expect(result.current.dividends).toEqual(storedDividends);
    });
    
    // Wait for async effects to complete
    await waitFor(() => {
      expect(exchangeRates.loadExchangeRates).toHaveBeenCalled();
    });
  });

  it('should load exchange rates on mount', async () => {
    const { result } = renderHook(() => useDividendCalculator());

    await waitFor(() => {
      expect(result.current.dateRange).toEqual({
        min: '2024-01-01',
        max: '2024-01-15',
      });
    }, { timeout: 3000 });
  });

  it('should toggle form open/closed', async () => {
    const { result } = renderHook(() => useDividendCalculator());
    
    // Wait for initial mount effects
    await waitFor(() => {
      expect(exchangeRates.loadExchangeRates).toHaveBeenCalled();
    });
    
    const initialState = result.current.isFormOpen;
    
    act(() => {
      result.current.toggleForm();
    });
    
    expect(result.current.isFormOpen).toBe(!initialState);
    expect(storage.saveToStorage).toHaveBeenCalledWith('isFormOpen', !initialState);
  });

  it('should update form field values', async () => {
    const { result } = renderHook(() => useDividendCalculator());
    
    // Wait for initial mount effects
    await waitFor(() => {
      expect(exchangeRates.loadExchangeRates).toHaveBeenCalled();
    });
    
    act(() => {
      result.current.setDollarAmount('150.50');
    });
    expect(result.current.dollarAmount).toBe('150.50');

    act(() => {
      result.current.setPaymentDate('2024-01-10');
    });
    expect(result.current.paymentDate).toBe('2024-01-10');
  });

  it('should add a new dividend on form submit', async () => {
    (exchangeRates.getExchangeRate as jest.Mock).mockReturnValue(1.1);
    
    const { result } = renderHook(() => useDividendCalculator());
    
    // Wait for initial mount effects
    await waitFor(() => {
      expect(exchangeRates.loadExchangeRates).toHaveBeenCalled();
    });
    
    act(() => {
      result.current.setDollarAmount('100');
      result.current.setPaymentDate('2024-01-01');
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    
    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.dividends).toHaveLength(1);
    expect(result.current.dividends[0]).toMatchObject({
      dollarAmount: 100,
      paymentDate: '2024-01-01',
      euroAmount: 100 / 1.1,
      exchangeRate: 1.1,
    });
    expect(storage.saveToStorage).toHaveBeenCalledWith('dividends', expect.any(Array));
  });

  it('should clear form fields after successful submit', async () => {
    (exchangeRates.getExchangeRate as jest.Mock).mockReturnValue(1.1);
    
    const { result } = renderHook(() => useDividendCalculator());
    
    // Wait for initial mount effects
    await waitFor(() => {
      expect(exchangeRates.loadExchangeRates).toHaveBeenCalled();
    });
    
    act(() => {
      result.current.setDollarAmount('100');
      result.current.setPaymentDate('2024-01-01');
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    
    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(result.current.dollarAmount).toBe('');
    expect(result.current.paymentDate).toBe('');
  });

  it('should not add dividend if exchange rate is not available', async () => {
    (exchangeRates.getExchangeRate as jest.Mock).mockReturnValue(null);
    
    const { result } = renderHook(() => useDividendCalculator());
    
    // Wait for initial mount effects
    await waitFor(() => {
      expect(exchangeRates.loadExchangeRates).toHaveBeenCalled();
    });
    
    act(() => {
      result.current.setDollarAmount('100');
      result.current.setPaymentDate('2024-01-01');
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    
    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(global.alert).toHaveBeenCalledWith(
      'Exchange rate not available for this date. Please select a different date.'
    );
    expect(result.current.dividends).toHaveLength(0);
  });

  it('should not add dividend if dollar amount is invalid', async () => {
    const { result } = renderHook(() => useDividendCalculator());
    
    // Wait for initial mount effects
    await waitFor(() => {
      expect(exchangeRates.loadExchangeRates).toHaveBeenCalled();
    });
    
    act(() => {
      result.current.setDollarAmount('invalid');
      result.current.setPaymentDate('2024-01-01');
    });

    const mockEvent = { preventDefault: jest.fn() } as any;
    
    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(result.current.dividends).toHaveLength(0);
  });

  it('should delete a dividend', async () => {
    const storedDividends = [
      {
        id: '1',
        dollarAmount: 100,
        paymentDate: '2024-01-01',
        euroAmount: 90.91,
        exchangeRate: 1.1,
        usWithholdingRate: 15,
        usWithholdingAmount: 15,
        netAmountUSD: 85,
        netAmountEUR: 77.27,
      },
      {
        id: '2',
        dollarAmount: 200,
        paymentDate: '2024-01-15',
        euroAmount: 173.91,
        exchangeRate: 1.15,
        usWithholdingRate: 15,
        usWithholdingAmount: 30,
        netAmountUSD: 170,
        netAmountEUR: 147.83,
      },
    ];
    (storage.loadDividends as jest.Mock).mockReturnValue(storedDividends);

    const { result } = renderHook(() => useDividendCalculator());
    
    // Wait for initial mount effects
    await waitFor(() => {
      expect(exchangeRates.loadExchangeRates).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(result.current.dividends).toHaveLength(2);
    });
    
    act(() => {
      result.current.handleDelete('1');
    });

    expect(result.current.dividends).toHaveLength(1);
    expect(result.current.dividends[0].id).toBe('2');
    expect(storage.saveToStorage).toHaveBeenCalledWith('dividends', expect.any(Array));
  });

  it('should calculate total dollars correctly', async () => {
    const storedDividends = [
      {
        id: '1',
        dollarAmount: 100,
        paymentDate: '2024-01-01',
        euroAmount: 90.91,
        exchangeRate: 1.1,
        usWithholdingRate: 15,
        usWithholdingAmount: 15,
        netAmountUSD: 85,
        netAmountEUR: 77.27,
      },
      {
        id: '2',
        dollarAmount: 200,
        paymentDate: '2024-01-15',
        euroAmount: 173.91,
        exchangeRate: 1.15,
        usWithholdingRate: 15,
        usWithholdingAmount: 30,
        netAmountUSD: 170,
        netAmountEUR: 147.83,
      },
    ];
    (storage.loadDividends as jest.Mock).mockReturnValue(storedDividends);

    const { result } = renderHook(() => useDividendCalculator());
    
    // Wait for initial mount effects
    await waitFor(() => {
      expect(result.current.totalDollars).toBe(300);
    });
  });

  it('should calculate total euros correctly', async () => {
    const storedDividends = [
      {
        id: '1',
        dollarAmount: 100,
        paymentDate: '2024-01-01',
        euroAmount: 90.91,
        exchangeRate: 1.1,
        usWithholdingRate: 15,
        usWithholdingAmount: 15,
        netAmountUSD: 85,
        netAmountEUR: 77.27,
      },
      {
        id: '2',
        dollarAmount: 200,
        paymentDate: '2024-01-15',
        euroAmount: 173.91,
        exchangeRate: 1.15,
        usWithholdingRate: 15,
        usWithholdingAmount: 30,
        netAmountUSD: 170,
        netAmountEUR: 147.83,
      },
    ];
    (storage.loadDividends as jest.Mock).mockReturnValue(storedDividends);

    const { result } = renderHook(() => useDividendCalculator());
    
    // Wait for initial mount effects
    await waitFor(() => {
      expect(result.current.totalEuros).toBeCloseTo(264.82, 2);
    });
  });
});
