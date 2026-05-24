// EPF (KWSP) retirement projection engine.
//
// Given current age, current balance, salary, contribution rates, and growth
// assumptions, compounds year by year up to the user's chosen retirement age
// and returns both the headline projection and a year-by-year breakdown.
//
// Defaults align with KWSP standard contribution Schedule III (employee 11%,
// employer 12% above RM 5,000 wage, 13% at or below) and a 5.5% dividend
// (close to the historical 10-year average; KWSP has paid 5.5%–6.4% in
// recent years).

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

export function basicSavingsTargetAt(age: number): number {
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
  let balance = Math.max(0, input.currentBalance);
  let salary = Math.max(0, input.monthlySalary);
  const empRate = Math.max(0, Math.min(30, input.employeeRate)) / 100;
  const erRate = (input.employerRate ?? defaultEmployerRate(salary)) / 100;
  const div = Math.max(0, input.dividendRate) / 100;
  const grow = Math.max(0, input.salaryGrowthRate) / 100;
  const voluntary = Math.max(0, input.voluntaryAnnual);
  const bonusMonths = Math.max(0, Math.min(6, input.bonusMonths));

  const startAge = Math.max(15, Math.floor(input.currentAge));
  const endAge = Math.max(startAge + 1, Math.min(75, Math.floor(input.retirementAge)));

  let totalContrib = 0;
  let totalDiv = 0;
  let yearsToTarget: number | null = null;
  const target = basicSavingsTargetAt(endAge);

  for (let age = startAge + 1; age <= endAge; age++) {
    const employeeMonthly = salary * empRate;
    const erRateForYear = input.employerRate != null
      ? erRate
      : defaultEmployerRate(salary) / 100;
    const employerMonthly = salary * erRateForYear;
    const monthlyTotal = employeeMonthly + employerMonthly;
    const bonusContrib = salary * bonusMonths * (empRate + erRateForYear);
    const annualContrib = monthlyTotal * 12 + bonusContrib + voluntary;

    // Dividend is paid annually on the average balance during the year. We
    // approximate by crediting on (start + annualContrib/2) which is the
    // typical mid-year balance.
    const averageBalance = balance + annualContrib / 2;
    const dividend = averageBalance * div;
    const endBalance = balance + annualContrib + dividend;

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
  };
}

export const EPF_DEFAULTS: EpfInputs = {
  currentAge: 30,
  retirementAge: 60,
  currentBalance: 30000,
  monthlySalary: 5000,
  salaryGrowthRate: 4,
  dividendRate: 5.5,
  employeeRate: 11,
  voluntaryAnnual: 0,
  bonusMonths: 1,
};
