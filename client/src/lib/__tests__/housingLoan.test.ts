import { describe, it, expect } from "vitest";
import {
  buildSchedule,
  calculateHousingLoan,
  legalScale,
  motStampDuty,
  valuationFee,
  FIRST_HOME_EXEMPTION,
  FOREIGN_BUYER_MOT_RATE,
  HOUSING_LOAN_DEFAULTS,
  type HousingLoanInputs,
} from "../housingLoan";

/** A RM500k purchase, 10% down, 35 years at 4% — the calculator's default shape. */
const base: HousingLoanInputs = {
  price: 500000,
  rebatePct: 0,
  marginPct: 90,
  tenureYears: 35,
  rate: 4,
  buyerType: "citizen",
  firstHome: "no",
  developerAbsorbsLegal: false,
  motAbsorbedPct: 0,
  mrtaPremium: 0,
  financeMrta: false,
  extraMonthly: 0,
};

const inputs = (overrides: Partial<HousingLoanInputs> = {}): HousingLoanInputs => ({
  ...base,
  ...overrides,
});

describe("motStampDuty", () => {
  it("charges 1% on the first RM100,000", () => {
    expect(motStampDuty(100000)).toBeCloseTo(1000, 6);
  });

  it("charges 2% on the band up to RM500,000", () => {
    // 1% × 100,000 + 2% × 400,000 = 9,000
    expect(motStampDuty(500000)).toBeCloseTo(9000, 6);
  });

  it("charges 3% on the band up to RM1,000,000", () => {
    // 9,000 + 3% × 500,000 = 24,000
    expect(motStampDuty(1000000)).toBeCloseTo(24000, 6);
  });

  it("charges 4% above RM1,000,000", () => {
    // 24,000 + 4% × 200,000 = 32,000
    expect(motStampDuty(1200000)).toBeCloseTo(32000, 6);
  });

  it("is zero for a zero price", () => {
    expect(motStampDuty(0)).toBe(0);
  });
});

describe("legalScale", () => {
  it("charges 1.25% on the first RM500,000", () => {
    expect(legalScale(500000)).toBeCloseTo(6250, 6);
  });

  it("charges 1% on the next RM500,000", () => {
    expect(legalScale(1000000)).toBeCloseTo(11250, 6);
  });
});

describe("valuationFee", () => {
  it("charges 0.25% on the first RM100,000 then 0.2%", () => {
    // 250 + 0.2% × 400,000 = 1,050
    expect(valuationFee(500000)).toBeCloseTo(1050, 6);
  });
});

describe("stamp duty by buyer type", () => {
  it("charges a Malaysian citizen the normal tiers", () => {
    expect(calculateHousingLoan(inputs()).motDuty).toBeCloseTo(9000, 6);
  });

  it("charges a permanent resident the normal tiers, not the foreign rate", () => {
    expect(calculateHousingLoan(inputs({ buyerType: "pr" })).motDuty).toBeCloseTo(9000, 6);
  });

  it("charges a non-citizen a flat 8% that bypasses the tiers", () => {
    const r = calculateHousingLoan(inputs({ buyerType: "foreigner" }));
    expect(r.motDuty).toBeCloseTo(500000 * FOREIGN_BUYER_MOT_RATE, 6);
    expect(r.motDuty).toBeCloseTo(40000, 6);
  });

  it("applies the flat foreign rate from the first ringgit, unlike the tiers", () => {
    const foreign = calculateHousingLoan(inputs({ price: 100000, buyerType: "foreigner" }));
    expect(foreign.motDuty).toBeCloseTo(8000, 6);
  });
});

describe("first-home exemption", () => {
  it("exempts a citizen at exactly the threshold", () => {
    const r = calculateHousingLoan(inputs({ firstHome: "yes", price: FIRST_HOME_EXEMPTION.maxPrice }));
    expect(r.exempt).toBe(true);
    expect(r.motDuty).toBe(0);
    expect(r.loanDuty).toBe(0);
  });

  it("does not exempt one ringgit above the threshold", () => {
    const r = calculateHousingLoan(inputs({ firstHome: "yes", price: FIRST_HOME_EXEMPTION.maxPrice + 1 }));
    expect(r.exempt).toBe(false);
    expect(r.motDuty).toBeGreaterThan(0);
    expect(r.loanDuty).toBeGreaterThan(0);
  });

  it("denies the exemption to a permanent resident", () => {
    const r = calculateHousingLoan(inputs({ firstHome: "yes", buyerType: "pr" }));
    expect(r.exempt).toBe(false);
    expect(r.motDuty).toBeCloseTo(9000, 6);
  });

  it("denies the exemption to a non-citizen", () => {
    const r = calculateHousingLoan(inputs({ firstHome: "yes", buyerType: "foreigner" }));
    expect(r.exempt).toBe(false);
    expect(r.motDuty).toBeCloseTo(40000, 6);
  });

  it("saves RM11,250 on a RM500,000 first home", () => {
    const without = calculateHousingLoan(inputs({ firstHome: "no" }));
    const with_ = calculateHousingLoan(inputs({ firstHome: "yes" }));
    const saved = without.motDuty + without.loanDuty - (with_.motDuty + with_.loanDuty);
    expect(saved).toBeCloseTo(11250, 6);
  });
});

describe("developer rebate", () => {
  it("does not change the loan amount, stamp duty, or legal fees", () => {
    const none = calculateHousingLoan(inputs());
    const rebated = calculateHousingLoan(inputs({ rebatePct: 10 }));
    expect(rebated.loanAmount).toBe(none.loanAmount);
    expect(rebated.motDuty).toBe(none.motDuty);
    expect(rebated.loanDuty).toBe(none.loanDuty);
    expect(rebated.legalFees).toBe(none.legalFees);
    expect(rebated.monthlyInstallment).toBe(none.monthlyInstallment);
  });

  it("reduces net cash required by the rebate amount", () => {
    const none = calculateHousingLoan(inputs());
    const rebated = calculateHousingLoan(inputs({ rebatePct: 5 }));
    expect(rebated.rebateAmount).toBeCloseTo(25000, 6);
    expect(rebated.netCashRequired).toBeCloseTo(none.netCashRequired - 25000, 6);
  });

  it("floors net cash at zero and reports the surplus when the rebate over-covers", () => {
    const r = calculateHousingLoan(inputs({ rebatePct: 30 }));
    expect(r.netCashRequired).toBe(0);
    expect(r.rebateSurplus).toBeCloseTo(r.rebateAmount - r.grossUpfront, 6);
    expect(r.rebateSurplus).toBeGreaterThan(0);
  });

  it("reports no surplus when the rebate is smaller than upfront cost", () => {
    expect(calculateHousingLoan(inputs({ rebatePct: 5 })).rebateSurplus).toBe(0);
  });
});

describe("developer-absorbed fees", () => {
  it("zeroes the payable legal fee but keeps the gross figure visible", () => {
    const r = calculateHousingLoan(inputs({ developerAbsorbsLegal: true }));
    expect(r.legalFees).toBeGreaterThan(0);
    expect(r.payableLegal).toBe(0);
  });

  it("zeroes the payable MOT duty but keeps the gross figure visible", () => {
    const r = calculateHousingLoan(inputs({ motAbsorbedPct: 100 }));
    expect(r.motDuty).toBeCloseTo(9000, 6);
    expect(r.payableMot).toBe(0);
  });

  it("leaves the loan agreement duty with the buyer", () => {
    const r = calculateHousingLoan(inputs({ motAbsorbedPct: 100, developerAbsorbsLegal: true }));
    expect(r.payableLoanDuty).toBeCloseTo(r.loanDuty, 6);
    expect(r.payableLoanDuty).toBeGreaterThan(0);
  });

  it("waives only its own line, not the other", () => {
    const legalOnly = calculateHousingLoan(inputs({ developerAbsorbsLegal: true }));
    expect(legalOnly.payableMot).toBeCloseTo(9000, 6);
    const motOnly = calculateHousingLoan(inputs({ motAbsorbedPct: 100 }));
    expect(motOnly.payableLegal).toBeGreaterThan(0);
  });
});

describe("MRTA", () => {
  it("raises the instalment when financed into the loan", () => {
    const without = calculateHousingLoan(inputs());
    const financed = calculateHousingLoan(inputs({ mrtaPremium: 20000, financeMrta: true }));
    expect(financed.loanAmount).toBeCloseTo(without.loanAmount + 20000, 6);
    expect(financed.monthlyInstallment).toBeGreaterThan(without.monthlyInstallment);
    expect(financed.mrtaUpfront).toBe(0);
  });

  it("raises upfront cash instead when not financed", () => {
    const without = calculateHousingLoan(inputs());
    const upfront = calculateHousingLoan(inputs({ mrtaPremium: 20000, financeMrta: false }));
    expect(upfront.loanAmount).toBe(without.loanAmount);
    expect(upfront.monthlyInstallment).toBeCloseTo(without.monthlyInstallment, 6);
    expect(upfront.mrtaUpfront).toBe(20000);
    expect(upfront.grossUpfront).toBeCloseTo(without.grossUpfront + 20000, 6);
  });
});

describe("buildSchedule", () => {
  it("pays the loan down to zero by the end of the term", () => {
    const s = buildSchedule(450000, 4, 420, 0);
    expect(s.months).toBe(420);
    expect(s.years[s.years.length - 1].closingBalance).toBeCloseTo(0, 2);
  });

  it("returns one row per year of the term", () => {
    expect(buildSchedule(450000, 4, 420, 0).years).toHaveLength(35);
  });

  it("repays exactly the principal borrowed across all years", () => {
    const s = buildSchedule(450000, 4, 420, 0);
    const principal = s.years.reduce((sum, y) => sum + y.principalPaid, 0);
    expect(principal).toBeCloseTo(450000, 2);
  });

  it("carries the closing balance into the next year's opening balance", () => {
    const s = buildSchedule(450000, 4, 420, 0);
    for (let i = 1; i < s.years.length; i++) {
      expect(s.years[i].openingBalance).toBeCloseTo(s.years[i - 1].closingBalance, 6);
    }
  });

  it("shortens the term and cuts interest when extra principal is paid", () => {
    const plain = buildSchedule(450000, 4, 420, 0);
    const extra = buildSchedule(450000, 4, 420, 500);
    expect(extra.months).toBeLessThan(plain.months);
    expect(extra.totalInterest).toBeLessThan(plain.totalInterest);
  });

  it("handles a zero interest rate without dividing by zero", () => {
    const s = buildSchedule(120000, 0, 120, 0);
    expect(s.totalInterest).toBeCloseTo(0, 6);
    expect(s.years[s.years.length - 1].closingBalance).toBeCloseTo(0, 2);
  });
});

describe("extra repayment savings", () => {
  it("reports zero savings when no extra is paid", () => {
    const r = calculateHousingLoan(inputs());
    expect(r.interestSaved).toBe(0);
    expect(r.monthsSaved).toBe(0);
  });

  it("reports interest saved and months shaved off", () => {
    const r = calculateHousingLoan(inputs({ extraMonthly: 500 }));
    expect(r.interestSaved).toBeGreaterThan(0);
    expect(r.monthsSaved).toBeGreaterThan(0);
    expect(r.months).toBeLessThan(420);
  });
});

describe("calculateHousingLoan", () => {
  it("splits price into down payment and loan", () => {
    const r = calculateHousingLoan(inputs());
    expect(r.downPayment).toBeCloseTo(50000, 6);
    expect(r.loanAmount).toBeCloseTo(450000, 6);
  });

  it("charges 0.5% loan agreement duty on the amount financed", () => {
    expect(calculateHousingLoan(inputs()).loanDuty).toBeCloseTo(2250, 6);
  });

  it("bills legal fees on both the SPA and the loan agreement", () => {
    // 1.25% × 500,000 + 1.25% × 450,000 = 6,250 + 5,625
    expect(calculateHousingLoan(inputs()).legalFees).toBeCloseTo(11875, 6);
  });

  it("sums gross upfront from every cash line", () => {
    const r = calculateHousingLoan(inputs());
    const expected =
      r.downPayment + r.payableMot + r.payableLoanDuty + r.payableLegal +
      r.valuationFee + r.disbursements + r.mrtaUpfront;
    expect(r.grossUpfront).toBeCloseTo(expected, 6);
  });

  it("spreads a zero-rate loan evenly with no interest", () => {
    const r = calculateHousingLoan(inputs({ rate: 0 }));
    expect(r.totalInterest).toBeCloseTo(0, 2);
    expect(r.monthlyInstallment).toBeCloseTo(450000 / 420, 6);
  });

  it("clamps the margin of finance to 0-100", () => {
    expect(calculateHousingLoan(inputs({ marginPct: -50 })).loanAmount).toBe(0);
    expect(calculateHousingLoan(inputs({ marginPct: 150 })).downPayment).toBe(0);
  });

  it("ships defaults that produce a usable result", () => {
    const r = calculateHousingLoan(HOUSING_LOAN_DEFAULTS);
    expect(r.monthlyInstallment).toBeGreaterThan(0);
    expect(r.netCashRequired).toBeGreaterThan(0);
  });
});

describe("margin of finance", () => {
  it("derives the loan from the margin rather than a down payment", () => {
    const r = calculateHousingLoan(inputs({ marginPct: 80 }));
    expect(r.loanAmount).toBeCloseTo(400000, 6);
    expect(r.downPayment).toBeCloseTo(100000, 6);
    expect(r.marginPct).toBe(80);
  });

  it("lends the full price at a 100% margin", () => {
    const r = calculateHousingLoan(inputs({ marginPct: 100 }));
    expect(r.downPayment).toBe(0);
    expect(r.loanAmount).toBeCloseTo(500000, 6);
  });

  it("moves the loan amount when the margin moves", () => {
    const ninety = calculateHousingLoan(inputs({ marginPct: 90 }));
    const eighty = calculateHousingLoan(inputs({ marginPct: 80 }));
    expect(eighty.loanAmount).toBeLessThan(ninety.loanAmount);
    expect(eighty.downPayment).toBeGreaterThan(ninety.downPayment);
    // A smaller loan also means less loan agreement duty and a smaller instalment.
    expect(eighty.loanDuty).toBeLessThan(ninety.loanDuty);
    expect(eighty.monthlyInstallment).toBeLessThan(ninety.monthlyInstallment);
  });
});

describe("partial MOT absorption", () => {
  it("halves the payable duty when the developer covers half", () => {
    // A foreign buyer's flat 8% becomes an effective 4%.
    const r = calculateHousingLoan(inputs({ buyerType: "foreigner", motAbsorbedPct: 50 }));
    expect(r.motDuty).toBeCloseTo(40000, 6);
    expect(r.payableMot).toBeCloseTo(20000, 6);
    expect(r.motAbsorbed).toBeCloseTo(20000, 6);
  });

  it("leaves the whole duty payable at zero absorption", () => {
    const r = calculateHousingLoan(inputs({ motAbsorbedPct: 0 }));
    expect(r.payableMot).toBeCloseTo(r.motDuty, 6);
    expect(r.motAbsorbed).toBe(0);
  });

  it("waives the whole duty at full absorption", () => {
    const r = calculateHousingLoan(inputs({ motAbsorbedPct: 100 }));
    expect(r.payableMot).toBe(0);
    expect(r.motAbsorbed).toBeCloseTo(r.motDuty, 6);
  });

  it("keeps the gross duty visible whatever the developer covers", () => {
    const r = calculateHousingLoan(inputs({ motAbsorbedPct: 30 }));
    expect(r.motDuty).toBeCloseTo(9000, 6);
    expect(r.payableMot + r.motAbsorbed).toBeCloseTo(r.motDuty, 6);
  });

  it("clamps the absorbed share to 0-100", () => {
    expect(calculateHousingLoan(inputs({ motAbsorbedPct: -20 })).payableMot).toBeCloseTo(9000, 6);
    expect(calculateHousingLoan(inputs({ motAbsorbedPct: 200 })).payableMot).toBe(0);
  });

  it("absorbs nothing when the buyer is already exempt", () => {
    const r = calculateHousingLoan(inputs({ firstHome: "yes", motAbsorbedPct: 100 }));
    expect(r.motDuty).toBe(0);
    expect(r.motAbsorbed).toBe(0);
    expect(r.payableMot).toBe(0);
  });

  it("reduces net cash by the share the developer covers", () => {
    const none = calculateHousingLoan(inputs({ motAbsorbedPct: 0 }));
    const half = calculateHousingLoan(inputs({ motAbsorbedPct: 50 }));
    expect(half.netCashRequired).toBeCloseTo(none.netCashRequired - 4500, 6);
  });
});
