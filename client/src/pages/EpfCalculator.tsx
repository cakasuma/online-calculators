import { useMemo, useState } from "react";
import { BarChart3, Table2, PiggyBank, Target, TrendingUp, Wallet } from "lucide-react";
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
import { useLocale } from "@/hooks/use-locale";
import { formatCurrency, formatInputValue, parseLocaleNumber } from "@/lib/i18n";
import { ShareButton } from "@/components/ShareButton";
import { SaveButton } from "@/components/SaveButton";
import { EmbedDialog } from "@/components/EmbedDialog";
import { RelatedToolsCard } from "@/components/RelatedToolsCard";
import {
  EPF_DEFAULTS,
  basicSavingsTargetAt,
  defaultEmployerRate,
  projectEpf,
  type EpfInputs,
} from "@/lib/epf";
import {
  buildShareUrl,
  mergeFromUrl,
  numberField,
  urlHasSchemaParams,
  useUrlSync,
  type UrlSchema,
} from "@/lib/urlState";

// URL schema — short keys keep shared links readable.
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

  // Read URL on mount so shared links pre-fill the form.
  const [initial] = useState<EpfInputs>(() =>
    mergeFromUrl<EpfInputs>({ ...EPF_DEFAULTS }, EPF_URL_SCHEMA),
  );
  const arrivedViaShare = useMemo(() => urlHasSchemaParams(EPF_URL_SCHEMA), []);

  // Form state mirrors EpfInputs but as strings for the inputs.
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
  const [yearlyView, setYearlyView] = useState<"chart" | "table">("chart");

  const parsedInputs: EpfInputs = useMemo(() => {
    const p = (s: string) => {
      const n = parseLocaleNumber(s, locale);
      return Number.isFinite(n) ? n : 0;
    };
    const empOverride = employerRateOverride.trim() ? p(employerRateOverride) : undefined;
    return {
      currentAge: Math.max(15, Math.min(70, p(currentAge) || EPF_DEFAULTS.currentAge)),
      retirementAge: Math.max(45, Math.min(70, p(retirementAge) || EPF_DEFAULTS.retirementAge)),
      currentBalance: Math.max(0, p(currentBalance)),
      monthlySalary: Math.max(0, p(monthlySalary)),
      salaryGrowthRate: p(salaryGrowthRate),
      dividendRate: p(dividendRate),
      employeeRate: p(employeeRate),
      employerRate: empOverride,
      voluntaryAnnual: Math.max(0, p(voluntaryAnnual)),
      bonusMonths: p(bonusMonths),
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

  useUrlSync(parsedInputs, EPF_URL_SCHEMA);

  const projection = useMemo(() => projectEpf(parsedInputs), [parsedInputs]);
  const money = (n: number) => `RM ${formatCurrency(n, locale)}`;

  // Record one history entry per stable projection so the calc shows up in
  // history without flooding it on every keystroke. Signature dedupes.
  useMemo(() => {
    if (!onCalculate) return;
    if (parsedInputs.monthlySalary <= 0) return;
    const signature = `${parsedInputs.currentAge}|${parsedInputs.retirementAge}|${Math.round(parsedInputs.monthlySalary)}|${Math.round(projection.finalBalance)}`;
    // We pipe through a timer-less version since the inputs themselves are
    // already React state — the memo only fires when inputs change.
    const expression = `Age ${parsedInputs.currentAge}→${parsedInputs.retirementAge} • RM ${Math.round(parsedInputs.monthlySalary)}/mo • bal ${Math.round(parsedInputs.currentBalance)}`;
    const resultStr = `Projected ${money(projection.finalBalance)} at ${parsedInputs.retirementAge}`;
    const url = buildShareUrl(parsedInputs, EPF_URL_SCHEMA);
    onCalculate(expression, resultStr, url);
    return signature;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    parsedInputs.currentAge,
    parsedInputs.retirementAge,
    Math.round(parsedInputs.monthlySalary),
    Math.round(projection.finalBalance),
  ]);

  const gapToTarget = projection.finalBalance - projection.basicSavingsTarget;
  const targetPctOfFinal =
    projection.basicSavingsTarget > 0
      ? Math.min(100, (projection.finalBalance / projection.basicSavingsTarget) * 100)
      : 0;
  const erDefault = defaultEmployerRate(parsedInputs.monthlySalary);

  // Compact RM formatter for axis ticks: 1,234 → "1.2k", 1,200,000 → "1.2m".
  const compactRM = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
    return String(Math.round(n));
  };

  // Stacked-area data: cumulative contributions (incl. starting balance) at the
  // bottom, cumulative dividends on top. Their sum equals the year-end balance,
  // so the stack height traces the projected balance while showing how much of
  // it is the user's own money vs compounding dividends.
  const chartData = useMemo(() => {
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
    // Seed the chart with the starting point so the area begins at the
    // current balance rather than after the first year.
    return [
      {
        age: parsedInputs.currentAge,
        contributions: Math.round(parsedInputs.currentBalance),
        dividends: 0,
        total: Math.round(parsedInputs.currentBalance),
      },
      ...rows,
    ];
  }, [projection.years, parsedInputs.currentBalance, parsedInputs.currentAge]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("epf.title")}</h1>
        <p className="text-base text-muted-foreground max-w-2xl">{t("epf.subtitle")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Inputs */}
        <Card className="rounded-3xl">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-lg font-semibold">{t("epf.inputs.heading")}</h2>

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
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {/* Hero */}
          <Card className="rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-background border-primary/25">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <PiggyBank className="w-4 h-4" />
                {t("epf.results.projectedAt")} {parsedInputs.retirementAge}
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
                <EmbedDialog calculator="epf" />
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

          {/* Year-by-year — chart by default, table on toggle */}
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
                          formatter={(value: number, name: string) => [money(value), name]}
                          labelFormatter={(age) => `${t("epf.results.yearly.age")} ${age}`}
                          contentStyle={{
                            background: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 12,
                            fontSize: 12,
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

          <RelatedToolsCard currentHref="/epf-retirement" />
        </div>
      </div>
    </div>
  );
}
