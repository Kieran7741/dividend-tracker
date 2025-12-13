export interface Dividend {
  id: string;
  dollarAmount: number;
  euroAmount: number;
  paymentDate: string;
  exchangeRate: number;
  usWithholdingRate: number;
  usWithholdingAmount: number;
  euCountry?: string;
  euTaxRate?: number;
  irishMarginalRate?: number; // Irish marginal tax rate (24.5% or 52.0%)
  // Irish detailed fields (EUR)
  irishIncomeTax?: number;
  irishUSC?: number;
  irishPRSI?: number;
  euTaxAmount?: number; // total Irish tax before credit (for display)
  foreignTaxCredit?: number; // US credit against Income Tax only
  irishTaxPayableEur?: number; // total payable after credit
  netAmountUSD: number; // net USD received from broker (after US withholding only)
  netAmountEUR: number; // net EUR after paying Irish tax
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

export interface EUCountryTaxRate {
  code: string;
  name: string;
  rate: number;
}

export interface TaxConfig {
  usWithholdingRates: number[];
  euCountries: EUCountryTaxRate[];
}
