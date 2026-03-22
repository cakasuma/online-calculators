import { useState, useCallback } from "react";
import { AlertTriangle, Info, Printer, Users, BookOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/hooks/use-locale";
import { TermTooltip } from "@/components/TermTooltip";
import { AdSlot } from "@/components/AdSlot";
import { formatInputValue } from "@/lib/i18n";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  onCalculate: (expression: string, result: string) => void;
}

// ─── Currencies ───────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "MYR", symbol: "RM" },
  { code: "IDR", symbol: "Rp" },
  { code: "USD", symbol: "$" },
  { code: "SAR", symbol: "﷼" },
  { code: "SGD", symbol: "S$" },
  { code: "GBP", symbol: "£" },
];

// ─── Chart colours ────────────────────────────────────────────────────────────
const CHART_COLORS = [
  "#0EA5E9", "#8B5CF6", "#10B981", "#F97316",
  "#EC4899", "#F59E0B", "#6366F1", "#06B6D4",
  "#EF4444", "#84CC16",
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormState {
  totalEstate: string;
  debtsAndExpenses: string;
  wasiyyah: string;
  currency: string;
  hasHusband: boolean;
  numberOfWives: number;
  hasFather: boolean;
  hasPaternalGrandfather: boolean;
  hasMother: boolean;
  sons: number;
  daughters: number;
  fullBrothers: number;
  fullSisters: number;
}

interface ComputedHeir {
  key: string;
  name: string;
  share: string;
  fraction: number;
  amount: number;
  percentage: number;
  type: "fixed" | "asabah" | "fixed+asabah";
}

interface BlockedHeir {
  name: string;
  blockedBy: string;
}

interface DistributionResult {
  heirs: ComputedHeir[];
  blockedHeirs: BlockedHeir[];
  netEstate: number;
  hasAwl: boolean;
  awlFactor: number;
  undistributed: number;
  hasUmariyyatain: boolean;
}

interface ValidationErrors {
  totalEstate?: string;
  debtsAndExpenses?: string;
  wasiyyah?: string;
  heirs?: string;
}

// ─── Initial form ─────────────────────────────────────────────────────────────
const initialForm: FormState = {
  totalEstate: "",
  debtsAndExpenses: "",
  wasiyyah: "",
  currency: "MYR",
  hasHusband: false,
  numberOfWives: 0,
  hasFather: false,
  hasPaternalGrandfather: false,
  hasMother: false,
  sons: 0,
  daughters: 0,
  fullBrothers: 0,
  fullSisters: 0,
};

// ─── Calculation engine ───────────────────────────────────────────────────────
function computeDistribution(form: FormState, net: number): DistributionResult {
  const heirs: ComputedHeir[] = [];
  const blockedHeirs: BlockedHeir[] = [];
  const notes: string[] = [];

  const hasChildren = form.sons > 0 || form.daughters > 0;
  const hasSpouse = form.hasHusband || form.numberOfWives > 0;

  // Spouse fraction (for umariyyatain)
  const spouseFraction = form.hasHusband
    ? hasChildren ? 1 / 4 : 1 / 2
    : form.numberOfWives > 0
    ? hasChildren ? 1 / 8 : 1 / 4
    : 0;

  // Blocking rules
  const grandfatherBlocked = form.hasFather;
  const siblingsBlocked =
    form.hasFather ||
    form.hasPaternalGrandfather ||
    form.sons > 0;

  // Track blocked heirs
  if (form.hasPaternalGrandfather && grandfatherBlocked) {
    blockedHeirs.push({ name: "Paternal Grandfather", blockedBy: "Father" });
  }
  if ((form.fullBrothers > 0 || form.fullSisters > 0) && siblingsBlocked) {
    const blocker = form.hasFather
      ? "Father"
      : form.hasPaternalGrandfather
      ? "Paternal Grandfather"
      : "Sons";
    if (form.fullBrothers > 0)
      blockedHeirs.push({ name: "Full Brothers", blockedBy: blocker });
    if (form.fullSisters > 0)
      blockedHeirs.push({ name: "Full Sisters", blockedBy: blocker });
  }

  // ── Fixed-share heirs ──
  type FixedEntry = { key: string; name: string; frac: number; share: string };
  const fixedEntries: FixedEntry[] = [];

  // Husband
  if (form.hasHusband) {
    const frac = hasChildren ? 1 / 4 : 1 / 2;
    fixedEntries.push({ key: "husband", name: "Husband", frac, share: hasChildren ? "1/4" : "1/2" });
  }

  // Wives
  if (form.numberOfWives > 0) {
    const totalFrac = hasChildren ? 1 / 8 : 1 / 4;
    const baseShare = hasChildren ? "1/8" : "1/4";
    if (form.numberOfWives === 1) {
      fixedEntries.push({ key: "wife_1", name: "Wife", frac: totalFrac, share: baseShare });
    } else {
      const perWife = totalFrac / form.numberOfWives;
      for (let i = 0; i < form.numberOfWives; i++) {
        fixedEntries.push({
          key: `wife_${i + 1}`,
          name: `Wife ${i + 1}`,
          frac: perWife,
          share: `${baseShare} ÷ ${form.numberOfWives}`,
        });
      }
    }
  }

  // Father
  let fatherIsAsabah = false;
  if (form.hasFather) {
    if (hasChildren) {
      fixedEntries.push({ key: "father", name: "Father", frac: 1 / 6, share: "1/6" });
    } else {
      fatherIsAsabah = true;
    }
  }

  // Paternal Grandfather (not blocked)
  let grandfatherIsAsabah = false;
  if (form.hasPaternalGrandfather && !grandfatherBlocked) {
    if (hasChildren) {
      fixedEntries.push({ key: "grandfather", name: "Paternal Grandfather", frac: 1 / 6, share: "1/6" });
    } else {
      grandfatherIsAsabah = true;
    }
  }

  // Mother
  let hasUmariyyatain = false;
  if (form.hasMother) {
    const totalSiblings = form.fullBrothers + form.fullSisters;
    let frac: number;
    let share: string;
    if (hasChildren || totalSiblings >= 2) {
      frac = 1 / 6;
      share = "1/6";
    } else if (form.hasFather && hasSpouse && !hasChildren) {
      // Umariyyatain: mother gets 1/3 of remainder after spouse deduction
      frac = (1 - spouseFraction) / 3;
      share = "1/3 of remainder";
      hasUmariyyatain = true;
    } else {
      frac = 1 / 3;
      share = "1/3";
    }
    fixedEntries.push({ key: "mother", name: "Mother", frac, share });
  }

  // Daughters only (no sons) → fixed shares
  if (form.daughters > 0 && form.sons === 0) {
    const totalFrac = form.daughters === 1 ? 1 / 2 : 2 / 3;
    const perDaughter = totalFrac / form.daughters;
    const shareLabel =
      form.daughters === 1
        ? "1/2"
        : form.daughters === 2
        ? "1/3 each (2/3 total)"
        : `2/3 ÷ ${form.daughters}`;
    for (let i = 0; i < form.daughters; i++) {
      fixedEntries.push({
        key: `daughter_${i}`,
        name: form.daughters === 1 ? "Daughter" : `Daughter ${i + 1}`,
        frac: perDaughter,
        share: shareLabel,
      });
    }
  }

  // Sisters only (no brothers, not blocked, no children)
  if (
    !siblingsBlocked &&
    form.fullSisters > 0 &&
    form.fullBrothers === 0 &&
    !hasChildren
  ) {
    const totalFrac = form.fullSisters === 1 ? 1 / 2 : 2 / 3;
    const perSister = totalFrac / form.fullSisters;
    const shareLabel =
      form.fullSisters === 1
        ? "1/2"
        : form.fullSisters === 2
        ? "1/3 each (2/3 total)"
        : `2/3 ÷ ${form.fullSisters}`;
    for (let i = 0; i < form.fullSisters; i++) {
      fixedEntries.push({
        key: `sister_${i}`,
        name: form.fullSisters === 1 ? "Full Sister" : `Full Sister ${i + 1}`,
        frac: perSister,
        share: shareLabel,
      });
    }
  }

  // ── Awl check ─────────────────────────────────────────────────────────────
  const fixedTotal = fixedEntries.reduce((s, e) => s + e.frac, 0);
  const hasAwl = fixedTotal > 1 + 1e-9;
  const awlFactor = hasAwl ? fixedTotal : 1;

  // Build fixed ComputedHeirs
  for (const e of fixedEntries) {
    const effectiveFrac = e.frac / awlFactor;
    const amount = net * effectiveFrac;
    heirs.push({
      key: e.key,
      name: e.name,
      share: e.share + (hasAwl ? ` (reduced)` : ""),
      fraction: effectiveFrac,
      amount,
      percentage: effectiveFrac * 100,
      type: "fixed",
    });
  }

  // ── Asabah (residual) ─────────────────────────────────────────────────────
  const fixedAmountTotal = heirs.reduce((s, h) => s + h.amount, 0);
  let remaining = net - fixedAmountTotal;

  if (form.sons > 0) {
    // Sons + daughters share remainder 2:1
    const totalParts = form.sons * 2 + form.daughters;
    for (let i = 0; i < form.sons; i++) {
      const amount = (remaining * 2) / totalParts;
      heirs.push({
        key: `son_${i}`,
        name: form.sons === 1 ? "Son" : `Son ${i + 1}`,
        share: "asabah (2:1)",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    for (let i = 0; i < form.daughters; i++) {
      const amount = remaining / totalParts;
      heirs.push({
        key: `daughter_asabah_${i}`,
        name: form.daughters === 1 ? "Daughter" : `Daughter ${i + 1}`,
        share: "asabah (1:2)",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    remaining = 0;
  } else if (hasChildren && form.hasFather && form.daughters > 0) {
    // Daughters (fixed) + father gets residual (tasib)
    if (remaining > 0.001) {
      const fatherIdx = heirs.findIndex((h) => h.key === "father");
      if (fatherIdx >= 0) {
        heirs[fatherIdx].amount += remaining;
        heirs[fatherIdx].fraction = heirs[fatherIdx].amount / net;
        heirs[fatherIdx].percentage = heirs[fatherIdx].fraction * 100;
        heirs[fatherIdx].share = "1/6 + residual";
        heirs[fatherIdx].type = "fixed+asabah";
      }
      remaining = 0;
    }
  } else if (fatherIsAsabah) {
    // No children: father takes all remaining
    heirs.push({
      key: "father_asabah",
      name: "Father",
      share: "asabah",
      fraction: remaining / net,
      amount: remaining,
      percentage: (remaining / net) * 100,
      type: "asabah",
    });
    remaining = 0;
  } else if (grandfatherIsAsabah) {
    heirs.push({
      key: "grandfather_asabah",
      name: "Paternal Grandfather",
      share: "asabah",
      fraction: remaining / net,
      amount: remaining,
      percentage: (remaining / net) * 100,
      type: "asabah",
    });
    remaining = 0;
  } else if (!siblingsBlocked && form.fullBrothers > 0) {
    // Brothers + sisters as asabah (2:1)
    const totalParts = form.fullBrothers * 2 + form.fullSisters;
    for (let i = 0; i < form.fullBrothers; i++) {
      const amount = (remaining * 2) / totalParts;
      heirs.push({
        key: `brother_${i}`,
        name: form.fullBrothers === 1 ? "Full Brother" : `Full Brother ${i + 1}`,
        share: "asabah (2:1)",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    for (let i = 0; i < form.fullSisters; i++) {
      const amount = remaining / totalParts;
      heirs.push({
        key: `sister_asabah_${i}`,
        name: form.fullSisters === 1 ? "Full Sister" : `Full Sister ${i + 1}`,
        share: "asabah (1:2)",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    remaining = 0;
  }

  const undistributed = remaining > 0.001 ? remaining : 0;

  return { heirs, blockedHeirs, netEstate: net, hasAwl, awlFactor, undistributed, hasUmariyyatain };
}

// ─── Counter component ────────────────────────────────────────────────────────
function Counter({
  value,
  onChange,
  max = 20,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted text-sm font-medium"
      >
        −
      </button>
      <span className="text-sm font-mono w-6 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted text-sm font-medium"
      >
        +
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FaraidCalculator({ onCalculate }: Props) {
  const { t, locale } = useLocale();
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<DistributionResult | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const currencySymbol = CURRENCIES.find((c) => c.code === form.currency)?.symbol ?? "RM";

  function parseInput(val: string): number {
    if (!val || val.trim() === "") return 0;
    const cleaned =
      locale === "id"
        ? val.replace(/\./g, "").replace(",", ".")
        : val.replace(/,/g, "");
    return parseFloat(cleaned) || 0;
  }

  function validate(): boolean {
    const errs: ValidationErrors = {};
    const estate = parseInput(form.totalEstate);
    const debts = parseInput(form.debtsAndExpenses);
    const wasiyyah = parseInput(form.wasiyyah);

    if (!form.totalEstate.trim()) {
      errs.totalEstate = t("validation.required");
    } else if (isNaN(estate) || estate <= 0) {
      errs.totalEstate = t("validation.positiveNumber");
    }
    if (form.debtsAndExpenses.trim() && (isNaN(debts) || debts < 0)) {
      errs.debtsAndExpenses = t("validation.positiveNumber");
    }
    if (estate > 0 && debts >= estate) {
      errs.debtsAndExpenses = t("validation.debtsExceedEstate");
    }
    const net = estate - debts;
    if (form.wasiyyah.trim() && (isNaN(wasiyyah) || wasiyyah < 0)) {
      errs.wasiyyah = t("validation.positiveNumber");
    } else if (wasiyyah > net / 3) {
      errs.wasiyyah = t("validation.wasiyyahExceeds");
    }

    const hasHeirs =
      form.hasHusband ||
      form.numberOfWives > 0 ||
      form.hasFather ||
      form.hasPaternalGrandfather ||
      form.hasMother ||
      form.sons > 0 ||
      form.daughters > 0 ||
      form.fullBrothers > 0 ||
      form.fullSisters > 0;
    if (!hasHeirs) {
      errs.heirs = t("validation.noHeirs");
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const calculate = useCallback(() => {
    if (!validate()) return;
    const estate = parseInput(form.totalEstate);
    const debts = parseInput(form.debtsAndExpenses);
    const wasiyyah = parseInput(form.wasiyyah);
    const net = estate - debts - wasiyyah;

    const dist = computeDistribution(form, net);
    setResult(dist);

    const expr = `Faraid (${form.currency}): ${form.totalEstate}`;
    const res = `Net: ${formatAmount(net)} | ${dist.heirs.length} heirs`;
    onCalculate(expr, res);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, locale, onCalculate]);

  const formatAmount = (n: number) => {
    const locStr = locale === "id" ? "id-ID" : "en-US";
    return (
      currencySymbol +
      " " +
      n.toLocaleString(locStr, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  };

  function handlePrint() {
    window.print();
  }

  function handleShareWhatsApp() {
    if (!result) return;
    const lines = [
      `*Faraid Distribution Results*`,
      `Net Estate: ${formatAmount(result.netEstate)}`,
      ``,
      ...result.heirs.map(
        (h) => `• ${h.name}: ${formatAmount(h.amount)} (${h.percentage.toFixed(1)}%)`
      ),
    ];
    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, heirs: undefined }));
  }

  const estate = parseInput(form.totalEstate);
  const debts = parseInput(form.debtsAndExpenses);
  const wasiyyah = parseInput(form.wasiyyah);
  const liveNet = Math.max(0, estate - debts - wasiyyah);

  return (
    <div className="max-w-2xl mx-auto space-y-4 print:space-y-3">
      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm print:hidden">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-300">
            {t("faraid.disclaimer.title")}
          </p>
          <p className="text-amber-700 dark:text-amber-400 mt-0.5 text-xs">
            {t("faraid.disclaimer.text")}
          </p>
        </div>
      </div>

      {/* Currency selector */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">{t("faraid.currency")}:</span>
            <div className="flex flex-wrap gap-1.5">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setField("currency", c.code)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.currency === c.code
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.code} ({c.symbol})
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estate Details */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="text-sm font-semibold">{t("faraid.estateDetails")}</h2>

          <div className="space-y-1">
            <Label htmlFor="total-estate" className="text-xs">
              <TermTooltip termKey="tooltip.totalEstate">{t("faraid.totalEstate")}</TermTooltip>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                {currencySymbol}
              </span>
              <Input
                id="total-estate"
                type="text"
                inputMode="decimal"
                value={form.totalEstate}
                onChange={(e) => {
                  setForm((f) => ({ ...f, totalEstate: formatInputValue(e.target.value, locale) }));
                  setErrors((er) => ({ ...er, totalEstate: undefined }));
                }}
                placeholder={locale === "id" ? "cth. 100.000" : "e.g. 100,000"}
                className={`pl-9 ${errors.totalEstate ? "border-destructive" : ""}`}
              />
            </div>
            {errors.totalEstate && (
              <p className="text-xs text-destructive">{errors.totalEstate}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="debts" className="text-xs">
              <TermTooltip termKey="tooltip.debts">{t("faraid.debts")}</TermTooltip>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                {currencySymbol}
              </span>
              <Input
                id="debts"
                type="text"
                inputMode="decimal"
                value={form.debtsAndExpenses}
                onChange={(e) => {
                  setForm((f) => ({ ...f, debtsAndExpenses: formatInputValue(e.target.value, locale) }));
                  setErrors((er) => ({ ...er, debtsAndExpenses: undefined }));
                }}
                placeholder="0"
                className={`pl-9 ${errors.debtsAndExpenses ? "border-destructive" : ""}`}
              />
            </div>
            {errors.debtsAndExpenses && (
              <p className="text-xs text-destructive">{errors.debtsAndExpenses}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="wasiyyah" className="text-xs">
              <TermTooltip termKey="tooltip.wasiyyah">{t("faraid.wasiyyah")}</TermTooltip>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                {currencySymbol}
              </span>
              <Input
                id="wasiyyah"
                type="text"
                inputMode="decimal"
                value={form.wasiyyah}
                onChange={(e) => {
                  setForm((f) => ({ ...f, wasiyyah: formatInputValue(e.target.value, locale) }));
                  setErrors((er) => ({ ...er, wasiyyah: undefined }));
                }}
                placeholder="0"
                className={`pl-9 ${errors.wasiyyah ? "border-destructive" : ""}`}
              />
            </div>
            {errors.wasiyyah && (
              <p className="text-xs text-destructive">{errors.wasiyyah}</p>
            )}
          </div>

          {/* Live estate breakdown */}
          {estate > 0 && (
            <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs">
              <p className="font-medium text-xs">{t("faraid.estateBreakdown")}</p>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("faraid.totalEstate")}</span>
                <span className="font-mono">{formatAmount(estate)}</span>
              </div>
              {debts > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>− {t("faraid.debts")}</span>
                  <span className="font-mono text-destructive">−{formatAmount(debts)}</span>
                </div>
              )}
              {wasiyyah > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>− {t("faraid.wasiyyah")}</span>
                  <span className="font-mono text-destructive">−{formatAmount(wasiyyah)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-1.5">
                <span>{t("faraid.netEstate")}</span>
                <span className="font-mono text-primary">{formatAmount(liveNet)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Heirs */}
      <Card>
        <CardContent className="pt-5 space-y-5">
          <h2 className="text-sm font-semibold">{t("faraid.heirs")}</h2>
          {errors.heirs && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <Info className="w-3 h-3" /> {errors.heirs}
            </p>
          )}

          {/* Spouse */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("faraid.spouseSection")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* Husband */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                <Label htmlFor="hasHusband" className="text-xs cursor-pointer">
                  <TermTooltip termKey="tooltip.husband">{t("faraid.husband")}</TermTooltip>
                </Label>
                <Switch
                  id="hasHusband"
                  checked={form.hasHusband}
                  onCheckedChange={(v) => {
                    setField("hasHusband", v);
                    if (v) setField("numberOfWives", 0);
                  }}
                />
              </div>

              {/* Wives count */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                <Label className="text-xs">
                  <TermTooltip termKey="tooltip.numberOfWives">{t("faraid.numberOfWives")}</TermTooltip>
                </Label>
                <Counter
                  value={form.numberOfWives}
                  max={4}
                  onChange={(n) => {
                    setField("numberOfWives", n);
                    if (n > 0) setField("hasHusband", false);
                  }}
                />
              </div>
            </div>
            {form.hasHusband && form.numberOfWives > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <Info className="w-3 h-3" /> Deceased cannot have both a husband and wives.
              </p>
            )}
          </section>

          {/* Parents */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("faraid.parentsSection")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "hasFather", labelKey: "faraid.father", tooltipKey: "tooltip.father" },
                { key: "hasMother", labelKey: "faraid.mother", tooltipKey: "tooltip.mother" },
              ].map(({ key, labelKey, tooltipKey }) => (
                <div key={key} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                  <Label htmlFor={key} className="text-xs cursor-pointer">
                    <TermTooltip termKey={tooltipKey as any}>{t(labelKey as any)}</TermTooltip>
                  </Label>
                  <Switch
                    id={key}
                    checked={form[key as keyof FormState] as boolean}
                    onCheckedChange={(v) => setField(key as keyof FormState, v as any)}
                  />
                </div>
              ))}

              {/* Paternal Grandfather */}
              <div
                className={`flex items-center justify-between p-2.5 rounded-lg border bg-card col-span-2 ${
                  form.hasFather ? "opacity-50" : ""
                }`}
              >
                <Label htmlFor="hasPaternalGrandfather" className="text-xs cursor-pointer flex-1">
                  <TermTooltip termKey="tooltip.grandfather">{t("faraid.grandfather")}</TermTooltip>
                  {form.hasFather && (
                    <span className="ml-2 text-muted-foreground text-[10px]">
                      ({t("faraid.blockedNote")} {t("faraid.blocked.father")})
                    </span>
                  )}
                </Label>
                <Switch
                  id="hasPaternalGrandfather"
                  checked={form.hasPaternalGrandfather}
                  disabled={form.hasFather}
                  onCheckedChange={(v) => setField("hasPaternalGrandfather", v)}
                />
              </div>
            </div>
          </section>

          {/* Children */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("faraid.childrenSection")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "sons", labelKey: "faraid.sons", tooltipKey: "tooltip.sons" },
                { key: "daughters", labelKey: "faraid.daughters", tooltipKey: "tooltip.daughters" },
              ].map(({ key, labelKey, tooltipKey }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">
                    <TermTooltip termKey={tooltipKey as any}>{t(labelKey as any)}</TermTooltip>
                  </Label>
                  <Counter
                    value={form[key as keyof FormState] as number}
                    onChange={(n) => setField(key as keyof FormState, n as any)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Siblings */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("faraid.siblingsSection")}
            </p>
            {(form.hasFather || form.hasPaternalGrandfather || form.sons > 0) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3 flex-shrink-0" />
                Siblings are blocked (hajb) by{" "}
                {form.hasFather
                  ? "Father"
                  : form.hasPaternalGrandfather
                  ? "Paternal Grandfather"
                  : "Sons"}
                .
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "fullBrothers", labelKey: "faraid.fullBrothers", tooltipKey: "tooltip.fullBrothers" },
                { key: "fullSisters", labelKey: "faraid.fullSisters", tooltipKey: "tooltip.fullSisters" },
              ].map(({ key, labelKey, tooltipKey }) => (
                <div
                  key={key}
                  className={`space-y-1 ${
                    form.hasFather || form.hasPaternalGrandfather || form.sons > 0 ? "opacity-50" : ""
                  }`}
                >
                  <Label className="text-xs">
                    <TermTooltip termKey={tooltipKey as any}>{t(labelKey as any)}</TermTooltip>
                  </Label>
                  <Counter
                    value={form[key as keyof FormState] as number}
                    onChange={(n) => setField(key as keyof FormState, n as any)}
                  />
                </div>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>

      {/* Ad slot — above calculate button */}
      <AdSlot id="ad-above-calculate" variant="banner" className="print:hidden" />

      <Button onClick={calculate} className="w-full" size="lg">
        {t("faraid.calculateDist")}
      </Button>

      {/* Results */}
      {result && (
        <>
          <Card className="print:shadow-none">
            <CardHeader className="pb-2 print:pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t("faraid.results")}</CardTitle>
                <div className="flex gap-2 print:hidden">
                  <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="gap-1.5 text-xs">
                    <Share2 className="w-3.5 h-3.5" />
                    {t("faraid.shareResults")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
                    <Printer className="w-3.5 h-3.5" />
                    {t("faraid.printResults")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Net estate summary */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex justify-between items-center">
                <span className="text-sm font-medium">{t("faraid.netEstate")}</span>
                <span className="font-mono font-bold text-primary">{formatAmount(result.netEstate)}</span>
              </div>

              {/* Notes */}
              {result.hasAwl && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-orange-800 dark:text-orange-300">{t("faraid.awlNote")}</span>
                </div>
              )}
              {result.hasUmariyyatain && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs">
                  <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-blue-800 dark:text-blue-300">{t("faraid.umariyyatainNote")}</span>
                </div>
              )}

              {/* Heirs table */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-12 text-[10px] text-muted-foreground px-2.5 pb-1 font-medium">
                  <span className="col-span-4">{t("faraid.heirs")}</span>
                  <span className="col-span-3 text-center">{t("faraid.share")}</span>
                  <span className="col-span-3 text-right">{t("faraid.amount")}</span>
                  <span className="col-span-2 text-right">{t("faraid.percentage")}</span>
                </div>
                {result.heirs.map((heir, idx) => (
                  <div
                    key={heir.key}
                    className="grid grid-cols-12 items-center p-2.5 rounded-lg bg-muted/40"
                  >
                    <div className="col-span-4 flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="text-xs font-medium leading-tight">{heir.name}</span>
                    </div>
                    <div className="col-span-3 text-center">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {heir.share}
                      </Badge>
                    </div>
                    <span className="col-span-3 text-right text-xs font-mono font-semibold">
                      {formatAmount(heir.amount)}
                    </span>
                    <span className="col-span-2 text-right text-xs text-muted-foreground font-mono">
                      {heir.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Blocked heirs */}
              {result.blockedHeirs.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("faraid.blockedHeirs")}
                  </p>
                  {result.blockedHeirs.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-dashed opacity-60"
                    >
                      <span className="text-xs text-muted-foreground line-through">{b.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {t("faraid.blockedNote")}: {b.blockedBy}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Undistributed */}
              {result.undistributed > 0 && (
                <div className="p-2.5 rounded-lg bg-muted/30 border border-dashed space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t("faraid.undistributed")}</span>
                    <span className="font-mono font-medium">{formatAmount(result.undistributed)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t("faraid.undistributedNote")}</p>
                </div>
              )}

              {/* Total distributed */}
              <div className="pt-1 border-t flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">{t("faraid.totalDistributed")}</span>
                <span className="font-mono font-semibold">
                  {formatAmount(result.heirs.reduce((s, h) => s + h.amount, 0))}
                </span>
              </div>

              {/* Pie chart */}
              {result.heirs.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium mb-2">{t("faraid.distribution")}</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={result.heirs.map((h) => ({ name: h.name, value: h.amount }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {result.heirs.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => [formatAmount(value), "Amount"]}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: "11px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Consultation CTA */}
          <Card className="border-primary/20 bg-primary/5 print:hidden">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t("faraid.consultCTA.title")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t("faraid.consultCTA.text")}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" asChild>
                <a href="https://www.google.com/search?q=certified+faraid+consultant" target="_blank" rel="noopener noreferrer">
                  <Users className="w-3.5 h-3.5" />
                  {t("faraid.consultCTA.button")}
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Ad slot — after results */}
          <AdSlot id="ad-after-results" variant="rectangle" className="print:hidden" />
        </>
      )}
    </div>
  );
}
