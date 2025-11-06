export interface Dividend {
  id: string;
  dollarAmount: number;
  euroAmount: number;
  paymentDate: string;
  exchangeRate: number;
}

export interface Share {
  id: string;
  ticker: string;
  sharesHeld: number;
  purchasePrice: number;
  purchaseDate: string;
}

export interface ExchangeRates {
  [date: string]: number;
}

export interface TickerPrice {
  [ticker: string]: number;
}

export interface DateRange {
  min: string;
  max: string;
}
