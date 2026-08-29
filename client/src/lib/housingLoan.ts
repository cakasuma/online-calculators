// Malaysia housing loan calculation engine.
//
// A home loan here is a reducing-balance term loan, but the monthly instalment is
// only half the story: the cash a buyer actually needs on completion day is driven
// by stamp duty, legal fees, and — on a new launch — whatever the developer throws
// in. This engine models those real-world modifiers alongside the amortisation so
// the headline "cash required" figure matches what the buyer will really pay.
//
// Rule-bound figures are exported as dated constants so a Budget change is a
// one-line edit rather than a hunt through the file.

/**
 * Buyer categories that attract different stamp duty treatment.
 *
 * A permanent resident is deliberately distinct from a citizen: a PR pays the
 * normal tiers rather than the higher non-citizen rate, but the first-home
 * exemption is restricted to Malaysian citizens.
 */
export type BuyerType = "citizen" | "pr" | "foreigner";

export interface HousingLoanInputs {
  /** Sale & purchase agreement price in RM. */
  price: number;
  /** Developer rebate as a percentage of the SPA price. */
  rebatePct: number;
  /** Down payment as a percentage of the SPA price. */
  downPct: number;
  /** Loan tenure in years. */
  tenureYears: number;
  /** Annual interest rate (percent), reducing balance. */
  rate: number;
  buyerType: BuyerType;
  firstHome: "yes" | "no";
  /** Developer absorbs the SPA and loan agreement legal fees ("free legal fee"). */
  developerAbsorbsLegal: boolean;
  /** Developer absorbs the transfer stamp duty ("free MOT"). */
  developerAbsorbsMot: boolean;
  /** MRTA/MLTA premium in RM. Zero means no cover taken. */
  mrtaPremium: number;
  /** Roll the MRTA premium into the loan rather than paying it upfront. */
  financeMrta: boolean;
  /** Extra principal paid every month in RM. Zero means none. */
  extraMonthly: number;
}

/**
 * Full stamp duty exemption on the transfer instrument and the loan agreement for
 * a Malaysian citizen buying their first residential property.
 *
 * Budget 2026 extended this for a further two years, to 31 December 2027. The
 * 75% remission that once applied to the RM500,001–RM1,000,000 band was the
 * i-MILIKI scheme, which lapsed on 31 December 2023 and was never renewed — above
 * the threshold there is no relief at all.
 */
export const FIRST_HOME_EXEMPTION = {
  maxPrice: 500_000,
  expires: "2027-12-31",
} as const;

/**
 * Flat transfer stamp duty for non-citizens and foreign companies, raised from
 * 4% in Budget 2026 and effective 1 January 2026. It replaces the tiers outright
 * rather than stacking on top of them. Permanent residents are excluded from this
 * higher rate.
 */
export const FOREIGN_BUYER_MOT_RATE = 0.08;

/** Ad-valorem transfer (MOT) stamp duty tiers. */
export const MOT_TIERS = [
  { upTo: 100_000, rate: 0.01 },
  { upTo: 500_000, rate: 0.02 },
  { upTo: 1_000_000, rate: 0.03 },
  { upTo: Infinity, rate: 0.04 },
];

/** Solicitors' Remuneration Order scale fees. */
export const LEGAL_FEE_TIERS = [
  { upTo: 500_000, rate: 0.0125 },
  { upTo: 1_000_000, rate: 0.01 },
  { upTo: 3_000_000, rate: 0.007 },
  { upTo: Infinity, rate: 0.006 },
];

/** Valuers, Appraisers & Estate Agents scale fees. */
export const VALUATION_FEE_TIERS = [
  { upTo: 100_000, rate: 0.0025 },
  { upTo: 2_100_000, rate: 0.002 },
  { upTo: 9_100_000, rate: 0.00167 },
  { upTo: Infinity, rate: 0.00125 },
];

/** Stamp duty on the loan agreement, as a fraction of the amount financed. */
export const LOAN_AGREEMENT_DUTY_RATE = 0.005;

/** Typical solicitor's disbursements (searches, registration, travelling) in RM. */
export const LEGAL_DISBURSEMENTS_ESTIMATE = 1_800;

/** Apply a stacking tier table to an amount. Each band is charged at its own rate. */
function applyTiers(amount: number, tiers: { upTo: number; rate: number }[]): number {
  let total = 0;
  let prev = 0;
  for (const tier of tiers) {
    if (amount <= prev) break;
    total += (Math.min(amount, tier.upTo) - prev) * tier.rate;
    prev = tier.upTo;
  }
  return total;
}

/** Memorandum of Transfer ad-valorem stamp duty for a citizen or permanent resident. */
export function motStampDuty(price: number): number {
  return applyTiers(Math.max(0, price), MOT_TIERS);
}

/** Solicitors' Remuneration Order scale fee applied to a sum. */
export function legalScale(amount: number): number {
  return applyTiers(Math.max(0, amount), LEGAL_FEE_TIERS);
}

/** Professional valuation fee applied to a property price. */
export function valuationFee(price: number): number {
  return applyTiers(Math.max(0, price), VALUATION_FEE_TIERS);
}

/** One calendar year of the repayment schedule. */
export interface AmortYear {
  year: number;
  openingBalance: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface Schedule {
  years: AmortYear[];
  /** Months actually taken to clear the loan — shorter than the term if extra is paid. */
  months: number;
  totalInterest: number;
  /** The contractual instalment, before any extra principal. */
  monthlyInstallment: number;
}

/** The contractual reducing-balance instalment. */
function instalmentFor(principal: number, monthlyRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  if (monthlyRate === 0) return principal / months;
  const growth = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * growth) / (growth - 1);
}

/**
 * Amortise a loan month by month, aggregated into calendar years.
 *
 * Any `extraMonthly` goes straight to principal on top of the contractual
 * instalment, so the loan clears early — `months` reports how long it actually
 * took, which is what makes the interest saving visible.
 */
export function buildSchedule(
  principal: number,
  annualRate: number,
  months: number,
  extraMonthly: number,
): Schedule {
  const monthlyRate = Math.max(0, annualRate) / 100 / 12;
  const term = Math.max(0, Math.round(months));
  const extra = Math.max(0, extraMonthly);
  const monthlyInstallment = instalmentFor(principal, monthlyRate, term);

  const years: AmortYear[] = [];
  let balance = Math.max(0, principal);
  let totalInterest = 0;
  let elapsed = 0;
  let current: AmortYear | null = null;

  for (let month = 1; month <= term && balance > 0.005; month++) {
    if (!current || month % 12 === 1) {
      current = {
        year: years.length + 1,
        openingBalance: balance,
        principalPaid: 0,
        interestPaid: 0,
        closingBalance: balance,
      };
      years.push(current);
    }

    const interest = balance * monthlyRate;
    // The final payment is capped at whatever is left to clear.
    const principalPart = Math.min(balance, monthlyInstallment - interest + extra);

    balance -= principalPart;
    totalInterest += interest;
    elapsed = month;

    current.principalPaid += principalPart;
    current.interestPaid += interest;
    current.closingBalance = balance;
  }

  return { years, months: elapsed, totalInterest, monthlyInstallment };
}

export interface HousingLoanResult {
  downPayment: number;
  /** Amount financed, including the MRTA premium when it is rolled into the loan. */
  loanAmount: number;
  monthlyInstallment: number;
  totalPayment: number;
  totalInterest: number;
  /** Months actually taken to clear the loan, after any extra repayment. */
  months: number;
  schedule: AmortYear[];
  /** Interest avoided by the extra monthly repayment, in RM. */
  interestSaved: number;
  /** Months shaved off the term by the extra monthly repayment. */
  monthsSaved: number;

  /** Transfer stamp duty before any developer waiver. */
  motDuty: number;
  /** Loan agreement stamp duty. */
  loanDuty: number;
  /** SPA plus loan agreement legal fees, before any developer waiver. */
  legalFees: number;
  valuationFee: number;
  disbursements: number;

  payableMot: number;
  payableLoanDuty: number;
  payableLegal: number;
  /** MRTA premium falling due upfront — zero when it is financed. */
  mrtaUpfront: number;

  /** Total cash due before the rebate is applied. */
  grossUpfront: number;
  rebateAmount: number;
  /** Cash the buyer actually needs, floored at zero. */
  netCashRequired: number;
  /** Rebate left over once every upfront cost is covered. */
  rebateSurplus: number;

  /** Whether the first-home stamp duty exemption applies. */
  exempt: boolean;
}

export function calculateHousingLoan(input: HousingLoanInputs): HousingLoanResult {
  const price = Math.max(0, input.price);
  const downPct = Math.max(0, Math.min(100, input.downPct));
  const rate = Math.max(0, input.rate);
  const mrtaPremium = Math.max(0, input.mrtaPremium);

  const downPayment = price * (downPct / 100);
  const baseLoan = Math.max(0, price - downPayment);
  // A financed premium becomes part of the sum the loan agreement is executed for,
  // so it drives the instalment, the loan duty, and the loan legal fee alike.
  const loanAmount = baseLoan + (input.financeMrta ? mrtaPremium : 0);
  const term = Math.max(1, Math.round(Math.max(0, input.tenureYears) * 12));

  // The exemption is restricted to Malaysian citizens buying their first home.
  const exempt =
    input.buyerType === "citizen" &&
    input.firstHome === "yes" &&
    price <= FIRST_HOME_EXEMPTION.maxPrice;

  const grossMot =
    input.buyerType === "foreigner" ? price * FOREIGN_BUYER_MOT_RATE : motStampDuty(price);

  const motDuty = exempt ? 0 : grossMot;
  const loanDuty = exempt ? 0 : loanAmount * LOAN_AGREEMENT_DUTY_RATE;
  const legalFees = legalScale(price) + legalScale(loanAmount);
  const valuation = valuationFee(price);

  const payableMot = input.developerAbsorbsMot ? 0 : motDuty;
  const payableLegal = input.developerAbsorbsLegal ? 0 : legalFees;
  // The loan agreement duty belongs to the financing rather than the sale, so a
  // developer package never covers it.
  const payableLoanDuty = loanDuty;
  const mrtaUpfront = input.financeMrta ? 0 : mrtaPremium;

  const grossUpfront =
    downPayment +
    payableMot +
    payableLoanDuty +
    payableLegal +
    valuation +
    LEGAL_DISBURSEMENTS_ESTIMATE +
    mrtaUpfront;

  // The rebate is cash-side only: the bank still finances against the full SPA
  // price, and duty and legal fees are still assessed on it.
  const rebateAmount = price * (Math.max(0, input.rebatePct) / 100);
  const netCashRequired = Math.max(0, grossUpfront - rebateAmount);
  const rebateSurplus = Math.max(0, rebateAmount - grossUpfront);

  const baseline = buildSchedule(loanAmount, rate, term, 0);
  const actual = buildSchedule(loanAmount, rate, term, Math.max(0, input.extraMonthly));

  return {
    downPayment,
    loanAmount,
    monthlyInstallment: actual.monthlyInstallment,
    totalPayment: loanAmount + actual.totalInterest,
    totalInterest: actual.totalInterest,
    months: actual.months,
    schedule: actual.years,
    interestSaved: baseline.totalInterest - actual.totalInterest,
    monthsSaved: baseline.months - actual.months,

    motDuty,
    loanDuty,
    legalFees,
    valuationFee: valuation,
    disbursements: LEGAL_DISBURSEMENTS_ESTIMATE,

    payableMot,
    payableLoanDuty,
    payableLegal,
    mrtaUpfront,

    grossUpfront,
    rebateAmount,
    netCashRequired,
    rebateSurplus,

    exempt,
  };
}

export const HOUSING_LOAN_DEFAULTS: HousingLoanInputs = {
  price: 500000,
  rebatePct: 0,
  downPct: 10,
  tenureYears: 35,
  rate: 4,
  buyerType: "citizen",
  firstHome: "no",
  developerAbsorbsLegal: false,
  developerAbsorbsMot: false,
  mrtaPremium: 0,
  financeMrta: false,
  extraMonthly: 0,
};
