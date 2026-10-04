import { describe, it, expect } from "vitest";
import { calculateFixedDeposit, PIDM_LIMIT, FIXED_DEPOSIT_DEFAULTS } from "../fixedDeposit";

describe("calculateFixedDeposit", () => {
  it("computes simple interest pro-rated to the tenure", () => {
    // RM 10,000 at 3.5% p.a. for 12 months → RM 350 interest.
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 12 });
    expect(r.interest).toBeCloseTo(350, 6);
    expect(r.maturityValue).toBeCloseTo(10350, 6);
    expect(r.monthlyInterest).toBeCloseTo(350 / 12, 6);
  });

  it("pro-rates a partial-year tenure", () => {
    // RM 20,000 at 3% p.a. for 6 months → 20,000 × 0.03 × 0.5 = RM 300.
    const r = calculateFixedDeposit({ principal: 20000, annualRate: 3, tenureMonths: 6 });
    expect(r.interest).toBeCloseTo(300, 6);
    expect(r.maturityValue).toBeCloseTo(20300, 6);
  });

  it("zero rate yields no interest", () => {
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 0, tenureMonths: 12 });
    expect(r.interest).toBe(0);
    expect(r.maturityValue).toBe(10000);
    expect(r.compoundingBonus).toBe(0);
  });

  it("guards against negative inputs", () => {
    const r = calculateFixedDeposit({ principal: -5000, annualRate: -2, tenureMonths: -6 });
    expect(r.principal).toBe(0);
    expect(r.interest).toBe(0);
    expect(r.maturityValue).toBe(0);
    expect(r.monthlyInterest).toBe(0);
  });

  it("ships sane defaults", () => {
    const r = calculateFixedDeposit(FIXED_DEPOSIT_DEFAULTS);
    expect(r.maturityValue).toBeGreaterThan(r.principal);
  });
});

// A fixed deposit pays simple interest at maturity. Nothing compounds inside a
// tenure — compounding only happens when the deposit is renewed and the interest
// is rolled into the new principal.
describe("compounding only on renewal", () => {
  it("earns no compounding bonus on a single placement", () => {
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 12 });
    expect(r.compoundingBonus).toBe(0);
    expect(r.finalValue).toBeCloseTo(r.maturityValue, 6);
  });

  it("earns no compounding bonus when cycles is explicitly one", () => {
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 12, cycles: 1 });
    expect(r.compoundingBonus).toBe(0);
  });

  it("compounds once per completed tenure when renewed", () => {
    // Two 12-month cycles at 3.5%: 10,000 → 10,350 → 10,712.25
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 12, cycles: 2 });
    expect(r.finalValue).toBeCloseTo(10712.25, 6);
    expect(r.totalMonths).toBe(24);
  });

  it("measures the bonus against simple interest over the same period", () => {
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 12, cycles: 2 });
    // Simple over 24 months would be 10,000 + 700 = 10,700.
    expect(r.compoundingBonus).toBeCloseTo(10712.25 - 10700, 6);
  });

  it("compounds per tenure, not per month", () => {
    // Monthly compounding would give 10,000 × (1 + 0.035/12)^12 ≈ 10,355.67.
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 12, cycles: 1 });
    expect(r.finalValue).toBeLessThan(10355);
    expect(r.finalValue).toBeCloseTo(10350, 6);
  });

  it("grows a short tenure faster when rolled over many times", () => {
    const rolled = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 3, cycles: 8 });
    const once = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 24, cycles: 1 });
    expect(rolled.totalMonths).toBe(once.totalMonths);
    expect(rolled.finalValue).toBeGreaterThan(once.finalValue);
  });
});

describe("effective annual return", () => {
  it("matches the headline rate for a single one-year placement", () => {
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 12 });
    expect(r.effectiveAnnualRate).toBeCloseTo(3.5, 6);
  });

  it("still matches the headline rate when a one-year tenure is rolled over", () => {
    // Compounding once a year at 3.5% annualises to exactly 3.5%.
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 12, cycles: 3 });
    expect(r.effectiveAnnualRate).toBeCloseTo(3.5, 6);
  });

  it("exceeds the headline rate when a shorter tenure is rolled over within a year", () => {
    // Four 3-month cycles compound quarterly: (1 + 0.035/4)^4 - 1 = 3.546%.
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 3, cycles: 4 });
    expect(r.effectiveAnnualRate).toBeGreaterThan(3.5);
    expect(r.effectiveAnnualRate).toBeCloseTo(3.546, 3);
  });

  it("is zero on a zero rate", () => {
    expect(calculateFixedDeposit({ principal: 10000, annualRate: 0, tenureMonths: 12 }).effectiveAnnualRate).toBe(0);
  });
});

describe("early withdrawal", () => {
  const fd = (withdrawAfterMonths: number) =>
    calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 12, withdrawAfterMonths });

  it("pays no interest at all before three completed months", () => {
    const r = fd(2);
    expect(r.earlyWithdrawal?.interestPaid).toBe(0);
    expect(r.earlyWithdrawal?.ratePaidPct).toBe(0);
    expect(r.earlyWithdrawal?.amountReceived).toBeCloseTo(10000, 6);
  });

  it("pays half the contracted rate from the third completed month", () => {
    const r = fd(6);
    // 10,000 × 1.75% × 6/12 = 87.50
    expect(r.earlyWithdrawal?.ratePaidPct).toBeCloseTo(1.75, 6);
    expect(r.earlyWithdrawal?.interestPaid).toBeCloseTo(87.5, 6);
    expect(r.earlyWithdrawal?.amountReceived).toBeCloseTo(10087.5, 6);
  });

  it("counts only completed months", () => {
    const partial = fd(6.9);
    expect(partial.earlyWithdrawal?.completedMonths).toBe(6);
    expect(partial.earlyWithdrawal?.interestPaid).toBeCloseTo(87.5, 6);
  });

  it("reports the interest given up against holding to maturity", () => {
    const r = fd(6);
    expect(r.earlyWithdrawal?.interestForfeited).toBeCloseTo(350 - 87.5, 6);
  });

  it("treats withdrawal at or beyond the tenure as a normal maturity", () => {
    const r = fd(12);
    expect(r.earlyWithdrawal?.interestPaid).toBeCloseTo(350, 6);
    expect(r.earlyWithdrawal?.interestForfeited).toBeCloseTo(0, 6);
  });

  it("is absent when no early withdrawal is modelled", () => {
    expect(calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 12 }).earlyWithdrawal).toBeUndefined();
  });
});

describe("PIDM coverage", () => {
  it("reports a placement inside the limit as covered", () => {
    const r = calculateFixedDeposit({ principal: 100000, annualRate: 3.5, tenureMonths: 12 });
    expect(r.pidm.covered).toBe(true);
    expect(r.pidm.excess).toBe(0);
    expect(r.pidm.limit).toBe(PIDM_LIMIT);
  });

  it("counts interest towards the limit, not just the principal", () => {
    // RM 248,000 is under the cap, but matures above it.
    const r = calculateFixedDeposit({ principal: 248000, annualRate: 3.5, tenureMonths: 12 });
    expect(r.principal).toBeLessThan(PIDM_LIMIT);
    expect(r.pidm.covered).toBe(false);
    expect(r.pidm.excess).toBeCloseTo(r.finalValue - PIDM_LIMIT, 6);
  });

  it("measures coverage at the end of the full holding period", () => {
    const r = calculateFixedDeposit({ principal: 240000, annualRate: 3.5, tenureMonths: 12, cycles: 2 });
    expect(r.pidm.excess).toBeCloseTo(r.finalValue - PIDM_LIMIT, 6);
  });
});
