import { ArrowRight, Calculator as CalculatorIcon, Home, Info, PiggyBank, Receipt, Wallet } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/hooks/use-locale";
import { CalculatorHero } from "@/components/CalculatorHero";
import { RelatedToolsCard } from "@/components/RelatedToolsCard";
import { ShareButton } from "@/components/ShareButton";
import { SaveButton } from "@/components/SaveButton";
import { recordServerEvent, track } from "@/lib/analytics";
import {
  calculateHousingLoan,
  HOUSING_LOAN_DEFAULTS,
  type BuyerType,
  type HousingLoanInputs,
} from "@/lib/housingLoan";
import {
  boolField,
  buildShareUrl,
  enumField,
  mergeFromUrl,
  numberField,
  urlHasSchemaParams,
  useUrlSync,
  type UrlSchema,
} from "@/lib/urlState";

const money = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const money2 = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

function parseNumberInput(value: string): number {
  if (!value.trim()) return 0;
  const normalized = value.replace(/[,_\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInputNumber(value: string, maxDecimals = 2): string {
  if (!value.trim()) return "";
  const parsed = parseNumberInput(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(parsed);
}

function toInputString(value: number): string {
  return value === 0 ? "" : new Intl.NumberFormat("en-MY", { maximumFractionDigits: 2 }).format(value);
}

function NumberField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  maxDecimals,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  maxDecimals?: number;
  suffix?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onChange(formatInputNumber(value, maxDecimals ?? 2))}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-800 dark:bg-slate-950"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

/** One line of the upfront cost breakdown, struck through when a waiver applies. */
function CostRow({
  label,
  gross,
  payable,
  helper,
  waivedLabel,
}: {
  label: string;
  gross: number;
  payable: number;
  helper: string;
  waivedLabel?: string;
}) {
  const waived = waivedLabel != null && gross > 0 && payable === 0;
  return (
    <div className="rounded-2xl bg-muted/50 px-3 sm:px-4 py-3 min-w-0">
      <div className="flex items-center justify-between gap-3 min-w-0">
        <span className="text-sm text-muted-foreground min-w-0 break-words">{label}</span>
        <span className="font-semibold tabular-nums text-right break-words">
          {waived ? (
            <>
              <span className="mr-2 font-normal text-muted-foreground line-through">{money(gross)}</span>
              {money(0)}
            </>
          ) : (
            money(payable)
          )}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{waived ? waivedLabel : helper}</p>
    </div>
  );
}

const URL_SCHEMA: UrlSchema<HousingLoanInputs> = {
  price: numberField("price"),
  rebatePct: numberField("rebate"),
  marginPct: numberField("margin"),
  tenureYears: numberField("tenure"),
  rate: numberField("rate"),
  buyerType: enumField<HousingLoanInputs, "buyerType">("buyer", ["citizen", "pr", "foreigner"]),
  firstHome: enumField<HousingLoanInputs, "firstHome">("first", ["yes", "no"]),
  developerAbsorbsLegal: boolField("nolegal"),
  motAbsorbedPct: numberField("motshare", { keepZero: true }),
  mrtaPremium: numberField("mrta"),
  financeMrta: boolField("finmrta"),
  extraMonthly: numberField("extra"),
};

interface Props {
  onCalculate?: (expression: string, result: string, url?: string) => void;
}

export default function HousingLoanCalculator({ onCalculate }: Props = {}) {
  const { t } = useLocale();
  const [initial] = useState<HousingLoanInputs>(() => {
    const merged = mergeFromUrl<HousingLoanInputs>(HOUSING_LOAN_DEFAULTS, URL_SCHEMA);
    // Links shared before this calculator moved to margin of finance carry a
    // down-payment percentage instead. Convert rather than silently ignoring it,
    // so an old link still opens the scenario its sender saw.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const legacyDown = params.get("down");
      if (legacyDown != null && params.get("margin") == null) {
        const down = Number(legacyDown);
        if (Number.isFinite(down)) {
          merged.marginPct = Math.max(0, Math.min(100, 100 - down));
        }
      }
    }
    return merged;
  });
  const arrivedViaShare = useMemo(
    () =>
      urlHasSchemaParams(URL_SCHEMA) ||
      // A legacy link may carry only the old down-payment parameter.
      (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("down")),
    [],
  );
  const resultsRef = useRef<HTMLDivElement>(null);

  const [priceInput, setPriceInput] = useState(toInputString(initial.price));
  const [rebateInput, setRebateInput] = useState(toInputString(initial.rebatePct));
  const [marginInput, setMarginInput] = useState(toInputString(initial.marginPct));
  const [tenureInput, setTenureInput] = useState(toInputString(initial.tenureYears));
  const [rateInput, setRateInput] = useState(toInputString(initial.rate));
  const [mrtaInput, setMrtaInput] = useState(toInputString(initial.mrtaPremium));
  const [extraInput, setExtraInput] = useState(toInputString(initial.extraMonthly));
  const [buyerType, setBuyerType] = useState<BuyerType>(initial.buyerType);
  const [firstHome, setFirstHome] = useState<"yes" | "no">(initial.firstHome);
  const [absorbLegal, setAbsorbLegal] = useState(initial.developerAbsorbsLegal);
  const [motShareInput, setMotShareInput] = useState(toInputString(initial.motAbsorbedPct));
  const [financeMrta, setFinanceMrta] = useState(initial.financeMrta);
  const [showSchedule, setShowSchedule] = useState(false);

  const parsed = useMemo<HousingLoanInputs>(
    () => ({
      price: Math.max(0, parseNumberInput(priceInput)),
      rebatePct: Math.max(0, Math.min(100, parseNumberInput(rebateInput))),
      marginPct: Math.max(0, Math.min(100, parseNumberInput(marginInput))),
      tenureYears: Math.max(1, Math.min(40, parseNumberInput(tenureInput) || 1)),
      rate: Math.max(0, Math.min(15, parseNumberInput(rateInput))),
      buyerType,
      firstHome,
      developerAbsorbsLegal: absorbLegal,
      motAbsorbedPct: Math.max(0, Math.min(100, parseNumberInput(motShareInput))),
      mrtaPremium: Math.max(0, parseNumberInput(mrtaInput)),
      financeMrta,
      extraMonthly: Math.max(0, parseNumberInput(extraInput)),
    }),
    [
      priceInput, rebateInput, marginInput, tenureInput, rateInput, mrtaInput, extraInput,
      motShareInput, buyerType, firstHome, absorbLegal, financeMrta,
    ],
  );

  useUrlSync(parsed, URL_SCHEMA);

  const isValid = parsed.price > 0;
  const [hasCalculated, setHasCalculated] = useState(arrivedViaShare && isValid);
  const result = useMemo(() => calculateHousingLoan(parsed), [parsed]);
  const showResults = hasCalculated && isValid;

  // Widest year drives the bar chart scale so the columns stay comparable.
  const peakYearTotal = useMemo(
    () => result.schedule.reduce((max, y) => Math.max(max, y.principalPaid + y.interestPaid), 0),
    [result.schedule],
  );

  function handleCalculate() {
    if (!isValid) return;
    setHasCalculated(true);
    setTimeout(() => {
      if (window.innerWidth < 1024) {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);

    const payload = {
      price: Math.round(parsed.price),
      rebatePct: parsed.rebatePct,
      marginPct: parsed.marginPct,
      motAbsorbedPct: parsed.motAbsorbedPct,
      tenureYears: parsed.tenureYears,
      rate: parsed.rate,
      buyerType: parsed.buyerType,
      firstHome: parsed.firstHome,
      monthlyInstallment: Math.round(result.monthlyInstallment),
      netCashRequired: Math.round(result.netCashRequired),
    };
    track("calculator_complete", { calculator: "housing", ...payload });
    recordServerEvent({ calculator: "housing", event: "calculator_complete", payload });

    if (onCalculate) {
      const expression = `RM ${Math.round(parsed.price)} • ${parsed.marginPct}% margin • ${parsed.tenureYears}yr @ ${parsed.rate}%`;
      const resultStr = `RM ${Math.round(result.monthlyInstallment)}/mo • RM ${Math.round(result.netCashRequired)} cash`;
      const url = buildShareUrl(parsed, URL_SCHEMA);
      onCalculate(expression, resultStr, url);
    }
  }

  function resetForm() {
    setPriceInput(toInputString(HOUSING_LOAN_DEFAULTS.price));
    setRebateInput(toInputString(HOUSING_LOAN_DEFAULTS.rebatePct));
    setMarginInput(toInputString(HOUSING_LOAN_DEFAULTS.marginPct));
    setTenureInput(toInputString(HOUSING_LOAN_DEFAULTS.tenureYears));
    setRateInput(toInputString(HOUSING_LOAN_DEFAULTS.rate));
    setMrtaInput(toInputString(HOUSING_LOAN_DEFAULTS.mrtaPremium));
    setExtraInput(toInputString(HOUSING_LOAN_DEFAULTS.extraMonthly));
    setBuyerType(HOUSING_LOAN_DEFAULTS.buyerType);
    setFirstHome(HOUSING_LOAN_DEFAULTS.firstHome);
    setAbsorbLegal(HOUSING_LOAN_DEFAULTS.developerAbsorbsLegal);
    setMotShareInput(toInputString(HOUSING_LOAN_DEFAULTS.motAbsorbedPct));
    setFinanceMrta(HOUSING_LOAN_DEFAULTS.financeMrta);
    setHasCalculated(false);
  }

  const savedYears = Math.floor(result.monthsSaved / 12);
  const savedMonths = result.monthsSaved % 12;

  return (
    <div className="w-full">
      <CalculatorHero
        category="Finance"
        title={t("housing.title")}
        subtitle={t("housing.subtitle")}
        badges={[t("housing.badge"), t("housing.badge.private")]}
        result={
          <div className="rounded-[20px] border border-white/12 bg-white/[0.08] p-6 backdrop-blur-xl text-white">
            <p className="text-[13px] text-indigo-100">{t("housing.monthlyInstallment")}</p>
            <p className="mt-2 text-3xl md:text-4xl font-bold break-words tabular-nums">
              {money2(showResults ? result.monthlyInstallment : 0)}
            </p>
            <p className="mt-4 text-[13px] text-white/60">
              {showResults ? `${t("housing.over")} ${parsed.tenureYears} ${t("housing.years")}` : t("housing.cta.tapToReveal")}
            </p>
          </div>
        }
      />

      <div className="hk-container py-8 space-y-6 sm:space-y-8 min-w-0">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] min-w-0">
          <Card className="rounded-2xl sm:rounded-3xl border-slate-200/80 shadow-sm dark:border-slate-800 min-w-0">
            <CardContent className="space-y-5 p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{t("housing.inputs.title")}</h2>
                  <p className="text-sm text-muted-foreground">{t("housing.inputs.subtitle")}</p>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={resetForm}>
                  {t("common.reset")}
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label={t("housing.inputs.price")}
                  value={priceInput}
                  onChange={setPriceInput}
                  placeholder="e.g. 500,000"
                />
                <NumberField
                  label={t("housing.inputs.margin")}
                  value={marginInput}
                  onChange={setMarginInput}
                  placeholder="e.g. 90"
                  suffix="%"
                  hint={
                    buyerType === "foreigner"
                      ? t("housing.inputs.margin.hintForeign")
                      : t("housing.inputs.margin.hint")
                  }
                />
                <NumberField
                  label={t("housing.inputs.tenure")}
                  value={tenureInput}
                  onChange={setTenureInput}
                  placeholder="e.g. 35"
                  maxDecimals={0}
                  suffix={t("housing.years")}
                />
                <NumberField
                  label={t("housing.inputs.rate")}
                  value={rateInput}
                  onChange={setRateInput}
                  placeholder="e.g. 4.0"
                  suffix="%"
                  hint={t("housing.inputs.rate.hint")}
                />
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium">{t("housing.inputs.buyerType")}</span>
                <select
                  value={buyerType}
                  onChange={(event) => setBuyerType(event.target.value as BuyerType)}
                  className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                >
                  <option value="citizen">{t("housing.buyerType.citizen")}</option>
                  <option value="pr">{t("housing.buyerType.pr")}</option>
                  <option value="foreigner">{t("housing.buyerType.foreigner")}</option>
                </select>
                <span className="text-xs text-muted-foreground">{t("housing.buyerType.hint")}</span>
              </label>

              {buyerType === "citizen" && (
                <label className="block space-y-2">
                  <span className="text-sm font-medium">{t("housing.inputs.firstHome")}</span>
                  <select
                    value={firstHome}
                    onChange={(event) => setFirstHome(event.target.value as "yes" | "no")}
                    className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                  >
                    <option value="no">{t("common.no")}</option>
                    <option value="yes">{t("common.yes")}</option>
                  </select>
                  <span className="text-xs text-muted-foreground">{t("housing.firstHome.eligibility")}</span>
                </label>
              )}

              <div className="space-y-2">
                <div>
                  <h3 className="text-sm font-semibold">{t("housing.developerPackage")}</h3>
                  <p className="text-xs text-muted-foreground">{t("housing.developerPackage.hint")}</p>
                </div>
                <NumberField
                  label={t("housing.inputs.rebate")}
                  value={rebateInput}
                  onChange={setRebateInput}
                  placeholder="e.g. 10"
                  suffix="%"
                  hint={t("housing.inputs.rebate.hint")}
                />
                <ToggleRow label={t("housing.inputs.absorbLegal")} checked={absorbLegal} onChange={setAbsorbLegal} />
                <NumberField
                  label={t("housing.inputs.motShare")}
                  value={motShareInput}
                  onChange={setMotShareInput}
                  placeholder="e.g. 50"
                  suffix="%"
                  hint={t("housing.inputs.motShare.hint")}
                />
              </div>

              <div className="space-y-2">
                <NumberField
                  label={t("housing.inputs.mrta")}
                  value={mrtaInput}
                  onChange={setMrtaInput}
                  placeholder="e.g. 20,000"
                  hint={t("housing.inputs.mrta.hint")}
                />
                {parsed.mrtaPremium > 0 && (
                  <ToggleRow label={t("housing.inputs.financeMrta")} checked={financeMrta} onChange={setFinanceMrta} />
                )}
              </div>

              <NumberField
                label={t("housing.inputs.extraMonthly")}
                value={extraInput}
                onChange={setExtraInput}
                placeholder="e.g. 500"
                hint={t("housing.inputs.extraMonthly.hint")}
              />

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                <div className="flex gap-2">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>{t("housing.disclaimer")}</p>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full gap-2 rounded-2xl text-base font-semibold"
                disabled={!isValid}
                onClick={handleCalculate}
              >
                <CalculatorIcon className="h-4 w-4" />
                {hasCalculated ? t("housing.cta.recalculate") : t("housing.cta.calculate")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div ref={resultsRef} className="space-y-6 min-w-0">
            <Card className="lg:hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-indigo-900/50 text-white">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-indigo-100">{t("housing.monthlyInstallment")}</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold break-words tabular-nums">
                  {money2(showResults ? result.monthlyInstallment : 0)}
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {showResults ? `${t("housing.over")} ${parsed.tenureYears} ${t("housing.years")}` : t("housing.cta.tapToReveal")}
                </p>
              </CardContent>
            </Card>

            {!showResults ? (
              <Card className="rounded-2xl sm:rounded-3xl border-dashed border-slate-300/60 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-900/30">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-6 sm:p-10 text-center">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Home className="h-6 w-6" />
                  </div>
                  <p className="text-base font-semibold">{t("housing.breakdown.ready")}</p>
                  <p className="max-w-sm text-sm text-muted-foreground">{t("housing.breakdown.hint")}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 min-w-0">
                  {([
                    [t("housing.loanAmount"), result.loanAmount, Wallet, `${result.marginPct}% ${t("housing.marginOfFinance").toLowerCase()}`],
                    [t("housing.totalInterest"), result.totalInterest, Receipt, ""],
                  ] as [string, number, typeof Wallet, string][]).map(([label, value, Icon, sub]) => (
                    <Card key={label} className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
                            <p className="mt-1 text-xl sm:text-2xl font-bold break-words tabular-nums">{money(value)}</p>
                            {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
                          </div>
                          <div className="rounded-2xl bg-primary/10 p-2.5 sm:p-3 text-primary flex-shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {result.monthsSaved > 0 && (
                  <Card className="rounded-2xl sm:rounded-3xl border-emerald-200 bg-emerald-50/60 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20 min-w-0">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <PiggyBank className="h-5 w-5 flex-shrink-0" />
                        <h3 className="font-semibold">{t("housing.savings.title")}</h3>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{t("housing.savings.interest")}</p>
                          <p className="mt-0.5 text-xl font-bold tabular-nums break-words text-emerald-700 dark:text-emerald-300">
                            {money(result.interestSaved)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{t("housing.savings.time")}</p>
                          <p className="mt-0.5 text-xl font-bold tabular-nums break-words text-emerald-700 dark:text-emerald-300">
                            {t("housing.savings.yearsMonths")
                              .replace("{years}", String(savedYears))
                              .replace("{months}", String(savedMonths))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                  <CardContent className="p-4 sm:p-6 min-w-0">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">{t("housing.upfront.title")}</h2>
                        <p className="text-sm text-muted-foreground">{t("housing.upfront.subtitle")}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ShareButton calculator="housing" state={parsed} schema={URL_SCHEMA} />
                        <SaveButton
                          calculator="housing"
                          state={parsed}
                          schema={URL_SCHEMA}
                          defaultName={`RM ${Math.round(parsed.price)} home`}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <CostRow
                        label={t("housing.downPayment")}
                        gross={result.downPayment}
                        payable={result.downPayment}
                        helper={`${100 - result.marginPct}% ${t("housing.ofPrice")}`}
                      />
                      <CostRow
                        label={t("housing.motStampDuty")}
                        gross={result.motDuty}
                        payable={result.payableMot}
                        helper={
                          result.exempt
                            ? t("housing.exempt")
                            : result.motAbsorbed > 0
                              ? `${t("housing.motAbsorbed")}: ${money(result.motAbsorbed)} ${t("housing.of")} ${money(result.motDuty)}`
                              : buyerType === "foreigner"
                                ? t("housing.foreignRate")
                                : t("housing.motStampDuty.hint")
                        }
                        waivedLabel={t("housing.coveredByDeveloper")}
                      />
                      <CostRow
                        label={t("housing.loanStampDuty")}
                        gross={result.loanDuty}
                        payable={result.payableLoanDuty}
                        helper={result.exempt ? t("housing.exempt") : t("housing.loanStampDuty.hint")}
                      />
                      <CostRow
                        label={t("housing.legalFees")}
                        gross={result.legalFees}
                        payable={result.payableLegal}
                        helper={t("housing.legalFees.hint")}
                        waivedLabel={t("housing.coveredByDeveloper")}
                      />
                      <CostRow
                        label={t("housing.valuationFee")}
                        gross={result.valuationFee}
                        payable={result.valuationFee}
                        helper={t("housing.valuationFee.hint")}
                      />
                      <CostRow
                        label={t("housing.disbursements")}
                        gross={result.disbursements}
                        payable={result.disbursements}
                        helper={t("housing.disbursements.hint")}
                      />
                      {parsed.mrtaPremium > 0 && (
                        <CostRow
                          label={t("housing.mrtaUpfront")}
                          gross={parsed.mrtaPremium}
                          payable={result.mrtaUpfront}
                          helper={t("housing.inputs.mrta.hint")}
                          waivedLabel={t("housing.mrtaFinanced")}
                        />
                      )}

                      {result.rebateAmount > 0 && (
                        <div className="rounded-2xl bg-emerald-50 px-3 sm:px-4 py-3 min-w-0 dark:bg-emerald-950/20">
                          <div className="flex items-center justify-between gap-3 min-w-0">
                            <span className="text-sm text-emerald-700 min-w-0 break-words dark:text-emerald-300">
                              {t("housing.rebateApplied")}
                            </span>
                            <span className="font-semibold tabular-nums text-right break-words text-emerald-700 dark:text-emerald-300">
                              −{money(result.rebateAmount)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{t("housing.inputs.rebate.hint")}</p>
                        </div>
                      )}

                      <div className="rounded-2xl bg-primary/10 px-3 sm:px-4 py-3.5 min-w-0">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <span className="text-sm font-semibold min-w-0 break-words">{t("housing.netCash")}</span>
                          <span className="text-lg font-bold tabular-nums text-right text-primary break-words">
                            {money(result.netCashRequired)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{t("housing.netCash.hint")}</p>
                      </div>

                      {result.rebateSurplus > 0 && (
                        <div className="rounded-2xl bg-emerald-100/70 px-3 sm:px-4 py-3 min-w-0 dark:bg-emerald-900/30">
                          <div className="flex items-center justify-between gap-3 min-w-0">
                            <span className="text-sm font-semibold min-w-0 break-words">{t("housing.rebateSurplus")}</span>
                            <span className="font-bold tabular-nums text-right break-words text-emerald-700 dark:text-emerald-300">
                              {money(result.rebateSurplus)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{t("housing.rebateSurplus.hint")}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                  <CardContent className="p-4 sm:p-6 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold">{t("housing.schedule.title")}</h2>
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setShowSchedule((open) => !open)}
                      >
                        {showSchedule ? t("housing.schedule.hide") : t("housing.schedule.show")}
                      </Button>
                    </div>

                    <div className="mt-4 flex items-end gap-[2px] h-28" aria-hidden="true">
                      {result.schedule.map((year) => {
                        const total = year.principalPaid + year.interestPaid;
                        const height = peakYearTotal > 0 ? (total / peakYearTotal) * 100 : 0;
                        const principalShare = total > 0 ? (year.principalPaid / total) * 100 : 0;
                        return (
                          <div
                            key={year.year}
                            className="flex-1 flex flex-col justify-end rounded-t-sm overflow-hidden bg-muted/40"
                            style={{ height: `${height}%` }}
                          >
                            <div className="w-full bg-amber-400/70" style={{ height: `${100 - principalShare}%` }} />
                            <div className="w-full bg-primary" style={{ height: `${principalShare}%` }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                        {t("housing.schedule.principal")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-amber-400/70" />
                        {t("housing.schedule.interest")}
                      </span>
                    </div>

                    {showSchedule && (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-muted-foreground">
                              <th className="py-2 pr-3 font-medium">{t("housing.schedule.year")}</th>
                              <th className="py-2 px-3 font-medium text-right">{t("housing.schedule.principal")}</th>
                              <th className="py-2 px-3 font-medium text-right">{t("housing.schedule.interest")}</th>
                              <th className="py-2 pl-3 font-medium text-right">{t("housing.schedule.balance")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.schedule.map((year) => (
                              <tr key={year.year} className="border-b border-muted last:border-0">
                                <td className="py-2 pr-3 tabular-nums">{year.year}</td>
                                <td className="py-2 px-3 text-right tabular-nums">{money(year.principalPaid)}</td>
                                <td className="py-2 px-3 text-right tabular-nums">{money(year.interestPaid)}</td>
                                <td className="py-2 pl-3 text-right tabular-nums">{money(year.closingBalance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <RelatedToolsCard currentHref="/housing-loan" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
