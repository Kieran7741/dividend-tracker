import type { Dividend, EUCountryTaxRate } from "../types"

// US withholding tax rates
export const US_WITHHOLDING_WITH_TREATY = 15 // 15% with tax treaty
export const US_WITHHOLDING_WITHOUT_TREATY = 30 // 30% without tax treaty

// Irish Dividend Withholding Tax (DWT)
export const IRISH_DWT_RATE = 25; // 25% DWT on Irish dividends

// Irish marginal tax rates (Income Tax + PRSI + USC)
// Standard rate taxpayer: 20% Income Tax + 4.1% PRSI + 0.5% USC = 24.6%
// Higher rate taxpayer: 40% Income Tax + 4.1% PRSI + 8% USC = 52.1%
export const IRISH_STANDARD_RATE = 24.5; // 20% IT + 4% PRSI + 0.5% USC (simplified)
export const IRISH_HIGHER_RATE = 52.0; // 40% IT + 4% PRSI + 8% USC (per example)

export const EU_COUNTRY_TAX_RATES: EUCountryTaxRate[] = [
  { code: "IE", name: "Ireland", rate: IRISH_DWT_RATE },
]

/**
 * Calculate US withholding tax amount
 */
export function calculateUSWithholding(
  dollarAmount: number,
  withholdingRate: number
): number {
  return (dollarAmount * withholdingRate) / 100
}

/**
 * Calculate EU country tax amount on the gross dividend
 */
export function calculateEUTax(
  dollarAmount: number,
  euTaxRate: number,
  exchangeRate: number
): number {
  const euroAmount = dollarAmount / exchangeRate
  return (euroAmount * euTaxRate) / 100
}

/**
 * Calculate Irish tax on US dividends with proper marginal rate and foreign tax credit
 * For Irish residents receiving US dividends:
 * 1. US withholds 15% (with treaty) or 30% (without)
 * 2. Irish tax is calculated at marginal rate (24.6% or 52.1%)
 * 3. Foreign tax credit = lesser of US withholding or Irish tax liability
 * 4. Net Irish tax = Irish tax liability - Foreign tax credit
 * 
 * @param dollarAmount Gross dividend in USD
 * @param usWithholdingAmount US withholding tax already deducted
 * @param irishMarginalRate Irish marginal tax rate (24.6% or 52.1%)
 * @param exchangeRate USD/EUR exchange rate
 * @returns Object with irishTaxLiability, foreignTaxCredit, and netIrishTax (all in EUR)
 */
export function calculateIrishTax(
  dollarAmount: number,
  usWithholdingAmount: number,
  irishMarginalRate: number,
  exchangeRate: number
): {
  // Back-compat fields
  irishTaxLiability: number; // total before credit
  foreignTaxCredit: number; // credit applied (against Income Tax only)
  netIrishTax: number; // total payable after credit
  // Detailed fields
  grossEUR: number;
  incomeTax: number;
  usc: number;
  prsi: number;
  totalBeforeCredit: number;
  incomeTaxAfterCredit: number;
  totalPayable: number;
} {
  // Convert to EUR
  const euroAmount = dollarAmount / exchangeRate
  const usWithholdingEUR = usWithholdingAmount / exchangeRate

  // Derive components from marginal rate assumptions (40% IT, 8% USC, 4% PRSI for higher; 20/0.5/4 for standard)
  // We cannot infer exact components from a single blended rate, so compute using canonical bands based on rounded presets.
  let incomeRate: number
  let uscRate: number
  let prsiRate: number
  if (irishMarginalRate >= 40 || Math.abs(irishMarginalRate - IRISH_HIGHER_RATE) < 0.51) {
    incomeRate = 40
    uscRate = 8
    prsiRate = 4
  } else {
    // Treat anything else as standard simplified profile
    incomeRate = 20
    uscRate = 0.5
    prsiRate = 4
  }

  const incomeTax = (euroAmount * incomeRate) / 100
  const usc = (euroAmount * uscRate) / 100
  const prsi = (euroAmount * prsiRate) / 100
  const totalBeforeCredit = incomeTax + usc + prsi

  // Foreign tax credit can only reduce Irish Income Tax
  const foreignTaxCredit = Math.min(usWithholdingEUR, incomeTax)
  const incomeTaxAfterCredit = incomeTax - foreignTaxCredit
  const totalPayable = incomeTaxAfterCredit + usc + prsi

  return {
    // Back compat
    irishTaxLiability: totalBeforeCredit,
    foreignTaxCredit,
    netIrishTax: totalPayable,
    // Detailed
    grossEUR: euroAmount,
    incomeTax,
    usc,
    prsi,
    totalBeforeCredit,
    incomeTaxAfterCredit,
    totalPayable,
  }
}

/**
 * Calculate foreign tax credit
 * The foreign tax credit is typically limited to the lesser of:
 * 1. The foreign tax paid (US withholding)
 * 2. The domestic tax that would be due on the same income
 */
export function calculateForeignTaxCredit(
  usWithholdingAmount: number,
  domesticTaxAmount: number
): number {
  return Math.min(usWithholdingAmount, domesticTaxAmount)
}

/**
 * Calculate net dividend after all taxes
 * Net = Gross - US Withholding - (EU Tax - Foreign Tax Credit)
 */
export function calculateNetDividend(
  dollarAmount: number,
  usWithholdingAmount: number,
  euTaxAmount: number = 0,
  foreignTaxCredit: number = 0
): number {
  const netAfterUSWithholding = dollarAmount - usWithholdingAmount
  const additionalEUTax = Math.max(0, euTaxAmount - foreignTaxCredit)
  return netAfterUSWithholding - additionalEUTax
}

/**
 * Get total US withholding tax paid across all dividends
 */
export function getTotalUSWithholding(dividends: Dividend[]): number {
  return dividends.reduce((sum, d) => sum + d.usWithholdingAmount, 0)
}

/**
 * Get total EU tax paid across all dividends
 */
export function getTotalEUTax(dividends: Dividend[]): number {
  return dividends.reduce((sum, d) => sum + (d.euTaxAmount || 0), 0)
}

/**
 * Get total foreign tax credits across all dividends
 */
export function getTotalForeignTaxCredit(dividends: Dividend[]): number {
  return dividends.reduce((sum, d) => sum + (d.foreignTaxCredit || 0), 0)
}

/**
 * Get total net dividends in USD across all dividends
 */
export function getTotalNetDividendsUSD(dividends: Dividend[]): number {
  return dividends.reduce((sum, d) => sum + d.netAmountUSD, 0)
}

/**
 * Get total net dividends in EUR across all dividends
 */
export function getTotalNetDividendsEUR(dividends: Dividend[]): number {
  return dividends.reduce((sum, d) => sum + d.netAmountEUR, 0)
}

/**
 * Get total tax paid (US withholding + EU tax - foreign tax credit)
 */
export function getTotalTaxPaid(dividends: Dividend[]): number {
  return dividends.reduce((sum, d) => {
    const usWithholding = d.usWithholdingAmount
    const euTax = d.euTaxAmount || 0
    const credit = d.foreignTaxCredit || 0
    return sum + usWithholding + Math.max(0, euTax - credit)
  }, 0)
}

/**
 * Find EU country tax rate by country code
 */
export function getEUCountryRate(countryCode: string): number | null {
  const country = EU_COUNTRY_TAX_RATES.find((c) => c.code === countryCode)
  return country ? country.rate : null
}
