import { describe, it, expect } from "vitest";
import { calculateCarLoan, approxEffectiveRate, CAR_LOAN_DEFAULTS, type CarLoanInputs } from "../carLoan";

describe("calculateCarLoan", () => {
  it("computes a textbook flat-rate hire purchase", () => {
    // RM 90,000 car, 10% down → RM 81,000 financed, 3% flat over 9 years.
    const r = calculateCarLoan({ price: 90000, downPct: 10, flatRate: 3, tenureYears: 9 });
    expect(r.downPayment).toBe(9000);
    expect(r.loanAmount).toBe(81000);
    // interest = 81,000 × 0.03 × 9 = 21,870
    expect(r.totalInterest).toBeCloseTo(21870, 6);
    expect(r.totalPayable).toBeCloseTo(102870, 6);
    expect(r.months).toBe(108);
    // monthly = 102,870 / 108 = 952.5
    expect(r.monthlyInstalment).toBeCloseTo(952.5, 6);
  });

  it("flat rate makes the effective rate roughly double the headline", () => {
    const r = calculateCarLoan({ price: 90000, downPct: 10, flatRate: 3, tenureYears: 9 });
    // For long tenures the effective reducing-balance rate ≈ 2× the flat rate.
    expect(r.effectiveRate).toBeGreaterThan(5.5);
    expect(r.effectiveRate).toBeLessThan(6.5);
  });

  it("handles a zero interest rate (no finance charge)", () => {
    const r = calculateCarLoan({ price: 60000, downPct: 0, flatRate: 0, tenureYears: 5 });
    expect(r.totalInterest).toBe(0);
    expect(r.totalPayable).toBe(60000);
    expect(r.monthlyInstalment).toBeCloseTo(1000, 6);
    expect(r.effectiveRate).toBe(0);
  });

  it("clamps down payment percentage to 0–100", () => {
    const over = calculateCarLoan({ price: 50000, downPct: 150, flatRate: 3, tenureYears: 5 });
    expect(over.downPayment).toBe(50000);
    expect(over.loanAmount).toBe(0);
    const under = calculateCarLoan({ price: 50000, downPct: -20, flatRate: 3, tenureYears: 5 });
    expect(under.downPayment).toBe(0);
    expect(under.loanAmount).toBe(50000);
  });

  it("returns zero instalment when tenure is zero", () => {
    const r = calculateCarLoan({ price: 50000, downPct: 10, flatRate: 3, tenureYears: 0 });
    expect(r.months).toBe(0);
    expect(r.monthlyInstalment).toBe(0);
    expect(r.effectiveRate).toBe(0);
  });

  it("ships sane defaults", () => {
    const r = calculateCarLoan(CAR_LOAN_DEFAULTS);
    expect(r.monthlyInstalment).toBeGreaterThan(0);
    expect(r.loanAmount).toBe(81000);
  });
});

describe("approxEffectiveRate", () => {
  it("returns 0 for degenerate inputs", () => {
    expect(approxEffectiveRate(0, 100, 12)).toBe(0);
    expect(approxEffectiveRate(1000, 100, 0)).toBe(0);
  });

  it("matches the N-ratio formula for a known case", () => {
    // principal 81,000, interest 21,870, 108 payments
    // APR ≈ (2 × 12 × 21,870) / (81,000 × 109) × 100
    const expected = (2 * 12 * 21870) / (81000 * 109) * 100;
    expect(approxEffectiveRate(81000, 21870, 108)).toBeCloseTo(expected, 9);
  });
});

// ─── Post-amendment behaviour ─────────────────────────────────────────────────
// The Hire-Purchase (Amendment) Act commenced 1 June 2026, abolishing the flat
// rate and the Rule of 78 for new agreements. Both remain live for pre-June-2026
// agreements, so the engine models each regime.

describe("reducing-balance regime", () => {
  const reducing = (over: Partial<CarLoanInputs> = {}): CarLoanInputs => ({
    price: 90000,
    downPct: 10,
    flatRate: 4.5,
    tenureYears: 9,
    regime: "reducing",
    ...over,
  });

  it("charges interest only on the outstanding balance", () => {
    const r = calculateCarLoan(reducing());
    // A flat 4.5% over 9 years would charge 81,000 × 0.045 × 9 = 32,805.
    expect(r.totalInterest).toBeLessThan(32805 * 0.6);
    expect(r.totalInterest).toBeGreaterThan(0);
  });

  it("ties total payable to the instalment stream", () => {
    const r = calculateCarLoan(reducing());
    expect(r.monthlyInstalment * r.months).toBeCloseTo(r.totalPayable, 2);
    expect(r.totalPayable - r.loanAmount).toBeCloseTo(r.totalInterest, 2);
  });

  it("reports the effective rate as the annualised monthly rate", () => {
    // (1 + 0.045/12)^12 - 1 = 4.594%
    expect(calculateCarLoan(reducing()).effectiveRate).toBeCloseTo(4.59, 2);
  });

  it("pays the loan down to zero across the schedule", () => {
    const r = calculateCarLoan(reducing());
    expect(r.schedule).toHaveLength(9);
    expect(r.schedule[r.schedule.length - 1].closingBalance).toBeCloseTo(0, 2);
  });

  it("repays exactly the principal borrowed", () => {
    const r = calculateCarLoan(reducing());
    const principal = r.schedule.reduce((sum, y) => sum + y.principalPaid, 0);
    expect(principal).toBeCloseTo(r.loanAmount, 2);
  });

  it("grants no Rule of 78 rebate, because early settlement just stops interest", () => {
    const r = calculateCarLoan(reducing({ settleAfterMonths: 36 }));
    expect(r.settlement?.rebate).toBe(0);
    expect(r.settlement?.goodwillDiscount).toBe(0);
  });

  it("settles at the outstanding balance", () => {
    const r = calculateCarLoan(reducing({ settleAfterMonths: 36 }));
    expect(r.settlement?.amountToSettle).toBeCloseTo(r.schedule[2].closingBalance, 2);
  });

  it("costs far less than the same headline rate charged flat", () => {
    const flat = calculateCarLoan({ price: 90000, downPct: 10, flatRate: 4.5, tenureYears: 9, regime: "flat" });
    const red = calculateCarLoan(reducing());
    expect(red.totalInterest).toBeLessThan(flat.totalInterest);
  });
});

describe("Rule of 78 early settlement", () => {
  const flat = (over: Partial<CarLoanInputs> = {}): CarLoanInputs => ({
    price: 90000,
    downPct: 10,
    flatRate: 3,
    tenureYears: 9,
    regime: "flat",
    ...over,
  });

  it("rebates the whole term charge when settling before any instalment", () => {
    const r = calculateCarLoan(flat({ settleAfterMonths: 0 }));
    expect(r.settlement?.rebate).toBeCloseTo(r.totalInterest, 6);
  });

  it("rebates nothing when settling at the end of the term", () => {
    const r = calculateCarLoan(flat({ settleAfterMonths: 108 }));
    expect(r.settlement?.rebate).toBeCloseTo(0, 6);
  });

  it("follows the statutory sum-of-digits formula", () => {
    // TC × n(n+1) / N(N+1), n = 72 months remaining of N = 108.
    const r = calculateCarLoan(flat({ settleAfterMonths: 36 }));
    const expected = 21870 * (72 * 73) / (108 * 109);
    expect(r.settlement?.rebate).toBeCloseTo(expected, 6);
    expect(r.settlement?.rebate).toBeCloseTo(9764.59, 1);
  });

  it("settles at total payable less instalments paid less rebate", () => {
    const r = calculateCarLoan(flat({ settleAfterMonths: 36 }));
    const paid = r.monthlyInstalment * 36;
    expect(r.settlement?.amountToSettle).toBeCloseTo(r.totalPayable - paid - (r.settlement?.rebate ?? 0), 6);
  });

  it("front-loads interest, so it costs more than reducing balance mid-term", () => {
    const r = calculateCarLoan(flat({ settleAfterMonths: 36 }));
    expect(r.settlement!.amountToSettle).toBeGreaterThan(r.settlement!.reducingComparison);
    expect(r.settlement!.goodwillDiscount).toBeGreaterThan(0);
  });

  it("quantifies the goodwill discount as the gap to reducing balance", () => {
    const r = calculateCarLoan(flat({ settleAfterMonths: 36 }));
    expect(r.settlement!.goodwillDiscount).toBeCloseTo(
      r.settlement!.amountToSettle - r.settlement!.reducingComparison,
      6,
    );
  });

  it("closes the gap as the term runs out", () => {
    const early = calculateCarLoan(flat({ settleAfterMonths: 12 }));
    const late = calculateCarLoan(flat({ settleAfterMonths: 96 }));
    expect(late.settlement!.goodwillDiscount).toBeLessThan(early.settlement!.goodwillDiscount);
  });

  it("reports the interest actually saved by settling early", () => {
    const r = calculateCarLoan(flat({ settleAfterMonths: 36 }));
    expect(r.settlement?.interestSaved).toBeCloseTo(r.settlement?.rebate ?? 0, 6);
  });

  it("clamps a settlement month beyond the term", () => {
    const r = calculateCarLoan(flat({ settleAfterMonths: 999 }));
    expect(r.settlement?.afterMonths).toBe(108);
    expect(r.settlement?.rebate).toBeCloseTo(0, 6);
  });

  it("omits the settlement block when no early settlement is requested", () => {
    expect(calculateCarLoan(flat()).settlement).toBeUndefined();
  });
});

describe("regime default", () => {
  it("stays on the flat basis when no regime is given, preserving old behaviour", () => {
    const r = calculateCarLoan({ price: 90000, downPct: 10, flatRate: 3, tenureYears: 9 });
    expect(r.regime).toBe("flat");
    expect(r.totalInterest).toBeCloseTo(21870, 6);
  });

  it("defaults new scenarios to the post-amendment reducing basis", () => {
    expect(CAR_LOAN_DEFAULTS.regime).toBe("reducing");
  });
});
