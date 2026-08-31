// Shared reducing-balance amortisation, used by any loan that charges interest
// on the outstanding balance rather than the original principal.

/** One calendar year of a repayment schedule. */
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
export function instalmentFor(principal: number, monthlyRate: number, months: number): number {
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

/**
 * Outstanding balance after `monthsPaid` instalments on a reducing-balance loan.
 *
 * Closed form rather than an iteration, so it can be called cheaply for a
 * settlement figure at any point in the term.
 */
export function outstandingAfter(
  principal: number,
  monthlyRate: number,
  instalment: number,
  monthsPaid: number,
): number {
  const m = Math.max(0, monthsPaid);
  if (monthlyRate === 0) return Math.max(0, principal - instalment * m);
  const growth = Math.pow(1 + monthlyRate, m);
  return Math.max(0, principal * growth - instalment * ((growth - 1) / monthlyRate));
}

/**
 * The monthly rate implied by repaying `principal` in `months` equal
 * instalments — the true cost of a loan quoted some other way.
 *
 * Solved by bisection because the annuity equation has no closed form in the
 * rate. Returns 0 when the instalments only repay the principal.
 */
export function impliedMonthlyRate(principal: number, instalment: number, months: number): number {
  if (principal <= 0 || months <= 0 || instalment <= 0) return 0;
  if (instalment * months <= principal) return 0;

  let low = 0;
  let high = 1; // 100% a month is far above any real financing rate
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    // Present value of the instalment stream at the trial rate.
    const pv = mid === 0 ? instalment * months : instalment * (1 - Math.pow(1 + mid, -months)) / mid;
    if (pv > principal) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
