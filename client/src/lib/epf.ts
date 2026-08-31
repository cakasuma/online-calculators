// EPF (KWSP) retirement projection engine.
//
// Given current age, current balance, salary, contribution rates, and growth
// assumptions, compounds year by year up to the user's chosen retirement age
// and returns both the headline projection and a year-by-year breakdown.
//
// Defaults align with KWSP standard contribution Schedule III (employee 11%,
// employer 12% above RM 5,000 wage, 13% at or below) and a 6.0% dividend,
// slightly below the last two declared rates (6.30% for 2024, 6.15% for 2025)
// so the projection stays on the conservative side.

export interface EpfInputs {
  /** Current age in years. */
  currentAge: number;
  /** Target age at which the user expects to withdraw. */
  retirementAge: number;
  /** Current total EPF balance in RM. */
  currentBalance: number;
  /** Current gross monthly salary in RM. */
  monthlySalary: number;
  /** Assumed annual salary growth rate (percent, e.g. 4 for 4%/year). */
  salaryGrowthRate: number;
  /** Assumed annual EPF dividend rate (percent, e.g. 5.5). */
  dividendRate: number;
  /** Employee contribution rate (percent of wages). */
  employeeRate: number;
  /**
   * Employer contribution rate (percent). When undefined, the standard
   * schedule is used (12% above RM 5,000, otherwise 13%).
   */
  employerRate?: number;
  /** Optional yearly voluntary contribution (e.g. via i-Saraan), RM. */
  voluntaryAnnual: number;
  /** Bonus months per year, used to add bonus-on EPF. */
  bonusMonths: number;
  /** Citizenship, which determines the statutory contribution schedule. */
  workerType?: WorkerType;
  /**
   * Current calendar year, used to work out which phase of the Basic Savings
   * target the member will retire under. Omitted means the fully phased-in
   * target, which is what a long-horizon projection should assume.
   */
  currentYear?: number;
}

/**
 * Citizenship for contribution purposes. EPF became mandatory for non-citizens
 * under 75 on 1 October 2025, at a flat 2% from each side.
 */
export type WorkerType = "citizen" | "foreigner";

/** The three accounts every member under 55 has held since 11 May 2024. */
export interface EpfAccounts {
  /** Akaun Persaraan — locked until 55, the retirement pot proper. */
  persaraan: number;
  /** Akaun Sejahtera — for housing, education and health before retirement. */
  sejahtera: number;
  /** Akaun Fleksibel — withdrawable at any time. */
  fleksibel: number;
}

export interface EpfYearRow {
  /** Age at the *end* of the year. */
  age: number;
  /** Monthly salary used for contributions during this year. */
  monthlySalary: number;
  /** Employee monthly contribution. */
  employeeMonthly: number;
  /** Employer monthly contribution. */
  employerMonthly: number;
  /** Total contributions made this year (12× monthly + bonus + voluntary). */
  totalContribution: number;
  /** Dividend credited at the end of the year on the average balance. */
  dividendCredited: number;
  /** EPF balance at the end of the year. */
  endBalance: number;
}

export interface EpfProjection {
  inputs: EpfInputs;
  finalBalance: number;
  totalContributions: number;
  totalDividends: number;
  /** Year-by-year breakdown including the contribution and end balance. */
  years: EpfYearRow[];
  /** Years remaining until the user hits the Basic Savings target for their
   *  retirement age. null if they will not reach it. */
  yearsToTarget: number | null;
  /** Basic Savings target for the chosen retirement age, in RM. */
  basicSavingsTarget: number;
  /** Whether the projected final balance meets or exceeds the Basic Savings target. */
  meetsTarget: boolean;
  /** Estimated monthly retirement income using a 4% safe-withdrawal rate. */
  monthlyRetirementIncome: number;
  /**
   * Projected balance in each of the three accounts, or null once the member
   * has passed 55 and the accounts have consolidated.
   */
  accounts: EpfAccounts | null;
  /** Whether the projection runs past 55, where the three accounts merge. */
  consolidatedAt55: boolean;
  /** The three Retirement Income Adequacy tiers, in RM. */
  riaTiers: typeof RIA_TIERS;
  /** Highest RIA tier the projected balance reaches. */
  tierReached: "none" | "basic" | "adequate" | "enhanced";
  /**
   * True when the Basic Savings target was scaled for a pre-2028 retirement.
   * Only the age-60 figures are published per phase; the rest of the curve is
   * scaled proportionally, so the figure is an estimate.
   */
  basicSavingsIsEstimate: boolean;
}

/**
 * Retirement Income Adequacy tiers, effective 1 January 2026. Basic Savings is
 * the RM390,000 that supports about RM1,625 a month from 60 to 80.
 */
export const RIA_TIERS = {
  basic: 390_000,
  adequate: 650_000,
  enhanced: 1_300_000,
} as const;

/** Share of each new contribution credited to each account since 11 May 2024. */
export const ACCOUNT_SPLIT = { persaraan: 0.75, sejahtera: 0.15, fleksibel: 0.1 } as const;

/** Age at which the three accounts consolidate into Akaun 55. */
export const ACCOUNT_CONSOLIDATION_AGE = 55;

/**
 * Phase-in of the Basic Savings target at age 60. The jump from RM240,000 to
 * RM390,000 is staged over three years, so the figure that applies depends on
 * the calendar year the member turns 60.
 */
export const BASIC_SAVINGS_PHASES: Array<{ fromYear: number; at60: number }> = [
  { fromYear: 2026, at60: 290_000 },
  { fromYear: 2027, at60: 340_000 },
  { fromYear: 2028, at60: 390_000 },
];

/** Basic Savings target at age 60 for a member turning 60 in the given year. */
export function basicSavingsAt60(year: number): number {
  let amount = BASIC_SAVINGS_PHASES[0].at60;
  for (const phase of BASIC_SAVINGS_PHASES) {
    if (year >= phase.fromYear) amount = phase.at60;
  }
  return amount;
}

/**
 * Statutory contribution rates for a given wage, age and citizenship.
 *
 * Contributions stop entirely at 75. From 60 the employee side is voluntary
 * (so zero by default) and the employer side drops to 4%, for citizens and
 * non-citizens alike.
 */
export function statutoryRates(
  monthlySalary: number,
  age: number,
  workerType: WorkerType,
): { employee: number; employer: number } {
  if (age >= 75) return { employee: 0, employer: 0 };
  if (age >= 60) return { employee: 0, employer: 4 };
  if (workerType === "foreigner") return { employee: 2, employer: 2 };
  return { employee: 11, employer: defaultEmployerRate(monthlySalary) };
}

/** Standard employer rate based on monthly wage (KWSP Schedule III, employees < 60). */
export function defaultEmployerRate(monthlySalary: number): number {
  return monthlySalary <= 5000 ? 13 : 12;
}

// ─── KWSP Basic Savings schedule ──────────────────────────────────────────────
//
// Published milestones from the new Retirement Income Adequacy (RIA) framework,
// fully effective by 1 Jan 2028 (target RM 390k at age 60).
//
// Sources:
//   - KWSP press release on RM 240k → RM 390k transition
//   - Says.com SAYS coverage of the official table
//
// We interpolate linearly between milestones for ages that do not appear in
// the published table.

const BASIC_SAVINGS_MILESTONES: Array<{ age: number; amount: number }> = [
  { age: 18, amount: 0 },
  { age: 25, amount: 21000 },
  { age: 30, amount: 38000 },
  { age: 35, amount: 67000 },
  { age: 40, amount: 107000 },
  { age: 45, amount: 156000 },
  { age: 50, amount: 217000 },
  { age: 55, amount: 294000 },
  { age: 60, amount: 390000 },
];

/**
 * Basic Savings target for an age.
 *
 * Only the age-60 figure is published per phase. When `yearTurning60` is given
 * and falls before the phase-in completes, the whole curve is scaled by that
 * year's share of the final RM390,000 — an approximation, not a published
 * table, which is why the projection flags the result as an estimate.
 */
export function basicSavingsTargetAt(age: number, yearTurning60?: number): number {
  const full = unscaledTargetAt(age);
  if (yearTurning60 == null) return full;
  const last = BASIC_SAVINGS_MILESTONES[BASIC_SAVINGS_MILESTONES.length - 1];
  const scale = basicSavingsAt60(yearTurning60) / last.amount;
  return Math.round(full * scale);
}

function unscaledTargetAt(age: number): number {
  if (age <= BASIC_SAVINGS_MILESTONES[0].age) return BASIC_SAVINGS_MILESTONES[0].amount;
  const last = BASIC_SAVINGS_MILESTONES[BASIC_SAVINGS_MILESTONES.length - 1];
  if (age >= last.age) return last.amount;
  for (let i = 1; i < BASIC_SAVINGS_MILESTONES.length; i++) {
    const a = BASIC_SAVINGS_MILESTONES[i - 1];
    const b = BASIC_SAVINGS_MILESTONES[i];
    if (age <= b.age) {
      const frac = (age - a.age) / (b.age - a.age);
      return Math.round(a.amount + frac * (b.amount - a.amount));
    }
  }
  return last.amount;
}

// ─── Projection ───────────────────────────────────────────────────────────────

export function projectEpf(input: EpfInputs): EpfProjection {
  const years: EpfYearRow[] = [];
  let salary = Math.max(0, input.monthlySalary);
  const userEmployeeRate = Math.max(0, Math.min(30, input.employeeRate)) / 100;
  const div = Math.max(0, input.dividendRate) / 100;
  const grow = Math.max(0, input.salaryGrowthRate) / 100;
  const voluntary = Math.max(0, input.voluntaryAnnual);
  const bonusMonths = Math.max(0, Math.min(6, input.bonusMonths));
  const workerType: WorkerType = input.workerType ?? "citizen";

  const startAge = Math.max(15, Math.floor(input.currentAge));
  const endAge = Math.max(startAge + 1, Math.min(75, Math.floor(input.retirementAge)));

  // An existing balance is treated as sitting in Akaun Persaraan: the split
  // governs new contributions only, and a long-standing balance is mostly the
  // old Account 1, which became Persaraan.
  const accounts: EpfAccounts = {
    persaraan: Math.max(0, input.currentBalance),
    sejahtera: 0,
    fleksibel: 0,
  };
  let balance = Math.max(0, input.currentBalance);
  const consolidatedAt55 = endAge >= ACCOUNT_CONSOLIDATION_AGE;

  let totalContrib = 0;
  let totalDiv = 0;
  let yearsToTarget: number | null = null;

  const yearTurning60 =
    input.currentYear != null ? input.currentYear + (60 - startAge) : undefined;
  const target = basicSavingsTargetAt(endAge, yearTurning60);

  for (let age = startAge + 1; age <= endAge; age++) {
    // Rates follow the member's age at the start of the year, so a year spent
    // wholly at 60 or above is contributed at the 60+ schedule.
    const ageAtStart = age - 1;
    const statutory = statutoryRates(salary, ageAtStart, workerType);
    const isStandard = workerType === "citizen" && ageAtStart < 60;
    const empRate = isStandard ? userEmployeeRate : statutory.employee / 100;
    const erRate = isStandard
      ? (input.employerRate ?? statutory.employer) / 100
      : statutory.employer / 100;

    const employeeMonthly = salary * empRate;
    const employerMonthly = salary * erRate;
    const bonusContrib = salary * bonusMonths * (empRate + erRate);
    const annualContrib = (employeeMonthly + employerMonthly) * 12 + bonusContrib + voluntary;

    // Dividend is paid annually on the average balance during the year. We
    // approximate by crediting on (start + annualContrib/2) which is the
    // typical mid-year balance.
    const averageBalance = balance + annualContrib / 2;
    const dividend = averageBalance * div;
    const endBalance = balance + annualContrib + dividend;

    // Credit the accounts while the member is still under 55. The dividend is
    // apportioned by each account's share of the balance it was earned on.
    if (ageAtStart < ACCOUNT_CONSOLIDATION_AGE) {
      const opening = accounts.persaraan + accounts.sejahtera + accounts.fleksibel;
      const shares: Array<keyof EpfAccounts> = ["persaraan", "sejahtera", "fleksibel"];
      for (const key of shares) {
        const contribShare = annualContrib * ACCOUNT_SPLIT[key];
        const dividendShare =
          opening > 0 ? dividend * (accounts[key] / opening) : dividend * ACCOUNT_SPLIT[key];
        accounts[key] += contribShare + dividendShare;
      }
    }

    totalContrib += annualContrib;
    totalDiv += dividend;

    if (yearsToTarget == null && endBalance >= target) {
      yearsToTarget = age - startAge;
    }

    years.push({
      age,
      monthlySalary: salary,
      employeeMonthly,
      employerMonthly,
      totalContribution: annualContrib,
      dividendCredited: dividend,
      endBalance,
    });

    balance = endBalance;
    salary = salary * (1 + grow);
  }

  // 4% safe-withdrawal rate, monthly income = balance × 4% / 12
  const monthlyRetirementIncome = (balance * 0.04) / 12;

  const tierReached: EpfProjection["tierReached"] =
    balance >= RIA_TIERS.enhanced
      ? "enhanced"
      : balance >= RIA_TIERS.adequate
        ? "adequate"
        : balance >= RIA_TIERS.basic
          ? "basic"
          : "none";

  return {
    inputs: input,
    finalBalance: balance,
    totalContributions: totalContrib,
    totalDividends: totalDiv,
    years,
    yearsToTarget,
    basicSavingsTarget: target,
    meetsTarget: balance >= target,
    monthlyRetirementIncome,
    accounts: consolidatedAt55 ? null : accounts,
    consolidatedAt55,
    riaTiers: RIA_TIERS,
    tierReached,
    basicSavingsIsEstimate:
      yearTurning60 != null && basicSavingsAt60(yearTurning60) < RIA_TIERS.basic,
  };
}

export const EPF_DEFAULTS: EpfInputs = {
  currentAge: 30,
  retirementAge: 60,
  currentBalance: 30000,
  monthlySalary: 5000,
  salaryGrowthRate: 4,
  dividendRate: 6.0,
  employeeRate: 11,
  voluntaryAnnual: 0,
  bonusMonths: 1,
};
