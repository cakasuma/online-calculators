// Malaysia fixed deposit (FD) calculation engine.
//
// A licensed-bank fixed deposit pays a contractual annual interest rate over a
// fixed tenure (commonly 1–60 months). Interest is SIMPLE and paid at maturity:
//
//   interest = principal × rate% × (months / 12)
//
// Nothing compounds inside a tenure. Compounding happens only when the deposit
// is renewed and the interest earned is rolled into the new principal, which is
// once per completed tenure — not monthly. A single placement therefore earns
// no compounding bonus at all.
//
// Note: interest earned on deposits with licensed banks/finance companies in
// Malaysia is tax-exempt for individuals, so no tax is applied here.

/**
 * PIDM deposit insurance limit, per depositor per member bank, in RM.
 *
 * The limit covers principal *and* interest, so a placement that starts under
 * the cap can mature above it. Conventional and Islamic deposits are protected
 * separately, so the same bank can cover RM250,000 of each.
 */
export const PIDM_LIMIT = 250_000;

/**
 * Completed months a depositor must hold before a bank will pay any interest on
 * an early withdrawal. Below this, the whole of the interest is forfeited.
 */
export const EARLY_WITHDRAWAL_MIN_MONTHS = 3;

/**
 * Share of the contracted rate typically paid on an early withdrawal made after
 * the minimum holding period. This is common bank practice rather than a rule
 * set by Bank Negara, and the exact terms vary between banks.
 */
export const EARLY_WITHDRAWAL_RATE_SHARE = 0.5;

export interface FixedDepositInputs {
  /** Principal placed in RM. */
  principal: number;
  /** Quoted annual interest rate (percent, e.g. 3.5 for 3.5% p.a.). */
  annualRate: number;
  /** Tenure of a single placement, in months. */
  tenureMonths: number;
  /**
   * How many times the deposit is placed, each for the full tenure. One means a
   * single placement; anything more means the interest is rolled over and
   * compounds at each renewal. Defaults to one.
   */
  cycles?: number;
  /**
   * Model breaking the deposit this many months into a single tenure. Absent
   * means the deposit is held to maturity.
   */
  withdrawAfterMonths?: number;
}

export interface EarlyWithdrawalResult {
  /** Months held before breaking the deposit. */
  afterMonths: number;
  /** Whole months completed, which is all the bank counts. */
  completedMonths: number;
  /** The rate actually paid, as a percentage. */
  ratePaidPct: number;
  /** Interest actually received in RM. */
  interestPaid: number;
  /** Interest given up by not holding to maturity, in RM. */
  interestForfeited: number;
  /** Principal plus whatever interest was paid, in RM. */
  amountReceived: number;
}

export interface FixedDepositResult {
  /** Principal placed in RM (echoed for convenience). */
  principal: number;
  /** Simple interest earned over one tenure in RM. */
  interest: number;
  /** Maturity value of one tenure (principal + interest) in RM. */
  maturityValue: number;
  /** Total months the money is placed for, across every cycle. */
  totalMonths: number;
  /** Value at the end of the last cycle, compounding at each renewal, in RM. */
  finalValue: number;
  /**
   * Extra return from rolling the deposit over, measured against simple
   * interest for the same total period. Exactly zero for a single placement.
   */
  compoundingBonus: number;
  /** Average interest income per month over one tenure (simple), in RM. */
  monthlyInterest: number;
  /** Annualised return over the whole holding period, as a percentage. */
  effectiveAnnualRate: number;
  /** Whether the final value stays within PIDM protection. */
  pidm: { limit: number; covered: boolean; excess: number };
  earlyWithdrawal?: EarlyWithdrawalResult;
}

export function calculateFixedDeposit(input: FixedDepositInputs): FixedDepositResult {
  const principal = Math.max(0, input.principal);
  const annualRate = Math.max(0, input.annualRate);
  const tenureMonths = Math.max(0, input.tenureMonths);
  const cycles = Math.max(1, Math.floor(input.cycles ?? 1));

  const years = tenureMonths / 12;
  const interest = principal * (annualRate / 100) * years;
  const maturityValue = principal + interest;
  const monthlyInterest = tenureMonths > 0 ? interest / tenureMonths : 0;

  // Each renewal starts from the previous maturity value, so the interest earned
  // in one cycle earns interest in the next.
  let balance = principal;
  for (let cycle = 0; cycle < cycles; cycle++) {
    balance += balance * (annualRate / 100) * years;
  }
  const finalValue = balance;

  const totalMonths = tenureMonths * cycles;
  const simpleOverPeriod = principal + principal * (annualRate / 100) * (totalMonths / 12);
  const compoundingBonus = Math.max(0, finalValue - simpleOverPeriod);

  const effectiveAnnualRate =
    principal > 0 && totalMonths > 0
      ? (Math.pow(finalValue / principal, 12 / totalMonths) - 1) * 100
      : 0;

  const excess = Math.max(0, finalValue - PIDM_LIMIT);

  const result: FixedDepositResult = {
    principal,
    interest,
    maturityValue,
    totalMonths,
    finalValue,
    compoundingBonus,
    monthlyInterest,
    effectiveAnnualRate,
    pidm: { limit: PIDM_LIMIT, covered: excess === 0, excess },
  };

  if (input.withdrawAfterMonths != null && tenureMonths > 0) {
    result.earlyWithdrawal = breakEarly(principal, annualRate, tenureMonths, interest, input.withdrawAfterMonths);
  }

  return result;
}

function breakEarly(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  fullInterest: number,
  withdrawAfterMonths: number,
): EarlyWithdrawalResult {
  const afterMonths = Math.max(0, withdrawAfterMonths);

  // Holding to the end of the tenure is not an early withdrawal at all.
  if (afterMonths >= tenureMonths) {
    return {
      afterMonths: tenureMonths,
      completedMonths: tenureMonths,
      ratePaidPct: annualRate,
      interestPaid: fullInterest,
      interestForfeited: 0,
      amountReceived: principal + fullInterest,
    };
  }

  // Banks count whole completed months only, and pay nothing at all before the
  // minimum holding period.
  const completedMonths = Math.floor(afterMonths);
  const qualifies = completedMonths >= EARLY_WITHDRAWAL_MIN_MONTHS;
  const ratePaidPct = qualifies ? annualRate * EARLY_WITHDRAWAL_RATE_SHARE : 0;
  const interestPaid = principal * (ratePaidPct / 100) * (completedMonths / 12);

  return {
    afterMonths,
    completedMonths,
    ratePaidPct,
    interestPaid,
    interestForfeited: Math.max(0, fullInterest - interestPaid),
    amountReceived: principal + interestPaid,
  };
}

export const FIXED_DEPOSIT_DEFAULTS: FixedDepositInputs = {
  principal: 10000,
  annualRate: 3.5,
  tenureMonths: 12,
  cycles: 1,
};
