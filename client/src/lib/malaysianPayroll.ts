import { INDIVIDUAL_REBATE, RELIEF_CAPS, TAX_BRACKETS } from "./incomeTax";

export interface SalaryCalculationInputs {
  monthlySalary: number;
  annualBonus: number;
  otherRelief: number;
  epfRate: number;
  workerType: "malaysian" | "foreigner";
  residentStatus: "resident" | "non-resident";
  /** SKBBK / Lindung 24 Jam (0.75% employee deduction). Defaults to true. */
  includeSkbbk?: boolean;
}

/** PERKESO contribution wage ceiling (RM / month). */
export const PERKESO_WAGE_CEILING = 6000;
/** SKBBK (Lindung 24 Jam) Phase 1 employee rate, from 1 June 2026. */
export const SKBBK_RATE = 0.0075;
export const SOCSO_EMPLOYEE_RATE = 0.005;
export const SOCSO_EMPLOYER_RATE = 0.0175;
/** Foreign workers: employment injury scheme only, employer-paid (since 1 Oct 2024). */
export const SOCSO_FOREIGN_EMPLOYER_RATE = 0.0125;
export const EIS_RATE = 0.002;
/** Mandatory EPF for foreign workers from 1 Aug 2025: 2% employee, 2% employer. */
export const FOREIGN_EPF_RATE = 2;

// Upper edge and midpoint of the PERKESO bands below RM200; above that the
// table moves in RM100 steps and contributions use the band midpoint.
const LOW_BANDS: [upper: number, mid: number][] = [
  [30, 15], [50, 40], [70, 60], [100, 85], [140, 120], [200, 170],
];

/** Wage on which PERKESO computes contributions: the midpoint of the wage band. */
export function perkesoWageBase(monthlyWage: number): number {
  if (!(monthlyWage > 0)) return 0;
  const wage = Math.min(monthlyWage, PERKESO_WAGE_CEILING);
  const low = LOW_BANDS.find(([upper]) => wage <= upper);
  if (low) return low[1];
  return Math.ceil(wage / 100) * 100 - 50;
}

const roundUpTo5Sen = (value: number) => Math.ceil(Math.round(value * 1000) / 50) / 20;

export function employeeSocso(monthlyWage: number): number {
  return roundUpTo5Sen(perkesoWageBase(monthlyWage) * SOCSO_EMPLOYEE_RATE);
}

export function employerSocso(monthlyWage: number, foreign = false): number {
  const rate = foreign ? SOCSO_FOREIGN_EMPLOYER_RATE : SOCSO_EMPLOYER_RATE;
  return roundUpTo5Sen(perkesoWageBase(monthlyWage) * rate);
}

export function eisContribution(monthlyWage: number): number {
  return roundUpTo5Sen(perkesoWageBase(monthlyWage) * EIS_RATE);
}

export function skbbkContribution(monthlyWage: number): number {
  if (!(monthlyWage > 0)) return 0;
  return Math.round(Math.min(monthlyWage, PERKESO_WAGE_CEILING) * SKBBK_RATE * 100) / 100;
}

/** Employer EPF rate (%): 13% up to RM5,000, 12% above; foreign workers 2%. */
export function employerEpfRate(monthlySalary: number, workerType: "malaysian" | "foreigner"): number {
  if (workerType === "foreigner") return FOREIGN_EPF_RATE;
  return monthlySalary <= 5000 ? 13 : 12;
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
  const foreign = input.workerType === "foreigner";
  const annualGross = input.monthlySalary * 12 + input.annualBonus;
  const epfRate = input.epfRate / 100;
  const monthlyEpf = input.monthlySalary * epfRate;
  const bonusEpf = input.annualBonus * epfRate;
  const annualEpf = monthlyEpf * 12 + bonusEpf;

  // Foreign workers pay no employee SOCSO/EIS (employer-only injury cover).
  const monthlySocso = foreign ? 0 : employeeSocso(input.monthlySalary);
  const monthlyEis = foreign ? 0 : eisContribution(input.monthlySalary);
  const monthlySkbbk = foreign || input.includeSkbbk === false ? 0 : skbbkContribution(input.monthlySalary);
  const annualSocso = monthlySocso * 12;
  const annualEis = monthlyEis * 12;

  const resident = input.residentStatus === "resident";
  const epfRelief = resident ? Math.min(annualEpf, RELIEF_CAPS.epf) : 0;
  const socsoEisRelief = resident ? Math.min(annualSocso + annualEis, RELIEF_CAPS.socsoEis) : 0;
  const personalRelief = resident ? RELIEF_CAPS.personal : 0;
  const chargeableIncome = Math.max(
    0,
    annualGross - epfRelief - socsoEisRelief - personalRelief - (resident ? input.otherRelief : 0),
  );
  let annualIncomeTax = resident ? progressiveTax(chargeableIncome) : annualGross * 0.3;
  if (resident && chargeableIncome <= INDIVIDUAL_REBATE.threshold) {
    annualIncomeTax = Math.max(0, annualIncomeTax - INDIVIDUAL_REBATE.amount);
  }
  const monthlyTax = annualIncomeTax / 12;

  const monthlyDeductions = monthlyEpf + monthlySocso + monthlyEis + monthlySkbbk + monthlyTax;
  const monthlyNet = input.monthlySalary - monthlyDeductions;

  // Employer side: statutory contributions on top of gross pay (HRD Corp levy excluded).
  const employerEpfPct = employerEpfRate(input.monthlySalary, input.workerType);
  const monthlyEmployerEpf = (input.monthlySalary * employerEpfPct) / 100;
  const annualEmployerEpf = monthlyEmployerEpf * 12 + (input.annualBonus * employerEpfPct) / 100;
  const monthlyEmployerSocso = employerSocso(input.monthlySalary, foreign);
  const monthlyEmployerEis = foreign ? 0 : eisContribution(input.monthlySalary);
  const annualEmployerCost =
    annualGross + annualEmployerEpf + (monthlyEmployerSocso + monthlyEmployerEis) * 12;

  return {
    annualGross,
    chargeableIncome,
    monthlyEpf,
    monthlySocso,
    monthlyEis,
    monthlySkbbk,
    monthlyTax,
    monthlyDeductions,
    monthlyNet,
    annualIncomeTax,
    annualEpf,
    annualSocso,
    annualEis,
    employerEpfPct,
    monthlyEmployerEpf,
    monthlyEmployerSocso,
    monthlyEmployerEis,
    annualEmployerCost,
    monthlyEmployerCost: annualEmployerCost / 12,
  };
}
