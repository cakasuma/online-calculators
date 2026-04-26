import { Calculator, Download, Info, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const money = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const pct = (value: number) => `${value.toFixed(1)}%`;

type ResidentStatus = "resident" | "non-resident";
type WorkerType = "malaysian" | "foreigner";

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
  { threshold: 2000000, rate: 0.30 },
];

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

function calculateSalary(input: {
  monthlySalary: number;
  annualBonus: number;
  otherRelief: number;
  epfRate: number;
  workerType: WorkerType;
  residentStatus: ResidentStatus;
}) {
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
  const chargeableIncome = Math.max(0, annualGross - epfRelief - annualSocso - annualEis - personalRelief - input.otherRelief);
  const annualIncomeTax = input.residentStatus === "non-resident" ? annualGross * 0.30 : progressiveTax(chargeableIncome);
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

function NumberField({ label, value, onChange, hint }: { label: string; value: number; onChange: (value: number) => void; hint?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="number"
        min="0"
        value={value || ""}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-800 dark:bg-slate-950"
      />
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export default function SalaryCalculator() {
  const [monthlySalary, setMonthlySalary] = useState(21500);
  const [annualBonus, setAnnualBonus] = useState(0);
  const [otherRelief, setOtherRelief] = useState(0);
  const [epfRate, setEpfRate] = useState(11);
  const [workerType, setWorkerType] = useState<WorkerType>("malaysian");
  const [residentStatus, setResidentStatus] = useState<ResidentStatus>("resident");

  const result = useMemo(
    () => calculateSalary({ monthlySalary, annualBonus, otherRelief, epfRate, workerType, residentStatus }),
    [monthlySalary, annualBonus, otherRelief, epfRate, workerType, residentStatus]
  );

  const takeHomeRatio = monthlySalary > 0 ? Math.max(0, Math.min(100, (result.monthlyNet / monthlySalary) * 100)) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-2xl sm:p-10">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-emerald-100">
              <Calculator className="h-4 w-4" /> Malaysia payroll estimator
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Know your real take-home pay before payday.</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Estimate monthly net salary after EPF, SOCSO, EIS, and Malaysian individual income tax. Built for employees, expats, recruiters, and founders who need a fast payroll sanity check.
              </p>
            </div>
          </div>
          <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
            <CardContent className="p-6">
              <p className="text-sm text-emerald-100">Estimated monthly take-home</p>
              <p className="mt-2 text-4xl font-bold">{money(result.monthlyNet)}</p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${takeHomeRatio}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-300">{pct(takeHomeRatio)} of gross salary</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-3xl border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="text-xl font-semibold">Salary inputs</h2>
              <p className="text-sm text-muted-foreground">Start simple. Add bonus and relief later when you need a closer estimate.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Monthly gross salary" value={monthlySalary} onChange={setMonthlySalary} />
              <NumberField label="Annual bonus" value={annualBonus} onChange={setAnnualBonus} />
              <NumberField label="Other annual relief" value={otherRelief} onChange={setOtherRelief} hint="Lifestyle, insurance, spouse, child relief etc." />
              <NumberField label="EPF employee rate (%)" value={epfRate} onChange={setEpfRate} hint="Default 11% for Malaysian/PR below 60." />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Worker type</span>
                <select value={workerType} onChange={(event) => setWorkerType(event.target.value as WorkerType)} className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm">
                  <option value="malaysian">Malaysian / PR</option>
                  <option value="foreigner">Foreign worker / expat</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Tax residency</span>
                <select value={residentStatus} onChange={(event) => setResidentStatus(event.target.value as ResidentStatus)} className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm">
                  <option value="resident">Tax resident</option>
                  <option value="non-resident">Non-resident</option>
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              <div className="flex gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>This is an estimate, not official PCB payroll advice. SOCSO/EIS normally use official contribution schedules; this MVP approximates them using capped percentage rates.</p>
              </div>
            </div>
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
                        <p className="mt-1 text-2xl font-bold">{money(value as number)}</p>
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
                  <p className="text-sm text-muted-foreground">Useful for tax planning and compensation comparison.</p>
                </div>
                <Button variant="outline" className="gap-2 rounded-2xl" onClick={() => window.print()}>
                  <Download className="h-4 w-4" /> Save
                </Button>
              </div>
              <div className="space-y-3">
                {[
                  ["Annual gross income", result.annualGross],
                  ["Chargeable income estimate", result.chargeableIncome],
                  ["Annual EPF contribution", result.annualEpf],
                  ["Annual income tax estimate", result.annualIncomeTax],
                  ["Monthly deductions", result.monthlyDeductions],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3">
                    <span className="text-sm text-muted-foreground">{label as string}</span>
                    <span className="font-semibold">{money(value as number)}</span>
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
