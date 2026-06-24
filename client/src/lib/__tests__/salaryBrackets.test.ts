import { describe, it, expect } from "vitest";
import {
  bracketForIncome,
  positionInDistribution,
  INCOME_BRACKETS,
} from "../salaryBrackets";

describe("bracketForIncome", () => {
  it("maps the DOSM 2024 bracket boundaries correctly", () => {
    expect(bracketForIncome(0).key).toBe("B40");
    expect(bracketForIncome(5858).key).toBe("B40");
    expect(bracketForIncome(5859).key).toBe("M40");
    expect(bracketForIncome(12681).key).toBe("M40");
    expect(bracketForIncome(12682).key).toBe("T20");
    expect(bracketForIncome(16516).key).toBe("T20");
    expect(bracketForIncome(16517).key).toBe("T10");
    expect(bracketForIncome(40194).key).toBe("T10");
    expect(bracketForIncome(40195).key).toBe("T1");
    expect(bracketForIncome(1_000_000).key).toBe("T1");
  });

  it("never returns undefined and stays within the defined brackets", () => {
    for (const income of [0, 100, 6000, 20000, 50000]) {
      const b = bracketForIncome(income);
      expect(INCOME_BRACKETS).toContain(b);
    }
  });
});

describe("positionInDistribution", () => {
  it("is 0 at or below zero income", () => {
    expect(positionInDistribution(0)).toBe(0);
    expect(positionInDistribution(-100)).toBe(0);
  });

  it("places the B40 ceiling at the 40th percentile", () => {
    expect(positionInDistribution(5858)).toBeCloseTo(40, 4);
  });

  it("places income just above the B40 ceiling just past 40%, not back near 0", () => {
    // RM 6,000 should land at ~40.8% across the full distribution.
    const pos = positionInDistribution(6000);
    expect(pos).toBeGreaterThan(40);
    expect(pos).toBeLessThan(42);
  });

  it("is monotonically non-decreasing in income", () => {
    let prev = -1;
    for (const income of [0, 1000, 5858, 6000, 12681, 16516, 40194, 80000, 200000]) {
      const pos = positionInDistribution(income);
      expect(pos).toBeGreaterThanOrEqual(prev);
      prev = pos;
    }
  });

  it("caps at 100 for very high incomes", () => {
    expect(positionInDistribution(500000)).toBe(100);
  });
});
