import { TAX_BRACKETS } from "./incomeTax";

export interface SalaryCalculationInputs {
  monthlySalary: number;
  annualBonus: number;
  otherRelief: number;
  epfRate: number;
  workerType: "malaysian" | "foreigner";
  residentStatus: "resident" | "non-resident";
}

function progressiveTax(annualChargeableIncome: number): number {
  const income = Math.max(0, annualChargeableIncome);
  let tax = 0;

  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    const current = TAX_BRACKETS[i];
    const next = TAX_BRACKETS[i + 1];
    const upper = next?.threshold ?? Infinity;
    if (income > current.threshold) {
      tax += (Math.min(income, upper) - current.threshold) * current.rate;
    }
  }

  return tax;
}

export function calculateSalary(input: SalaryCalculationInputs) {
  const annualGross = input.monthlySalary * 12 + input.annualBonus;
  const epfRate = input.epfRate / 100;
  const monthlyEpf = input.monthlySalary * epfRate;
  const bonusEpf = input.annualBonus * epfRate;
  const annualEpf = monthlyEpf * 12 + bonusEpf;

  // PERKESO's wage ceiling is RM6,000. The simple rates are capped at the
  // official ceiling-band employee amounts; the table itself rounds wage bands.
  const monthlySocso = input.workerType === "foreigner"
    ? 0
    : Math.min(Math.min(input.monthlySalary, 6000) * 0.005, 29.75);
  const monthlyEis = input.workerType === "foreigner"
    ? 0
    : Math.min(Math.min(input.monthlySalary, 6000) * 0.002, 11.9);
  const annualSocso = monthlySocso * 12;
  const annualEis = monthlyEis * 12;

  const epfRelief = Math.min(annualEpf, 4000);
  const personalRelief = input.residentStatus === "resident" ? 9000 : 0;
  const chargeableIncome = Math.max(
    0,
    annualGross - epfRelief - annualSocso - annualEis - personalRelief - input.otherRelief,
  );
  const annualIncomeTax =
    input.residentStatus === "non-resident" ? annualGross * 0.3 : progressiveTax(chargeableIncome);
  const monthlyTax = annualIncomeTax / 12;

  const monthlyDeductions = monthlyEpf + monthlySocso + monthlyEis + monthlyTax;
  const monthlyNet = input.monthlySalary - monthlyDeductions;

  return {
    annualGross,
    chargeableIncome,
    monthlyEpf,
    monthlySocso,
    monthlyEis,
    monthlyTax,
    monthlyDeductions,
    monthlyNet,
    annualIncomeTax,
    annualEpf,
    annualSocso,
    annualEis,
  };
}
