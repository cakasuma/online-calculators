import { describe, it, expect } from "vitest";
import { calculateCarLoan, approxEffectiveRate, CAR_LOAN_DEFAULTS } from "../carLoan";

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
