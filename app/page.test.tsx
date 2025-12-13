import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './page';
import { useDividendCalculator } from './hooks/useDividendCalculator';
import * as exportUtils from './utils/export';

// Mock the custom hook
jest.mock('./hooks/useDividendCalculator');

// Mock the export utilities
jest.mock('./utils/export', () => ({
  downloadCSV: jest.fn(),
  formatDate: jest.fn((date) => date),
  getCurrentDateString: jest.fn(() => '2024-01-01'),
}));

describe('Home Component', () => {
  const mockUseDividendCalculator = useDividendCalculator as jest.MockedFunction<typeof useDividendCalculator>;

  const defaultHookReturn = {
    dividends: [],
    dollarAmount: '',
    paymentDate: '',
    isFormOpen: true,
    dateRange: { min: '2024-01-01', max: '2024-12-31' },
    totalDollars: 0,
    totalEuros: 0,
    setDollarAmount: jest.fn(),
    setPaymentDate: jest.fn(),
    toggleForm: jest.fn(),
    handleSubmit: jest.fn(),
    handleDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDividendCalculator.mockReturnValue(defaultHookReturn);
  });

  describe('Page Structure', () => {
    it('should render the page title', () => {
      render(<Home />);
      expect(screen.getByText('Gross Dividend Calculator')).toBeInTheDocument();
    });

    it('should render the page description', () => {
      render(<Home />);
      expect(screen.getByText(/Track your USD dividend payments/)).toBeInTheDocument();
    });

    it('should render link to shares page', () => {
      render(<Home />);
      const link = screen.getByText('View Share Holdings →');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/shares');
    });
  });

  describe('Form Section', () => {
    it('should render the form when isFormOpen is true', () => {
      render(<Home />);
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
      expect(screen.getByText('Amount (USD)')).toBeInTheDocument();
      expect(screen.getByText('Payment Date')).toBeInTheDocument();
    });

    it('should not render the form when isFormOpen is false', () => {
      mockUseDividendCalculator.mockReturnValue({
        ...defaultHookReturn,
        isFormOpen: false,
      });
      render(<Home />);
      expect(screen.queryByPlaceholderText('0.00')).not.toBeInTheDocument();
    });

    it('should call toggleForm when clicking the toggle button', () => {
      const toggleForm = jest.fn();
      mockUseDividendCalculator.mockReturnValue({
        ...defaultHookReturn,
        toggleForm,
      });

      render(<Home />);
      const toggleButton = screen.getByRole('button', { name: /Add Dividend Payment/i });
      fireEvent.click(toggleButton);

      expect(toggleForm).toHaveBeenCalledTimes(1);
    });

    it('should display date range helper text', () => {
      render(<Home />);
      expect(screen.getByText(/Exchange rates available from/)).toBeInTheDocument();
    });

    it('should call setDollarAmount when amount input changes', async () => {
      const setDollarAmount = jest.fn();
      mockUseDividendCalculator.mockReturnValue({
        ...defaultHookReturn,
        setDollarAmount,
      });

      render(<Home />);
      const input = screen.getByPlaceholderText('0.00');
      
      await userEvent.type(input, '100.50');

      expect(setDollarAmount).toHaveBeenCalled();
    });

    it('should call setPaymentDate when date input changes', async () => {
      const setPaymentDate = jest.fn();
      mockUseDividendCalculator.mockReturnValue({
        ...defaultHookReturn,
        setPaymentDate,
      });

      render(<Home />);
      const container = screen.getByText('Payment Date').parentElement;
      const dateInput = container?.querySelector('input[type="date"]');
      
      if (dateInput) {
        fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
      }

      expect(setPaymentDate).toHaveBeenCalled();
    });

    it('should call handleSubmit when form is submitted', () => {
      const handleSubmit = jest.fn();
      mockUseDividendCalculator.mockReturnValue({
        ...defaultHookReturn,
        handleSubmit,
      });

      render(<Home />);
      const form = screen.getByPlaceholderText('0.00').closest('form');
      
      fireEvent.submit(form!);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dividends Table', () => {
    const mockDividends = [
      {
        id: '1',
        dollarAmount: 100,
        paymentDate: '2024-01-01',
        euroAmount: 90.91,
        exchangeRate: 1.1,
      },
      {
        id: '2',
        dollarAmount: 200,
        paymentDate: '2024-01-15',
        euroAmount: 173.91,
        exchangeRate: 1.15,
      },
    ];

    it('should not render table when no dividends exist', () => {
      render(<Home />);
      expect(screen.queryByText('Dividend Payments')).not.toBeInTheDocument();
    });

    it('should render table when dividends exist', () => {
      mockUseDividendCalculator.mockReturnValue({
        ...defaultHookReturn,
        dividends: mockDividends,
        totalDollars: 300,
        totalEuros: 264.82,
      });

      render(<Home />);
      expect(screen.getByText('Dividend Payments')).toBeInTheDocument();
    });

    it('should display all dividends in the table', () => {
      mockUseDividendCalculator.mockReturnValue({
        ...defaultHookReturn,
        dividends: mockDividends,
        totalDollars: 300,
        totalEuros: 264.82,
      });

      render(<Home />);
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('$200.00')).toBeInTheDocument();
      expect(screen.getByText('1.1000')).toBeInTheDocument();
      expect(screen.getByText('1.1500')).toBeInTheDocument();
    });

    it('should display totals correctly', () => {
      mockUseDividendCalculator.mockReturnValue({
        ...defaultHookReturn,
        dividends: mockDividends,
        totalDollars: 300,
        totalEuros: 264.82,
      });

      render(<Home />);
      expect(screen.getByText('$300.00')).toBeInTheDocument();
      expect(screen.getByText('€264.82')).toBeInTheDocument();
    });

    it('should call handleDelete when delete button is clicked', () => {
      const handleDelete = jest.fn();
      mockUseDividendCalculator.mockReturnValue({
        ...defaultHookReturn,
        dividends: mockDividends,
        handleDelete,
      });

      render(<Home />);
      const deleteButtons = screen.getAllByText('Delete');
      
      fireEvent.click(deleteButtons[0]);

      expect(handleDelete).toHaveBeenCalledWith('1');
    });

    it('should render Export CSV button when dividends exist', () => {
      mockUseDividendCalculator.mockReturnValue({
        ...defaultHookReturn,
        dividends: mockDividends,
      });

      render(<Home />);
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });
  });

  describe('CSV Export', () => {
    const mockDividends = [
      {
        id: '1',
        dollarAmount: 100,
        paymentDate: '2024-01-01',
        euroAmount: 90.91,
        exchangeRate: 1.1,
      },
    ];

    it('should call downloadCSV when export button is clicked', async () => {
      mockUseDividendCalculator.mockReturnValue({
        ...defaultHookReturn,
        dividends: mockDividends,
        totalDollars: 100,
        totalEuros: 90.91,
      });

      render(<Home />);
      const exportButton = screen.getByText('Export CSV');
      
      fireEvent.click(exportButton);

      expect(exportUtils.downloadCSV).toHaveBeenCalled();
      const downloadCSVMock = exportUtils.downloadCSV as jest.Mock;
      const [csvContent, filename] = downloadCSVMock.mock.calls[0];
      expect(csvContent).toContain('Payment Date');
      expect(csvContent).toContain('USD Amount');
      expect(filename).toContain('.csv');
    });
  });
});
