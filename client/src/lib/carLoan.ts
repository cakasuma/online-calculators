// Malaysia car loan (hire purchase) calculation engine.
//
// Vehicle financing in Malaysia is governed by the Hire-Purchase Act 1967 and,
// unlike a housing loan, uses a FLAT interest rate rather than reducing balance.
// The total interest is fixed up front over the whole tenure:
//
//   interest = principal × flatRate% × years
//
// and the monthly instalment is simply the total payable spread evenly across
// every month of the tenure. Because you keep paying interest on the original
// principal even as the balance falls, the true (effective) cost is roughly
// double the headline flat rate — we surface an approximate effective rate so
// users can compare a hire purchase against a reducing-balance loan honestly.

export interface CarLoanInputs {
  /** On-the-road / cash price of the vehicle in RM. */
  price: number;
  /** Down payment as a percentage of price (Malaysian minimum is typically 10%). */
  downPct: number;
  /** Flat annual interest rate (percent, e.g. 3.0 for 3%/year flat). */
  flatRate: number;
  /** Loan tenure in years (typically 1–9 in Malaysia). */
  tenureYears: number;
}

export interface CarLoanResult {
  /** Down payment in RM. */
  downPayment: number;
  /** Amount financed (price − down payment) in RM. */
  loanAmount: number;
  /** Total interest charged over the whole tenure in RM. */
  totalInterest: number;
  /** Total amount payable over the tenure (principal + interest) in RM. */
  totalPayable: number;
  /** Fixed monthly instalment in RM. */
  monthlyInstalment: number;
  /** Total number of monthly instalments. */
  months: number;
  /**
   * Approximate effective annual interest rate (reducing-balance equivalent),
   * derived from the flat rate via the standard N-ratio approximation. Lets
   * users compare the flat-rate hire purchase against a reducing-balance loan.
   */
  effectiveRate: number;
}

/**
 * Approximate the effective (reducing-balance) annual rate for a flat-rate
 * loan using the widely used N-ratio formula:
 *
 *   APR ≈ (2 × p × I) / (P × (n + 1))
 *
 * where p = payments per year (12), I = total interest, P = principal, and
 * n = total number of payments. Returns a percentage.
 */
export function approxEffectiveRate(principal: number, totalInterest: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const paymentsPerYear = 12;
  return (2 * paymentsPerYear * totalInterest) / (principal * (months + 1)) * 100;
}

export function calculateCarLoan(input: CarLoanInputs): CarLoanResult {
  const price = Math.max(0, input.price);
  const downPct = Math.max(0, Math.min(100, input.downPct));
  const flatRate = Math.max(0, input.flatRate);
  const tenureYears = Math.max(0, input.tenureYears);

  const downPayment = price * (downPct / 100);
  const loanAmount = Math.max(0, price - downPayment);
  const months = Math.max(0, Math.round(tenureYears * 12));

  const totalInterest = loanAmount * (flatRate / 100) * tenureYears;
  const totalPayable = loanAmount + totalInterest;
  const monthlyInstalment = months > 0 ? totalPayable / months : 0;
  const effectiveRate = approxEffectiveRate(loanAmount, totalInterest, months);

  return {
    downPayment,
    loanAmount,
    totalInterest,
    totalPayable,
    monthlyInstalment,
    months,
    effectiveRate,
  };
}

export const CAR_LOAN_DEFAULTS: CarLoanInputs = {
  price: 90000,
  downPct: 10,
  flatRate: 3.0,
  tenureYears: 9,
};
