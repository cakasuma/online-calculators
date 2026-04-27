import { AlertTriangle, Download, Info, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ResidentStatus = "resident" | "non-resident";
type WorkerType = "malaysian" | "foreigner";

interface SalaryInputs {
  monthlySalary: number;
  annualBonus: number;
  otherRelief: number;
  epfRate: number;
  workerType: WorkerType;
  residentStatus: ResidentStatus;
}

interface InputErrors {
  monthlySalary?: string;
  annualBonus?: string;
  otherRelief?: string;
  epfRate?: string;
}

const DEFAULT_INPUTS: SalaryInputs = {
  monthlySalary: 6000,
  annualBonus: 0,
  otherRelief: 0,
  epfRate: 11,
  workerType: "malaysian",
  residentStatus: "resident",
};

const money = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const TAX_BRACKETS = [
  { threshold: 0, rate: 0 },
  { threshold: 5000, rate: 0.01 },
  { threshold: 20000, rate: 0.03 },
  { threshold: 35000, rate: 0.06 },
  { threshold: 50000, rate: 0.11 },
  { threshold: 70000, rate: 0.19 },
  { threshold: 100000, rate: 0.25 },
  { threshold: 400000, rate: 0.26 },
  { threshold: 600000, rate: 0.28 },
  { threshold: 2000000, rate: 0.3 },
];

function toInputString(value: number): string {
  return value === 0 ? "" : String(value);
}

function parseNumberInput(value: string): number {
  if (!value.trim()) return 0;
  const normalized = value.replace(/[,_\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function progressiveTax(annualChargeableIncome: number) {
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

function calculateSalary(input: SalaryInputs) {
  const annualGross = input.monthlySalary * 12 + input.annualBonus;
  const epfRate = input.workerType === "foreigner" ? 0.02 : input.epfRate / 100;
  const monthlyEpf = input.monthlySalary * epfRate;
  const bonusEpf = input.annualBonus * epfRate;
  const annualEpf = monthlyEpf * 12 + bonusEpf;

  const monthlySocso = input.workerType === "foreigner" ? 0 : Math.min(input.monthlySalary, 6000) * 0.005;
  const monthlyEis = input.workerType === "foreigner" ? 0 : Math.min(input.monthlySalary, 6000) * 0.002;
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
  };
}

function validateInputs(input: SalaryInputs): InputErrors {
  const errors: InputErrors = {};

  if (input.monthlySalary <= 0) {
    errors.monthlySalary = "Monthly gross salary must be greater than 0.";
  }

  if (input.annualBonus < 0) {
    errors.annualBonus = "Annual bonus cannot be negative.";
  }

  if (input.otherRelief < 0) {
    errors.otherRelief = "Other annual relief cannot be negative.";
  }

  if (input.workerType === "malaysian" && (input.epfRate < 0 || input.epfRate > 15)) {
    errors.epfRate = "EPF employee rate must be between 0% and 15%.";
  }

  return errors;
}

function NumberField({
  label,
  value,
  onChange,
  hint,
  error,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:ring-4 dark:bg-slate-950 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10 dark:border-red-500/70"
            : "border-slate-200 focus:border-primary focus:ring-primary/10 dark:border-slate-800"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      />
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export default function SalaryCalculator() {
  const [monthlySalaryInput, setMonthlySalaryInput] = useState(toInputString(DEFAULT_INPUTS.monthlySalary));
  const [annualBonusInput, setAnnualBonusInput] = useState(toInputString(DEFAULT_INPUTS.annualBonus));
  const [otherReliefInput, setOtherReliefInput] = useState(toInputString(DEFAULT_INPUTS.otherRelief));
  const [epfRateInput, setEpfRateInput] = useState(toInputString(DEFAULT_INPUTS.epfRate));
  const [workerType, setWorkerType] = useState<WorkerType>(DEFAULT_INPUTS.workerType);
  const [residentStatus, setResidentStatus] = useState<ResidentStatus>(DEFAULT_INPUTS.residentStatus);

  const parsedInput = useMemo<SalaryInputs>(
    () => ({
      monthlySalary: Math.max(0, parseNumberInput(monthlySalaryInput) || 0),
      annualBonus: Math.max(0, parseNumberInput(annualBonusInput) || 0),
      otherRelief: Math.max(0, parseNumberInput(otherReliefInput) || 0),
      epfRate: workerType === "foreigner" ? 2 : Math.max(0, parseNumberInput(epfRateInput) || 0),
      workerType,
      residentStatus,
    }),
    [monthlySalaryInput, annualBonusInput, otherReliefInput, epfRateInput, workerType, residentStatus],
  );

  const errors = useMemo(() => validateInputs(parsedInput), [parsedInput]);
  const isValid = Object.keys(errors).length === 0;

  const result = useMemo(
    () => calculateSalary({ ...parsedInput, epfRate: Math.min(15, parsedInput.epfRate) }),
    [parsedInput],
  );

  const takeHomeRatio =
    parsedInput.monthlySalary > 0
      ? Math.max(0, Math.min(100, (result.monthlyNet / parsedInput.monthlySalary) * 100))
      : 0;

  const hasNegativeTakeHome = result.monthlyNet < 0;

  function resetForm() {
    setMonthlySalaryInput(toInputString(DEFAULT_INPUTS.monthlySalary));
    setAnnualBonusInput(toInputString(DEFAULT_INPUTS.annualBonus));
    setOtherReliefInput(toInputString(DEFAULT_INPUTS.otherRelief));
    setEpfRateInput(toInputString(DEFAULT_INPUTS.epfRate));
    setWorkerType(DEFAULT_INPUTS.workerType);
    setResidentStatus(DEFAULT_INPUTS.residentStatus);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-2xl sm:p-10">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <Badge className="w-fit border-white/15 bg-white/10 text-emerald-100 hover:bg-white/10">
              Malaysia payroll estimator
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Malaysia Salary Calculator</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Estimate monthly take-home pay after EPF, SOCSO, EIS, and Malaysian income tax. Useful for
              salary negotiation, offer comparison, and monthly budgeting.
            </p>
          </div>
          <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
            <CardContent className="p-6">
              <p className="text-sm text-emerald-100">Estimated monthly take-home pay</p>
              <p className="mt-2 text-4xl font-bold">{money(isValid ? result.monthlyNet : 0)}</p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${isValid ? takeHomeRatio : 0}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {isValid ? `${takeHomeRatio.toFixed(1)}% of monthly gross salary` : "Fix input errors to view estimate"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-3xl border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Inputs</h2>
                <p className="text-sm text-muted-foreground">Set your employment and tax profile for a closer monthly estimate.</p>
              </div>
              <Button variant="outline" className="rounded-xl" onClick={resetForm}>
                Reset
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Monthly gross salary"
                value={monthlySalaryInput}
                onChange={setMonthlySalaryInput}
                placeholder="e.g. 6000"
                error={errors.monthlySalary}
              />
              <NumberField
                label="Annual bonus"
                value={annualBonusInput}
                onChange={setAnnualBonusInput}
                placeholder="e.g. 12000"
                error={errors.annualBonus}
              />
              <NumberField
                label="Other annual relief"
                value={otherReliefInput}
                onChange={setOtherReliefInput}
                placeholder="e.g. 5000"
                hint="Lifestyle, spouse, child, insurance, and other claimable relief."
                error={errors.otherRelief}
              />
              <NumberField
                label="EPF employee rate (%)"
                value={workerType === "foreigner" ? "2" : epfRateInput}
                onChange={setEpfRateInput}
                placeholder="e.g. 11"
                hint={
                  workerType === "foreigner"
                    ? "For quick estimate, foreign worker EPF is fixed to 2% in this calculator."
                    : "Typical default is 11% for Malaysian/PR employees."
                }
                error={errors.epfRate}
                disabled={workerType === "foreigner"}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Worker type</span>
                <select
                  value={workerType}
                  onChange={(event) => setWorkerType(event.target.value as WorkerType)}
                  className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                >
                  <option value="malaysian">Malaysian / PR</option>
                  <option value="foreigner">Foreign worker / expat</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Tax residency</span>
                <select
                  value={residentStatus}
                  onChange={(event) => setResidentStatus(event.target.value as ResidentStatus)}
                  className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                >
                  <option value="resident">Resident</option>
                  <option value="non-resident">Non-resident</option>
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              <div className="flex gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  Estimate only. This is not official PCB/payroll/tax advice. SOCSO and EIS in real payroll should
                  follow official contribution tables issued by authorities.
                </p>
              </div>
            </div>

            {hasNegativeTakeHome && isValid ? (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>
                    Estimated deductions are higher than monthly gross salary. Review EPF rate, reliefs, and residency
                    settings.
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["EPF / month", result.monthlyEpf, Wallet],
              ["Estimated tax / month", result.monthlyTax, TrendingUp],
              ["SOCSO / month", result.monthlySocso, Info],
              ["EIS / month", result.monthlyEis, Info],
            ].map(([label, value, Icon]) => {
              const IconComponent = Icon as typeof Wallet;
              return (
                <Card key={label as string} className="rounded-3xl shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{label as string}</p>
                        <p className="mt-1 text-2xl font-bold">{money(isValid ? (value as number) : 0)}</p>
                      </div>
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="rounded-3xl shadow-sm">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Annual summary</h2>
                  <p className="text-sm text-muted-foreground">High-level estimate for planning and comparison.</p>
                </div>
                <Button variant="outline" className="gap-2 rounded-2xl" onClick={() => window.print()}>
                  <Download className="h-4 w-4" /> Save
                </Button>
              </div>
              <div className="space-y-3">
                {[
                  ["Monthly take-home pay", result.monthlyNet],
                  ["Annual gross", result.annualGross],
                  ["Chargeable income estimate", result.chargeableIncome],
                  ["Annual tax estimate", result.annualIncomeTax],
                  ["Estimated monthly tax", result.monthlyTax],
                  ["Monthly deductions", result.monthlyDeductions],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3">
                    <span className="text-sm text-muted-foreground">{label as string}</span>
                    <span className="font-semibold">{money(isValid ? (value as number) : 0)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
