# Testing Documentation

This project uses Jest and React Testing Library for testing React components.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Files

### `app/hooks/useDividendCalculator.test.ts`
Tests for the custom hook that manages dividend calculator state:
- Loading data from storage
- Exchange rate loading
- Form state management
- Adding/deleting dividends
- Calculation of totals
- Form validation

### `app/page.test.tsx`
Tests for the main page component:
- Page structure and layout
- Form rendering and interactions
- Dividends table display
- CSV export functionality
- User interactions (form submission, delete, toggle)

## Test Coverage

The tests cover:
- Component rendering
- User interactions
- State management
- Form validation
- Data persistence
- Calculations
- Edge cases and error handling

## Mocking

Tests use mocked dependencies for:
- `localStorage` operations (via `utils/storage`)
- Exchange rate API calls (via `utils/exchangeRates`)
- Export utilities (via `utils/export`)

This ensures tests run quickly and reliably without external dependencies.
