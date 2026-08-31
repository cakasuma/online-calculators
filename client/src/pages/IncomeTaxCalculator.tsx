import { ArrowRight, Calculator as CalculatorIcon, ChevronDown, Info, Landmark, Percent, Receipt } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
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
  calculateIncomeTax,
  INCOME_TAX_DEFAULTS,
  type HousingLoanBand,
  type IncomeTaxInputs,
} from "@/lib/incomeTax";
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
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const money0 = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const percent = (value: number) => `${value.toFixed(2)}%`;

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
  suffix,
  maxDecimals,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  suffix?: string;
  maxDecimals?: number;
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

/**
 * A collapsible group of relief inputs. There are too many statutory reliefs to
 * show at once, so all but the first group start closed.
 */
function ReliefGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold">{title}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-4 border-t border-slate-200 px-4 py-4 dark:border-slate-800">{children}</div>}
    </div>
  );
}

const URL_SCHEMA: UrlSchema<IncomeTaxInputs> = {
  annualIncome: numberField("income"),
  disabledSelf: boolField("oku"),
  spouse: enumField<IncomeTaxInputs, "spouse">("spouse", ["yes", "no"]),
  disabledSpouse: boolField("okuspouse"),
  childrenUnder18: numberField("kids"),
  childrenTertiary: numberField("kidsuni"),
  disabledChildren: numberField("okukids"),
  disabledChildrenTertiary: numberField("okukidsuni"),
  medical: numberField("med"),
  parentsMedical: numberField("pmed"),
  supportingEquipment: numberField("equip"),
  lifeInsurance: numberField("life"),
  educationMedicalInsurance: numberField("edumedins"),
  epf: numberField("epf"),
  socsoEis: numberField("socso"),
  prs: numberField("prs"),
  sspn: numberField("sspn"),
  educationFees: numberField("edu"),
  lifestyle: numberField("style"),
  sports: numberField("sport"),
  childcare: numberField("care"),
  breastfeeding: numberField("bf"),
  evCharging: numberField("ev"),
  housingLoanInterest: numberField("hli"),
  housingLoanBand: enumField<IncomeTaxInputs, "housingLoanBand">("hliband", ["upTo500k", "above500k"]),
  zakat: numberField("zakat"),
};

interface Props {
  onCalculate?: (expression: string, result: string, url?: string) => void;
}

export default function IncomeTaxCalculator({ onCalculate }: Props = {}) {
  const { t } = useLocale();
  const [initial] = useState<IncomeTaxInputs>(() =>
    mergeFromUrl<IncomeTaxInputs>(INCOME_TAX_DEFAULTS, URL_SCHEMA),
  );
  const arrivedViaShare = useMemo(() => urlHasSchemaParams(URL_SCHEMA), []);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Numeric fields are held as strings so the user can type freely.
  const [num, setNum] = useState<Record<string, string>>(() => ({
    annualIncome: toInputString(initial.annualIncome),
    childrenUnder18: toInputString(initial.childrenUnder18),
    childrenTertiary: toInputString(initial.childrenTertiary),
    disabledChildren: toInputString(initial.disabledChildren),
    disabledChildrenTertiary: toInputString(initial.disabledChildrenTertiary),
    medical: toInputString(initial.medical),
    parentsMedical: toInputString(initial.parentsMedical),
    supportingEquipment: toInputString(initial.supportingEquipment),
    lifeInsurance: toInputString(initial.lifeInsurance),
    educationMedicalInsurance: toInputString(initial.educationMedicalInsurance),
    epf: toInputString(initial.epf),
    socsoEis: toInputString(initial.socsoEis),
    prs: toInputString(initial.prs),
    sspn: toInputString(initial.sspn),
    educationFees: toInputString(initial.educationFees),
    lifestyle: toInputString(initial.lifestyle),
    sports: toInputString(initial.sports),
    childcare: toInputString(initial.childcare),
    breastfeeding: toInputString(initial.breastfeeding),
    evCharging: toInputString(initial.evCharging),
    housingLoanInterest: toInputString(initial.housingLoanInterest),
    zakat: toInputString(initial.zakat),
  }));
  const setField = (key: string) => (value: string) => setNum((prev) => ({ ...prev, [key]: value }));

  const [spouse, setSpouse] = useState<"yes" | "no">(initial.spouse);
  const [disabledSelf, setDisabledSelf] = useState(initial.disabledSelf);
  const [disabledSpouse, setDisabledSpouse] = useState(initial.disabledSpouse);
  const [housingLoanBand, setHousingLoanBand] = useState<HousingLoanBand>(initial.housingLoanBand);

  const parsed = useMemo<IncomeTaxInputs>(() => {
    const n = (key: string) => Math.max(0, parseNumberInput(num[key] ?? ""));
    const c = (key: string) => Math.max(0, Math.round(parseNumberInput(num[key] ?? "")));
    return {
      annualIncome: n("annualIncome"),
      disabledSelf,
      spouse,
      disabledSpouse,
      childrenUnder18: c("childrenUnder18"),
      childrenTertiary: c("childrenTertiary"),
      disabledChildren: c("disabledChildren"),
      disabledChildrenTertiary: c("disabledChildrenTertiary"),
      medical: n("medical"),
      parentsMedical: n("parentsMedical"),
      supportingEquipment: n("supportingEquipment"),
      lifeInsurance: n("lifeInsurance"),
      educationMedicalInsurance: n("educationMedicalInsurance"),
      epf: n("epf"),
      socsoEis: n("socsoEis"),
      prs: n("prs"),
      sspn: n("sspn"),
      educationFees: n("educationFees"),
      lifestyle: n("lifestyle"),
      sports: n("sports"),
      childcare: n("childcare"),
      breastfeeding: n("breastfeeding"),
      evCharging: n("evCharging"),
      housingLoanInterest: n("housingLoanInterest"),
      housingLoanBand,
      zakat: n("zakat"),
    };
  }, [num, spouse, disabledSelf, disabledSpouse, housingLoanBand]);

  useUrlSync(parsed, URL_SCHEMA);

  const isValid = parsed.annualIncome > 0;
  const [hasCalculated, setHasCalculated] = useState(arrivedViaShare && isValid);
  const result = useMemo(() => calculateIncomeTax(parsed), [parsed]);
  const showResults = hasCalculated && isValid;

  function handleCalculate() {
    if (!isValid) return;
    setHasCalculated(true);
    setTimeout(() => {
      if (window.innerWidth < 1024) {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);

    const payload = {
      annualIncome: Math.round(parsed.annualIncome),
      totalReliefs: Math.round(result.totalReliefs),
      chargeableIncome: Math.round(result.chargeableIncome),
      taxPayable: Math.round(result.taxPayable),
      effectiveRate: Number(result.effectiveRate.toFixed(2)),
      monthlyPcb: Math.round(result.monthlyPcb),
    };
    track("calculator_complete", { calculator: "tax", ...payload });
    recordServerEvent({ calculator: "tax", event: "calculator_complete", payload });

    if (onCalculate) {
      const kids =
        parsed.childrenUnder18 + parsed.childrenTertiary + parsed.disabledChildren + parsed.disabledChildrenTertiary;
      const expression = `RM ${Math.round(parsed.annualIncome)}/yr • ${kids} ${kids === 1 ? "child" : "children"}${parsed.spouse === "yes" ? " • spouse" : ""}`;
      const resultStr = `Tax RM ${Math.round(result.taxPayable)}/yr • ${result.effectiveRate.toFixed(2)}% effective`;
      const url = buildShareUrl(parsed, URL_SCHEMA);
      onCalculate(expression, resultStr, url);
    }
  }

  function resetForm() {
    setNum({
      annualIncome: toInputString(INCOME_TAX_DEFAULTS.annualIncome),
      childrenUnder18: "",
      childrenTertiary: "",
      disabledChildren: "",
      disabledChildrenTertiary: "",
      medical: "",
      parentsMedical: "",
      supportingEquipment: "",
      lifeInsurance: "",
      educationMedicalInsurance: "",
      epf: toInputString(INCOME_TAX_DEFAULTS.epf),
      socsoEis: "",
      prs: "",
      sspn: "",
      educationFees: "",
      lifestyle: toInputString(INCOME_TAX_DEFAULTS.lifestyle),
      sports: "",
      childcare: "",
      breastfeeding: "",
      evCharging: "",
      housingLoanInterest: "",
      zakat: "",
    });
    setSpouse(INCOME_TAX_DEFAULTS.spouse);
    setDisabledSelf(INCOME_TAX_DEFAULTS.disabledSelf);
    setDisabledSpouse(INCOME_TAX_DEFAULTS.disabledSpouse);
    setHousingLoanBand(INCOME_TAX_DEFAULTS.housingLoanBand);
    setHasCalculated(false);
  }

  const capHint = (cap: number) => t("tax.cap").replace("{cap}", money0(cap));

  return (
    <div className="w-full">
      <CalculatorHero
        category="Finance"
        title={t("tax.title")}
        subtitle={t("tax.subtitle")}
        badges={[t("tax.badge"), t("tax.badge.private")]}
        result={
          <div className="rounded-[20px] border border-white/12 bg-white/[0.08] p-6 backdrop-blur-xl text-white">
            <p className="text-[13px] text-indigo-100">{t("tax.taxPayable")}</p>
            <p className="mt-2 text-3xl md:text-4xl font-bold break-words tabular-nums">
              {money(showResults ? result.taxPayable : 0)}
            </p>
            <p className="mt-4 text-[13px] text-white/60">
              {showResults
                ? `${t("tax.effectiveRate")} ${percent(result.effectiveRate)}`
                : t("tax.cta.tapToReveal")}
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
                  <h2 className="text-xl font-semibold">{t("tax.inputs.title")}</h2>
                  <p className="text-sm text-muted-foreground">{t("tax.inputs.subtitle")}</p>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={resetForm}>
                  {t("common.reset")}
                </Button>
              </div>

              <NumberField
                label={t("tax.inputs.income")}
                value={num.annualIncome}
                onChange={setField("annualIncome")}
                placeholder="e.g. 72,000"
                hint={t("tax.inputs.income.hint")}
              />

              <div className="pt-1">
                <p className="text-sm font-semibold">{t("tax.reliefs.title")}</p>
                <p className="text-xs text-muted-foreground">{t("tax.reliefs.subtitle")}</p>
              </div>

              <div className="space-y-3">
                <ReliefGroup title={t("tax.group.family")} defaultOpen>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">{t("tax.inputs.spouse")}</span>
                    <select
                      value={spouse}
                      onChange={(event) => setSpouse(event.target.value as "yes" | "no")}
                      className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                    >
                      <option value="no">{t("common.no")}</option>
                      <option value="yes">{t("common.yes")}</option>
                    </select>
                    <span className="text-xs text-muted-foreground">{t("tax.inputs.spouse.hint")}</span>
                  </label>
                  {spouse === "yes" && (
                    <ToggleRow
                      label={t("tax.inputs.disabledSpouse")}
                      checked={disabledSpouse}
                      onChange={setDisabledSpouse}
                    />
                  )}
                  <ToggleRow label={t("tax.inputs.disabledSelf")} checked={disabledSelf} onChange={setDisabledSelf} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField
                      label={t("tax.inputs.childrenUnder18")}
                      value={num.childrenUnder18}
                      onChange={setField("childrenUnder18")}
                      placeholder="e.g. 2"
                      maxDecimals={0}
                      hint={t("tax.inputs.childrenUnder18.hint")}
                    />
                    <NumberField
                      label={t("tax.inputs.childrenTertiary")}
                      value={num.childrenTertiary}
                      onChange={setField("childrenTertiary")}
                      placeholder="e.g. 1"
                      maxDecimals={0}
                      hint={t("tax.inputs.childrenTertiary.hint")}
                    />
                    <NumberField
                      label={t("tax.inputs.disabledChildren")}
                      value={num.disabledChildren}
                      onChange={setField("disabledChildren")}
                      placeholder="0"
                      maxDecimals={0}
                      hint={t("tax.inputs.disabledChildren.hint")}
                    />
                    <NumberField
                      label={t("tax.inputs.disabledChildrenTertiary")}
                      value={num.disabledChildrenTertiary}
                      onChange={setField("disabledChildrenTertiary")}
                      placeholder="0"
                      maxDecimals={0}
                      hint={t("tax.inputs.disabledChildrenTertiary.hint")}
                    />
                  </div>
                </ReliefGroup>

                <ReliefGroup title={t("tax.group.medical")}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField
                      label={t("tax.inputs.medical")}
                      value={num.medical}
                      onChange={setField("medical")}
                      placeholder="0"
                      hint={capHint(10000)}
                    />
                    <NumberField
                      label={t("tax.inputs.parentsMedical")}
                      value={num.parentsMedical}
                      onChange={setField("parentsMedical")}
                      placeholder="0"
                      hint={capHint(8000)}
                    />
                    <NumberField
                      label={t("tax.inputs.lifeInsurance")}
                      value={num.lifeInsurance}
                      onChange={setField("lifeInsurance")}
                      placeholder="0"
                      hint={t("tax.inputs.lifeInsurance.hint")}
                    />
                    <NumberField
                      label={t("tax.inputs.educationMedicalInsurance")}
                      value={num.educationMedicalInsurance}
                      onChange={setField("educationMedicalInsurance")}
                      placeholder="0"
                      hint={capHint(3000)}
                    />
                    <NumberField
                      label={t("tax.inputs.supportingEquipment")}
                      value={num.supportingEquipment}
                      onChange={setField("supportingEquipment")}
                      placeholder="0"
                      hint={t("tax.inputs.supportingEquipment.hint")}
                    />
                  </div>
                </ReliefGroup>

                <ReliefGroup title={t("tax.group.savings")}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField
                      label={t("tax.inputs.epf")}
                      value={num.epf}
                      onChange={setField("epf")}
                      placeholder="max 4,000"
                      hint={t("tax.inputs.epf.hint")}
                    />
                    <NumberField
                      label={t("tax.inputs.socsoEis")}
                      value={num.socsoEis}
                      onChange={setField("socsoEis")}
                      placeholder="0"
                      hint={capHint(350)}
                    />
                    <NumberField
                      label={t("tax.inputs.prs")}
                      value={num.prs}
                      onChange={setField("prs")}
                      placeholder="0"
                      hint={capHint(3000)}
                    />
                    <NumberField
                      label={t("tax.inputs.sspn")}
                      value={num.sspn}
                      onChange={setField("sspn")}
                      placeholder="0"
                      hint={capHint(8000)}
                    />
                    <NumberField
                      label={t("tax.inputs.educationFees")}
                      value={num.educationFees}
                      onChange={setField("educationFees")}
                      placeholder="0"
                      hint={capHint(7000)}
                    />
                  </div>
                </ReliefGroup>

                <ReliefGroup title={t("tax.group.lifestyle")}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField
                      label={t("tax.inputs.lifestyle")}
                      value={num.lifestyle}
                      onChange={setField("lifestyle")}
                      placeholder="max 2,500"
                      hint={t("tax.inputs.lifestyle.hint")}
                    />
                    <NumberField
                      label={t("tax.inputs.sports")}
                      value={num.sports}
                      onChange={setField("sports")}
                      placeholder="0"
                      hint={t("tax.inputs.sports.hint")}
                    />
                    <NumberField
                      label={t("tax.inputs.childcare")}
                      value={num.childcare}
                      onChange={setField("childcare")}
                      placeholder="0"
                      hint={capHint(3000)}
                    />
                    <NumberField
                      label={t("tax.inputs.breastfeeding")}
                      value={num.breastfeeding}
                      onChange={setField("breastfeeding")}
                      placeholder="0"
                      hint={t("tax.inputs.breastfeeding.hint")}
                    />
                    <NumberField
                      label={t("tax.inputs.evCharging")}
                      value={num.evCharging}
                      onChange={setField("evCharging")}
                      placeholder="0"
                      hint={capHint(2500)}
                    />
                    <NumberField
                      label={t("tax.inputs.housingLoanInterest")}
                      value={num.housingLoanInterest}
                      onChange={setField("housingLoanInterest")}
                      placeholder="0"
                    />
                  </div>
                  {parsed.housingLoanInterest > 0 && (
                    <label className="block space-y-2">
                      <span className="text-sm font-medium">{t("tax.inputs.housingLoanBand")}</span>
                      <select
                        value={housingLoanBand}
                        onChange={(event) => setHousingLoanBand(event.target.value as HousingLoanBand)}
                        className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                      >
                        <option value="upTo500k">{t("tax.band.upTo500k")}</option>
                        <option value="above500k">{t("tax.band.above500k")}</option>
                      </select>
                    </label>
                  )}
                </ReliefGroup>
              </div>

              <div className="space-y-2">
                <NumberField
                  label={t("tax.inputs.zakat")}
                  value={num.zakat}
                  onChange={setField("zakat")}
                  placeholder="0"
                  hint={t("tax.inputs.zakat.hint")}
                />
                <Link href="/zakat" className="inline-block text-xs font-medium text-primary hover:underline">
                  {t("tax.zakatLink")} →
                </Link>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                <div className="flex gap-2">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>{t("tax.disclaimer")}</p>
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
                {hasCalculated ? t("tax.cta.recalculate") : t("tax.cta.calculate")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div ref={resultsRef} className="space-y-6 min-w-0">
            <Card className="lg:hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-indigo-900/50 text-white">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-indigo-100">{t("tax.taxPayable")}</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold break-words tabular-nums">
                  {money(showResults ? result.taxPayable : 0)}
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {showResults ? `${t("tax.effectiveRate")} ${percent(result.effectiveRate)}` : t("tax.cta.tapToReveal")}
                </p>
              </CardContent>
            </Card>

            {!showResults ? (
              <Card className="rounded-2xl sm:rounded-3xl border-dashed border-slate-300/60 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-900/30">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-6 sm:p-10 text-center">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Landmark className="h-6 w-6" />
                  </div>
                  <p className="text-base font-semibold">{t("tax.breakdown.ready")}</p>
                  <p className="max-w-sm text-sm text-muted-foreground">{t("tax.breakdown.hint")}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 min-w-0">
                  {([
                    [t("tax.monthlyPcb"), result.monthlyPcb, Receipt],
                    [t("tax.effectiveRateLabel"), result.effectiveRate, Percent],
                  ] as [string, number, typeof Receipt][]).map(([label, value, Icon], i) => (
                    <Card key={label} className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
                            <p className="mt-1 text-xl sm:text-2xl font-bold break-words tabular-nums">
                              {i === 1 ? percent(value) : money(value)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-primary/10 p-2.5 sm:p-3 text-primary flex-shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                  <CardContent className="p-4 sm:p-6 min-w-0">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">{t("tax.breakdown.title")}</h2>
                        <p className="text-sm text-muted-foreground">{t("tax.breakdown.subtitle")}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ShareButton calculator="tax" state={parsed} schema={URL_SCHEMA} />
                        <SaveButton
                          calculator="tax"
                          state={parsed}
                          schema={URL_SCHEMA}
                          defaultName={`Tax RM ${Math.round(parsed.annualIncome)}/yr`}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {([
                        [t("tax.totalReliefs"), result.totalReliefs, t("tax.totalReliefs.hint")],
                        [t("tax.chargeableIncome"), result.chargeableIncome, t("tax.chargeableIncome.hint")],
                        [t("tax.taxBeforeRebate"), result.taxBeforeRebate, t("tax.taxBeforeRebate.hint")],
                        [t("tax.individualRebate"), result.individualRebate, t("tax.rebate.hint")],
                      ] as [string, number, string][]).map(([label, value, helper]) => (
                        <div key={label} className="rounded-2xl bg-muted/50 px-3 sm:px-4 py-3 min-w-0">
                          <div className="flex items-center justify-between gap-3 min-w-0">
                            <span className="text-sm text-muted-foreground min-w-0 break-words">{label}</span>
                            <span className="font-semibold tabular-nums text-right break-words">{money(value)}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
                        </div>
                      ))}
                      {result.zakatRebate > 0 && (
                        <div className="rounded-2xl bg-emerald-50 px-3 sm:px-4 py-3 min-w-0 dark:bg-emerald-950/20">
                          <div className="flex items-center justify-between gap-3 min-w-0">
                            <span className="text-sm text-emerald-700 min-w-0 break-words dark:text-emerald-300">
                              {t("tax.zakatRebate")}
                            </span>
                            <span className="font-semibold tabular-nums text-right break-words text-emerald-700 dark:text-emerald-300">
                              −{money(result.zakatRebate)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{t("tax.zakatRebate.hint")}</p>
                        </div>
                      )}
                      <div className="rounded-2xl bg-primary/10 px-3 sm:px-4 py-3.5 min-w-0">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <span className="text-sm font-semibold min-w-0 break-words">{t("tax.taxPayable")}</span>
                          <span className="text-lg font-bold tabular-nums text-right text-primary break-words">
                            {money(result.taxPayable)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("tax.effectiveRate")} {percent(result.effectiveRate)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                  <CardContent className="p-4 sm:p-6 min-w-0">
                    <h2 className="text-xl font-semibold">{t("tax.reliefBreakdown")}</h2>
                    <p className="text-sm text-muted-foreground">{t("tax.reliefBreakdown.hint")}</p>
                    <div className="mt-4 space-y-2">
                      {result.reliefLines.map((line) => {
                        const atCap = line.claimed >= line.cap;
                        return (
                          <div
                            key={line.key}
                            className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2 min-w-0"
                          >
                            <span className="text-sm min-w-0 break-words">{t(`tax.relief.${line.key}` as never)}</span>
                            <span className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-semibold tabular-nums">{money0(line.claimed)}</span>
                              {atCap && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                  {t("tax.cap").replace("{cap}", money0(line.cap))}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <RelatedToolsCard currentHref="/income-tax" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
