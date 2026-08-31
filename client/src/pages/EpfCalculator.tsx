import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, ChevronDown, ChevronUp, Table2, PiggyBank, Target, TrendingUp, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalculatorHero } from "@/components/CalculatorHero";
import { useLocale } from "@/hooks/use-locale";
import { formatCurrency, formatInputValue, parseLocaleNumber } from "@/lib/i18n";
import { recordServerEvent, track } from "@/lib/analytics";
import { ShareButton } from "@/components/ShareButton";
import { SaveButton } from "@/components/SaveButton";
import { RelatedToolsCard } from "@/components/RelatedToolsCard";
import {
  EPF_DEFAULTS,
  basicSavingsTargetAt,
  defaultEmployerRate,
  projectEpf,
  type EpfInputs,
  type EpfProjection,
  type WorkerType,
} from "@/lib/epf";
import {
  buildShareUrl,
  enumField,
  mergeFromUrl,
  numberField,
  urlHasSchemaParams,
  useUrlSync,
  type UrlSchema,
} from "@/lib/urlState";

const EPF_URL_SCHEMA: UrlSchema<EpfInputs> = {
  currentAge: numberField<EpfInputs, "currentAge">("age"),
  retirementAge: numberField<EpfInputs, "retirementAge">("ret"),
  currentBalance: numberField<EpfInputs, "currentBalance">("bal"),
  monthlySalary: numberField<EpfInputs, "monthlySalary">("sal"),
  salaryGrowthRate: numberField<EpfInputs, "salaryGrowthRate">("grow"),
  dividendRate: numberField<EpfInputs, "dividendRate">("div"),
  employeeRate: numberField<EpfInputs, "employeeRate">("emp"),
  employerRate: numberField<EpfInputs, "employerRate">("er"),
  voluntaryAnnual: numberField<EpfInputs, "voluntaryAnnual">("vol"),
  bonusMonths: numberField<EpfInputs, "bonusMonths">("bon"),
  workerType: enumField<EpfInputs, "workerType">("who", ["citizen", "foreigner"]),
};

interface Props {
  onCalculate?: (expression: string, result: string, url?: string) => void;
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  suffix,
  locale,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  locale: "en" | "ms" | "id";
}) {
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(formatInputValue(e.target.value, locale))}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 md:text-sm"
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

export default function EpfCalculator({ onCalculate }: Props = {}) {
  const { t, locale } = useLocale();

  const [initial] = useState<EpfInputs>(() =>
    mergeFromUrl<EpfInputs>({ ...EPF_DEFAULTS }, EPF_URL_SCHEMA),
  );
  const arrivedViaShare = useMemo(() => urlHasSchemaParams(EPF_URL_SCHEMA), []);

  // Form state
  const [currentAge, setCurrentAge] = useState(String(initial.currentAge));
  const [retirementAge, setRetirementAge] = useState(String(initial.retirementAge));
  const [currentBalance, setCurrentBalance] = useState(formatInputValue(String(initial.currentBalance), locale));
  const [monthlySalary, setMonthlySalary] = useState(formatInputValue(String(initial.monthlySalary), locale));
  const [salaryGrowthRate, setSalaryGrowthRate] = useState(String(initial.salaryGrowthRate));
  const [dividendRate, setDividendRate] = useState(String(initial.dividendRate));
  const [employeeRate, setEmployeeRate] = useState(String(initial.employeeRate));
  const [employerRateOverride, setEmployerRateOverride] = useState<string>(
    initial.employerRate != null ? String(initial.employerRate) : "",
  );
  const [voluntaryAnnual, setVoluntaryAnnual] = useState(formatInputValue(String(initial.voluntaryAnnual), locale));
  const [bonusMonths, setBonusMonths] = useState(String(initial.bonusMonths));
  const [workerType, setWorkerType] = useState<WorkerType>(initial.workerType ?? "citizen");

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [yearlyView, setYearlyView] = useState<"chart" | "table">("chart");

  // Calculation state — results are only shown after clicking Calculate
  const [calcResult, setCalcResult] = useState<EpfProjection | null>(null);
  const [dirty, setDirty] = useState(false);
  const hasCalculatedRef = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const parsedInputs: EpfInputs = useMemo(() => {
    const p = (s: string) => {
      const n = parseLocaleNumber(s, locale);
      return Number.isFinite(n) ? n : 0;
    };
    const parsedCurrentAge = Math.max(15, Math.min(70, p(currentAge) || EPF_DEFAULTS.currentAge));
    const empOverride = employerRateOverride.trim() ? p(employerRateOverride) : undefined;
    return {
      currentAge: parsedCurrentAge,
      retirementAge: Math.max(parsedCurrentAge + 1, Math.min(75, p(retirementAge) || EPF_DEFAULTS.retirementAge)),
      currentBalance: Math.max(0, p(currentBalance)),
      monthlySalary: Math.max(0, p(monthlySalary)),
      salaryGrowthRate: p(salaryGrowthRate),
      dividendRate: p(dividendRate),
      employeeRate: p(employeeRate),
      employerRate: empOverride,
      voluntaryAnnual: Math.max(0, p(voluntaryAnnual)),
      bonusMonths: p(bonusMonths),
      workerType,
      // Drives which phase of the Basic Savings target applies.
      currentYear: new Date().getFullYear(),
    };
  }, [
    currentAge,
    retirementAge,
    currentBalance,
    monthlySalary,
    salaryGrowthRate,
    dividendRate,
    employeeRate,
    employerRateOverride,
    voluntaryAnnual,
    bonusMonths,
    locale,
  ]);

  // Mark results stale when inputs change after a calculation
  useEffect(() => {
    if (hasCalculatedRef.current) {
      setDirty(true);
    }
  }, [
    currentAge, retirementAge, currentBalance, monthlySalary,
    salaryGrowthRate, dividendRate, employeeRate, employerRateOverride,
    voluntaryAnnual, bonusMonths,
  ]);

  useUrlSync(parsedInputs, EPF_URL_SCHEMA);

  // Auto-run when arriving via a shared link
  useEffect(() => {
    if (arrivedViaShare) {
      const result = projectEpf(parsedInputs);
      setCalcResult(result);
      hasCalculatedRef.current = true;
      setDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const money = (n: number) => `RM ${formatCurrency(n, locale)}`;

  function handleCalculate() {
    const result = projectEpf(parsedInputs);
    setCalcResult(result);
    hasCalculatedRef.current = true;
    setDirty(false);
    setTimeout(() => {
      if (window.innerWidth < 1024) {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);

    const analyticsPayload = {
      currentAge: parsedInputs.currentAge,
      retirementAge: parsedInputs.retirementAge,
      yearsToRetirement: parsedInputs.retirementAge - parsedInputs.currentAge,
      monthlySalary: Math.round(parsedInputs.monthlySalary),
      currentBalance: Math.round(parsedInputs.currentBalance),
      finalBalance: Math.round(result.finalBalance),
      monthlyRetirementIncome: Math.round(result.monthlyRetirementIncome),
      meetsTarget: result.meetsTarget,
    };
    track("calculator_complete", { calculator: "epf", ...analyticsPayload });
    recordServerEvent({ calculator: "epf", event: "calculator_complete", payload: analyticsPayload });

    if (onCalculate) {
      const yearsAway = parsedInputs.retirementAge - parsedInputs.currentAge;
      const expression = `Age ${parsedInputs.currentAge}→${parsedInputs.retirementAge} (${yearsAway} yrs) • RM ${Math.round(parsedInputs.monthlySalary)}/mo`;
      const resultStr = `Projected ${money(result.finalBalance)} at age ${parsedInputs.retirementAge}`;
      const url = buildShareUrl(parsedInputs, EPF_URL_SCHEMA);
      onCalculate(expression, resultStr, url);
    }
  }

  // Derived from calcResult for display
  const projection = calcResult;
  const erDefault = defaultEmployerRate(parsedInputs.monthlySalary);
  const yearsToRetirement = parsedInputs.retirementAge - parsedInputs.currentAge;

  const gapToTarget = projection
    ? projection.finalBalance - projection.basicSavingsTarget
    : 0;
  const targetPctOfFinal =
    projection && projection.basicSavingsTarget > 0
      ? Math.min(100, (projection.finalBalance / projection.basicSavingsTarget) * 100)
      : 0;

  const compactRM = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
    return String(Math.round(n));
  };

  const chartData = useMemo(() => {
    if (!projection) return [];
    let cumContrib = parsedInputs.currentBalance;
    let cumDiv = 0;
    const rows = projection.years.map((y) => {
      cumContrib += y.totalContribution;
      cumDiv += y.dividendCredited;
      return {
        age: y.age,
        contributions: Math.round(cumContrib),
        dividends: Math.round(cumDiv),
        total: Math.round(y.endBalance),
      };
    });
    return [
      {
        age: parsedInputs.currentAge,
        contributions: Math.round(parsedInputs.currentBalance),
        dividends: 0,
        total: Math.round(parsedInputs.currentBalance),
      },
      ...rows,
    ];
  }, [projection, parsedInputs.currentBalance, parsedInputs.currentAge]);

  return (
    <div className="w-full">
      <CalculatorHero category="Finance" title={t("epf.title")} subtitle={t("epf.subtitle")} />
      <div className="hk-container py-8 space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Inputs */}
        <Card className="rounded-3xl">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-lg font-semibold">{t("epf.inputs.heading")}</h2>

            {/* Essential fields */}
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label={t("epf.inputs.currentAge")}>
                <NumberInput value={currentAge} onChange={setCurrentAge} locale={locale} suffix={t("epf.units.years")} />
              </FieldRow>
              <FieldRow label={t("epf.inputs.retirementAge")} hint={t("epf.inputs.retirementAgeHint")}>
                <NumberInput value={retirementAge} onChange={setRetirementAge} locale={locale} suffix={t("epf.units.years")} />
              </FieldRow>
              <FieldRow label={t("epf.inputs.currentBalance")} hint={t("epf.inputs.currentBalanceHint")}>
                <NumberInput value={currentBalance} onChange={setCurrentBalance} locale={locale} placeholder="30,000" suffix="RM" />
              </FieldRow>
              <FieldRow label={t("epf.inputs.monthlySalary")}>
                <NumberInput value={monthlySalary} onChange={setMonthlySalary} locale={locale} placeholder="5,000" suffix="RM" />
              </FieldRow>
            </div>

            <FieldRow label={t("epf.inputs.workerType")} hint={t("epf.workerType.hint")}>
              <select
                value={workerType}
                onChange={(event) => setWorkerType(event.target.value as WorkerType)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm shadow-sm"
              >
                <option value="citizen">{t("epf.workerType.citizen")}</option>
                <option value="foreigner">{t("epf.workerType.foreigner")}</option>
              </select>
            </FieldRow>

            {/* Advanced / optional fields */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-dashed px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-medium">{t("epf.inputs.advancedSettings")}</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <FieldRow label={t("epf.inputs.salaryGrowth")}>
                    <NumberInput value={salaryGrowthRate} onChange={setSalaryGrowthRate} locale={locale} suffix="%" />
                  </FieldRow>
                  <FieldRow label={t("epf.inputs.dividendRate")} hint={t("epf.inputs.dividendRateHint")}>
                    <NumberInput value={dividendRate} onChange={setDividendRate} locale={locale} suffix="%" />
                  </FieldRow>
                  <FieldRow label={t("epf.inputs.employeeRate")}>
                    <NumberInput value={employeeRate} onChange={setEmployeeRate} locale={locale} suffix="%" />
                  </FieldRow>
                  <FieldRow label={t("epf.inputs.employerRate")} hint={`${t("epf.inputs.employerRateHint")} ${erDefault}%`}>
                    <NumberInput
                      value={employerRateOverride}
                      onChange={setEmployerRateOverride}
                      locale={locale}
                      placeholder={String(erDefault)}
                      suffix="%"
                    />
                  </FieldRow>
                  <FieldRow label={t("epf.inputs.bonusMonths")} hint={t("epf.inputs.bonusMonthsHint")}>
                    <NumberInput value={bonusMonths} onChange={setBonusMonths} locale={locale} suffix={t("epf.units.months")} />
                  </FieldRow>
                  <FieldRow label={t("epf.inputs.voluntary")} hint={t("epf.inputs.voluntaryHint")}>
                    <NumberInput value={voluntaryAnnual} onChange={setVoluntaryAnnual} locale={locale} placeholder="0" suffix={`RM/${t("epf.units.year")}`} />
                  </FieldRow>
                </div>
              )}
            </div>

            {/* Calculate button */}
            <div className="pt-1 space-y-2">
              {dirty && (
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                  {t("epf.results.staleHint")}
                </p>
              )}
              <Button
                className="w-full"
                size="lg"
                onClick={handleCalculate}
              >
                {projection ? t("epf.recalculate") : t("epf.calculate")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div ref={resultsRef} className="space-y-4">
          {!projection ? (
            /* Empty state */
            <Card className="rounded-3xl">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[220px]">
                <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                  <PiggyBank className="w-8 h-8" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t("epf.results.emptyHint")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Hero */}
              <Card className="rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-background border-primary/25">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <PiggyBank className="w-4 h-4" />
                    {t("epf.results.projectedAt")} {projection.inputs.retirementAge}
                    <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary lowercase normal-case">
                      {yearsToRetirement > 0 ? `${yearsToRetirement} ${t("epf.results.yearsAway")}` : ""}
                    </span>
                  </div>
                  <p className="text-4xl font-bold tabular-nums">{money(projection.finalBalance)}</p>
                  <p className="text-sm text-muted-foreground">
                    {money(projection.totalContributions)} {t("epf.results.contributed")} ·{" "}
                    {money(projection.totalDividends)} {t("epf.results.dividends")}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <ShareButton calculator="epf" state={parsedInputs} schema={EPF_URL_SCHEMA} />
                    <SaveButton
                      calculator="epf"
                      state={parsedInputs}
                      schema={EPF_URL_SCHEMA}
                      defaultName={`EPF age ${parsedInputs.currentAge}→${parsedInputs.retirementAge}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Target comparison */}
              <Card className="rounded-3xl">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-2xl p-3 ${projection.meetsTarget ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}`}>
                      <Target className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-semibold">
                        {t("epf.results.targetTitle")}: {money(projection.basicSavingsTarget)}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {projection.meetsTarget
                          ? `${t("epf.results.aboveTargetBy")} ${money(Math.abs(gapToTarget))}`
                          : `${t("epf.results.belowTargetBy")} ${money(Math.abs(gapToTarget))}`}
                      </p>
                    </div>
                  </div>
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${projection.meetsTarget ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{ width: `${targetPctOfFinal}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("epf.results.targetSource")}</p>
                  {projection.basicSavingsIsEstimate && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {t("epf.results.targetEstimate")}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Account split — new contributions have been divided three ways since May 2024 */}
              <Card className="rounded-3xl">
                <CardContent className="p-6 space-y-3">
                  <div>
                    <h2 className="text-base font-semibold">{t("epf.accounts.title")}</h2>
                    <p className="text-sm text-muted-foreground">{t("epf.accounts.subtitle")}</p>
                  </div>
                  {projection.accounts ? (
                    <>
                      <div className="flex h-3 overflow-hidden rounded-full">
                        <div className="bg-primary" style={{ width: "75%" }} />
                        <div className="bg-sky-400" style={{ width: "15%" }} />
                        <div className="bg-emerald-400" style={{ width: "10%" }} />
                      </div>
                      <div className="space-y-2">
                        {([
                          ["persaraan", projection.accounts.persaraan, "bg-primary"],
                          ["sejahtera", projection.accounts.sejahtera, "bg-sky-400"],
                          ["fleksibel", projection.accounts.fleksibel, "bg-emerald-400"],
                        ] as [string, number, string][]).map(([key, value, colour]) => (
                          <div key={key} className="rounded-2xl bg-muted/50 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2 text-sm font-medium">
                                <span className={`h-2.5 w-2.5 rounded-sm ${colour}`} />
                                {t(`epf.accounts.${key}` as never)}
                              </span>
                              <span className="font-semibold tabular-nums">{money(value)}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t(`epf.accounts.${key}.hint` as never)}
                            </p>
                          </div>
                        ))}
                      </div>
                      {parsedInputs.currentBalance > 0 && (
                        <p className="text-xs text-muted-foreground">{t("epf.accounts.openingNote")}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("epf.accounts.consolidated")}</p>
                  )}
                </CardContent>
              </Card>

              {/* Retirement Income Adequacy tiers */}
              <Card className="rounded-3xl">
                <CardContent className="p-6 space-y-3">
                  <div>
                    <h2 className="text-base font-semibold">{t("epf.tiers.title")}</h2>
                    <p className="text-sm text-muted-foreground">{t("epf.tiers.subtitle")}</p>
                  </div>
                  <div className="space-y-2">
                    {([
                      ["basic", projection.riaTiers.basic],
                      ["adequate", projection.riaTiers.adequate],
                      ["enhanced", projection.riaTiers.enhanced],
                    ] as [string, number][]).map(([key, amount]) => {
                      const reached = projection.finalBalance >= amount;
                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${
                            reached ? "bg-emerald-500/10" : "bg-muted/50"
                          }`}
                        >
                          <span className="text-sm font-medium">{t(`epf.tiers.${key}` as never)}</span>
                          <span className="flex items-center gap-2">
                            <span className="font-semibold tabular-nums">{money(amount)}</span>
                            {reached && (
                              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                {t("epf.tiers.reached")}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {projection.tierReached === "none" && (
                    <p className="text-xs text-muted-foreground">{t("epf.tiers.none")}</p>
                  )}
                </CardContent>
              </Card>

              {/* Monthly retirement income */}
              <Card className="rounded-3xl">
                <CardContent className="p-6 space-y-1">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    {t("epf.results.monthlyIncome")}
                  </div>
                  <p className="text-3xl font-bold tabular-nums">{money(projection.monthlyRetirementIncome)}</p>
                  <p className="text-xs text-muted-foreground">{t("epf.results.monthlyIncomeHint")}</p>
                </CardContent>
              </Card>

              {/* Year-by-year breakdown */}
              <Card className="rounded-3xl">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 px-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Wallet className="w-4 h-4 text-primary" />
                      {t("epf.results.yearly.title")}
                    </span>
                    <div className="flex items-center gap-1 rounded-lg border p-0.5">
                      <button
                        type="button"
                        onClick={() => setYearlyView("chart")}
                        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${yearlyView === "chart" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        data-testid="button-view-chart"
                        aria-pressed={yearlyView === "chart"}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        {t("epf.results.yearly.chartView")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setYearlyView("table")}
                        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${yearlyView === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        data-testid="button-view-table"
                        aria-pressed={yearlyView === "table"}
                      >
                        <Table2 className="w-3.5 h-3.5" />
                        {t("epf.results.yearly.tableView")}
                      </button>
                    </div>
                  </div>

                  {yearlyView === "chart" ? (
                    <div className="space-y-2">
                      <div className="h-64 w-full" data-testid="epf-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                            <defs>
                              <linearGradient id="epfContrib" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                              </linearGradient>
                              <linearGradient id="epfDiv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                            <XAxis
                              dataKey="age"
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              minTickGap={20}
                            />
                            <YAxis
                              tickFormatter={compactRM}
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              width={40}
                            />
                            <RechartsTooltip
                              cursor={{ stroke: "hsl(var(--border))" }}
                              content={({ active, payload, label }) => {
                                if (!active || !payload || payload.length === 0) return null;
                                const row = payload[0].payload as {
                                  contributions: number;
                                  dividends: number;
                                  total: number;
                                };
                                return (
                                  <div
                                    style={{
                                      background: "hsl(var(--popover))",
                                      border: "1px solid hsl(var(--border))",
                                      borderRadius: 12,
                                      fontSize: 12,
                                      padding: "8px 12px",
                                      color: "hsl(var(--popover-foreground))",
                                    }}
                                  >
                                    <p className="font-medium mb-1">
                                      {t("epf.results.yearly.age")} {label}
                                    </p>
                                    <p className="flex items-center justify-between gap-4">
                                      <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <span className="w-2 h-2 rounded-sm bg-primary/60" />
                                        {t("epf.results.yearly.contrib")}
                                      </span>
                                      <span className="tabular-nums font-medium">{money(row.contributions)}</span>
                                    </p>
                                    <p className="flex items-center justify-between gap-4">
                                      <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <span className="w-2 h-2 rounded-sm" style={{ background: "#10B981" }} />
                                        {t("epf.results.yearly.div")}
                                      </span>
                                      <span className="tabular-nums font-medium">{money(row.dividends)}</span>
                                    </p>
                                    <p className="mt-1 flex items-center justify-between gap-4 border-t pt-1">
                                      <span className="font-medium">{t("epf.results.yearly.total")}</span>
                                      <span className="tabular-nums font-semibold">{money(row.total)}</span>
                                    </p>
                                  </div>
                                );
                              }}
                            />
                            <ReferenceLine
                              y={projection.basicSavingsTarget}
                              stroke="hsl(var(--muted-foreground))"
                              strokeDasharray="4 4"
                              label={{
                                value: t("epf.results.yearly.targetLine"),
                                position: "insideTopRight",
                                fontSize: 10,
                                fill: "hsl(var(--muted-foreground))",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="contributions"
                              name={t("epf.results.yearly.contrib")}
                              stackId="1"
                              stroke="hsl(var(--primary))"
                              fill="url(#epfContrib)"
                            />
                            <Area
                              type="monotone"
                              dataKey="dividends"
                              name={t("epf.results.yearly.div")}
                              stackId="1"
                              stroke="#10B981"
                              fill="url(#epfDiv)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
                          {t("epf.results.yearly.contrib")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#10B981" }} />
                          {t("epf.results.yearly.div")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-muted-foreground">
                          <tr className="text-left">
                            <th className="px-2 py-1">{t("epf.results.yearly.age")}</th>
                            <th className="px-2 py-1 text-right">{t("epf.results.yearly.salary")}</th>
                            <th className="px-2 py-1 text-right">{t("epf.results.yearly.contrib")}</th>
                            <th className="px-2 py-1 text-right">{t("epf.results.yearly.div")}</th>
                            <th className="px-2 py-1 text-right">{t("epf.results.yearly.endBal")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projection.years.map((y) => (
                            <tr key={y.age} className="border-t">
                              <td className="px-2 py-1 font-medium">{y.age}</td>
                              <td className="px-2 py-1 text-right tabular-nums">{money(y.monthlySalary)}</td>
                              <td className="px-2 py-1 text-right tabular-nums">{money(y.totalContribution)}</td>
                              <td className="px-2 py-1 text-right tabular-nums">{money(y.dividendCredited)}</td>
                              <td className="px-2 py-1 text-right tabular-nums font-semibold">{money(y.endBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          <RelatedToolsCard currentHref="/epf-retirement" />
        </div>
      </div>
      </div>
    </div>
  );
}
