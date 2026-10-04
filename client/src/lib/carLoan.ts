// Malaysia car loan (hire purchase) calculation engine.
//
// The Hire-Purchase (Amendment) Act commenced on 1 June 2026 and changed how
// vehicle financing is priced. It abolished, for new agreements:
//
//   - the FLAT interest rate, under which interest was charged on the original
//     principal for every year of the tenure regardless of what you had repaid;
//   - the RULE OF 78, a sum-of-digits formula that front-loaded interest and so
//     penalised anyone settling early.
//
// New agreements are priced on a reducing balance and must disclose an effective
// interest rate and a repayment schedule.
//
// Both regimes are modelled here, because both are live. Agreements signed
// before 1 June 2026 keep their original flat-rate terms — nine-year tenures run
// to 2035 — and the Rule of 78 still governs their early settlement, though
// banks have voluntarily agreed to offer goodwill discounts that bring the
// settlement figure closer to a reducing-balance basis. Banks may also continue
// issuing flat-rate financing during a transition period ending 31 March 2027.

import {
  buildSchedule,
  impliedMonthlyRate,
  outstandingAfter,
  type AmortYear,
} from "./amortisation";

/**
 * Which pricing regime the agreement falls under.
 *
 * "reducing" is the post-amendment basis for new agreements; "flat" is the
 * pre-June-2026 basis, retained for existing loans.
 */
export type HpRegime = "reducing" | "flat";

/** Date the amended Act commenced, after which new agreements price on a reducing balance. */
export const HP_AMENDMENT_COMMENCEMENT = "2026-06-01";
/** End of the period during which flat-rate financing may still be issued. */
export const HP_TRANSITION_ENDS = "2027-03-31";

export interface CarLoanInputs {
  /** On-the-road / cash price of the vehicle in RM. */
  price: number;
  /** Down payment as a percentage of price (Malaysian minimum is typically 10%). */
  downPct: number;
  /**
   * Annual interest rate as a percentage. Read as a flat rate under the "flat"
   * regime and as a reducing-balance rate under "reducing" — the same number
   * means very different money, which is why the two are labelled distinctly.
   */
  flatRate: number;
  /** Loan tenure in years (typically 1–9 in Malaysia). */
  tenureYears: number;
  /**
   * Pricing regime. Defaults to "flat" so that callers written against the
   * pre-amendment engine keep their original behaviour.
   */
  regime?: HpRegime;
  /** Settle the loan after this many months. Zero or absent means run to term. */
  settleAfterMonths?: number;
}

export interface SettlementResult {
  /** Month at which the loan is settled, clamped to the term. */
  afterMonths: number;
  /** Instalments handed over before settling. */
  instalmentsPaid: number;
  /** Rule of 78 rebate on the term charges. Always zero on a reducing balance. */
  rebate: number;
  /** Cash needed to close the agreement. */
  amountToSettle: number;
  /** What the same settlement would cost on a reducing balance. */
  reducingComparison: number;
  /**
   * How much worse the Rule of 78 figure is than a reducing balance — the gap a
   * bank's goodwill discount is meant to close. Zero under the new regime.
   */
  goodwillDiscount: number;
  /** Interest avoided by settling early rather than running to term. */
  interestSaved: number;
}

export interface CarLoanResult {
  regime: HpRegime;
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
   * Annual effective interest rate as a percentage.
   *
   * Under the flat regime this is the reducing-balance equivalent of the
   * headline flat rate, which is roughly double it. Under the reducing regime
   * it is the nominal rate annualised for monthly compounding.
   */
  effectiveRate: number;
  /** Yearly repayment schedule. Empty under the flat regime, which has no such disclosure. */
  schedule: AmortYear[];
  settlement?: SettlementResult;
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

/**
 * Rule of 78 rebate on term charges, per the statutory sum-of-digits formula:
 *
 *   rebate = termCharges × n(n + 1) / N(N + 1)
 *
 * where n is the number of complete months still to run and N the total months.
 * Because the digits are weighted towards the start of the term, the rebate is
 * always smaller than the interest a reducing balance would have saved.
 */
export function ruleOf78Rebate(termCharges: number, totalMonths: number, monthsRemaining: number): number {
  if (totalMonths <= 0 || monthsRemaining <= 0) return 0;
  const n = Math.min(monthsRemaining, totalMonths);
  return (termCharges * n * (n + 1)) / (totalMonths * (totalMonths + 1));
}

export function calculateCarLoan(input: CarLoanInputs): CarLoanResult {
  const price = Math.max(0, input.price);
  const downPct = Math.max(0, Math.min(100, input.downPct));
  const rate = Math.max(0, input.flatRate);
  const tenureYears = Math.max(0, input.tenureYears);
  const regime: HpRegime = input.regime ?? "flat";

  const downPayment = price * (downPct / 100);
  const loanAmount = Math.max(0, price - downPayment);
  const months = Math.max(0, Math.round(tenureYears * 12));

  const base =
    regime === "reducing"
      ? reducingBalance(loanAmount, rate, months)
      : flatRate(loanAmount, rate, tenureYears, months);

  const result: CarLoanResult = {
    regime,
    downPayment,
    loanAmount,
    ...base,
  };

  if (input.settleAfterMonths != null && months > 0) {
    result.settlement = settle(result, rate, input.settleAfterMonths);
  }

  return result;
}

function reducingBalance(principal: number, annualRate: number, months: number) {
  const schedule = buildSchedule(principal, annualRate, months, 0);
  const monthlyRate = annualRate / 100 / 12;
  return {
    totalInterest: schedule.totalInterest,
    totalPayable: principal + schedule.totalInterest,
    monthlyInstalment: schedule.monthlyInstallment,
    months,
    // Annualising the monthly rate is what "effective" means once interest
    // compounds monthly, and it is the figure the amended Act requires.
    effectiveRate: monthlyRate === 0 ? 0 : (Math.pow(1 + monthlyRate, 12) - 1) * 100,
    schedule: schedule.years,
  };
}

function flatRate(principal: number, annualRate: number, tenureYears: number, months: number) {
  const totalInterest = principal * (annualRate / 100) * tenureYears;
  const totalPayable = principal + totalInterest;
  return {
    totalInterest,
    totalPayable,
    monthlyInstalment: months > 0 ? totalPayable / months : 0,
    months,
    effectiveRate: approxEffectiveRate(principal, totalInterest, months),
    schedule: [] as AmortYear[],
  };
}

function settle(result: CarLoanResult, annualRate: number, requestedMonth: number): SettlementResult {
  const afterMonths = Math.max(0, Math.min(Math.round(requestedMonth), result.months));
  const instalmentsPaid = result.monthlyInstalment * afterMonths;
  const monthsRemaining = result.months - afterMonths;

  if (result.regime === "reducing") {
    // Interest simply stops accruing on principal already repaid, so the
    // settlement figure is the outstanding balance and there is nothing to rebate.
    const monthlyRate = annualRate / 100 / 12;
    const amountToSettle = outstandingAfter(
      result.loanAmount,
      monthlyRate,
      result.monthlyInstalment,
      afterMonths,
    );
    const interestPaidSoFar = instalmentsPaid - (result.loanAmount - amountToSettle);
    return {
      afterMonths,
      instalmentsPaid,
      rebate: 0,
      amountToSettle,
      reducingComparison: amountToSettle,
      goodwillDiscount: 0,
      interestSaved: Math.max(0, result.totalInterest - interestPaidSoFar),
    };
  }

  const rebate = ruleOf78Rebate(result.totalInterest, result.months, monthsRemaining);
  const amountToSettle = Math.max(0, result.totalPayable - instalmentsPaid - rebate);

  // What the borrower would owe had the same instalments been priced on a
  // reducing balance — the basis a goodwill discount is meant to approximate.
  const monthlyRate = impliedMonthlyRate(result.loanAmount, result.monthlyInstalment, result.months);
  const reducingComparison = outstandingAfter(
    result.loanAmount,
    monthlyRate,
    result.monthlyInstalment,
    afterMonths,
  );

  return {
    afterMonths,
    instalmentsPaid,
    rebate,
    amountToSettle,
    reducingComparison,
    goodwillDiscount: Math.max(0, amountToSettle - reducingComparison),
    interestSaved: rebate,
  };
}

export const CAR_LOAN_DEFAULTS: CarLoanInputs = {
  price: 90000,
  downPct: 10,
  // A reducing-balance rate, not a flat one — roughly what a flat 3% used to cost.
  flatRate: 5.5,
  tenureYears: 9,
  regime: "reducing",
};
