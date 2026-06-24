// Malaysia fixed deposit (FD) calculation engine.
//
// A licensed-bank fixed deposit pays a contractual annual interest rate over a
// fixed tenure (commonly 1–60 months). For a single placement, banks pay
// SIMPLE interest pro-rated to the tenure:
//
//   interest = principal × rate% × (months / 12)
//
// If you let the FD auto-renew and roll the interest back into the principal,
// the return compounds — we expose both so users can see the difference.
//
// Note: interest earned on deposits with licensed banks/finance companies in
// Malaysia is tax-exempt for individuals, so no tax is applied here.

export interface FixedDepositInputs {
  /** Principal placed in RM. */
  principal: number;
  /** Quoted annual interest rate (percent, e.g. 3.5 for 3.5% p.a.). */
  annualRate: number;
  /** Tenure in months. */
  tenureMonths: number;
}

export interface FixedDepositResult {
  /** Principal placed in RM (echoed for convenience). */
  principal: number;
  /** Simple interest earned over the tenure in RM. */
  interest: number;
  /** Maturity value with simple interest (principal + interest) in RM. */
  maturityValue: number;
  /**
   * Maturity value if the FD auto-renews monthly and interest compounds. Equal
   * to the simple maturity value for tenures of one month or less.
   */
  compoundedMaturityValue: number;
  /** Extra return from compounding vs. simple interest, in RM. */
  compoundingBonus: number;
  /** Average interest income per month over the tenure (simple), in RM. */
  monthlyInterest: number;
}

export function calculateFixedDeposit(input: FixedDepositInputs): FixedDepositResult {
  const principal = Math.max(0, input.principal);
  const annualRate = Math.max(0, input.annualRate);
  const tenureMonths = Math.max(0, input.tenureMonths);

  const years = tenureMonths / 12;
  const interest = principal * (annualRate / 100) * years;
  const maturityValue = principal + interest;

  // Monthly compounding if the placement auto-renews each month.
  const monthlyRate = annualRate / 100 / 12;
  const compoundedMaturityValue = principal * Math.pow(1 + monthlyRate, tenureMonths);
  const compoundingBonus = Math.max(0, compoundedMaturityValue - maturityValue);

  const monthlyInterest = tenureMonths > 0 ? interest / tenureMonths : 0;

  return {
    principal,
    interest,
    maturityValue,
    compoundedMaturityValue,
    compoundingBonus,
    monthlyInterest,
  };
}

export const FIXED_DEPOSIT_DEFAULTS: FixedDepositInputs = {
  principal: 10000,
  annualRate: 3.5,
  tenureMonths: 12,
};
