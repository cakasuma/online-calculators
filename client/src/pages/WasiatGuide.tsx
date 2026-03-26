import { useState } from "react";
import { Link } from "wouter";
import {
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ArrowRight,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AdSlot } from "@/components/AdSlot";
import { useLocale } from "@/hooks/use-locale";
import {
  formatCurrency,
  formatInputValue,
  parseLocaleNumber,
} from "@/lib/i18n";

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: "MYR", symbol: "RM" },
  { code: "IDR", symbol: "Rp" },
  { code: "USD", symbol: "$" },
  { code: "SAR", symbol: "﷼" },
  { code: "SGD", symbol: "S$" },
  { code: "GBP", symbol: "£" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Bequest {
  id: string;
  recipient: string;
  relationship: string;
  type: "cash" | "asset" | "percentage";
  amount: string;
}

interface WasiatForm {
  fullName: string;
  ic: string;
  date: string;
  estateValue: string;
  currency: string;
  bequests: Bequest[];
  specialWishes: string;
}

interface ValidationErrors {
  fullName?: string;
  estateValue?: string;
}

const initialForm: WasiatForm = {
  fullName: "",
  ic: "",
  date: new Date().toISOString().split("T")[0],
  estateValue: "",
  currency: "MYR",
  bequests: [],
  specialWishes: "",
};

let nextId = 1;
function makeId() {
  return String(nextId++);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WasiatGuide() {
  const { t, locale } = useLocale();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WasiatForm>(initialForm);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const currencySymbol =
    CURRENCIES.find((c) => c.code === form.currency)?.symbol ?? form.currency;

  const parseInput = (val: string) => parseLocaleNumber(val, locale);

  const estateNum = parseInput(form.estateValue);
  const maxBequest = isNaN(estateNum) || estateNum <= 0 ? 0 : estateNum / 3;

  // Compute total bequests in currency units
  const totalBequests = form.bequests.reduce((sum, b) => {
    const amt = parseInput(b.amount);
    if (isNaN(amt) || amt <= 0) return sum;
    if (b.type === "percentage") {
      return sum + (estateNum > 0 ? (amt / 100) * estateNum : 0);
    }
    return sum + amt;
  }, 0);

  const bequestExceeds = maxBequest > 0 && totalBequests > maxBequest;

  function formatAmount(n: number) {
    return `${currencySymbol} ${formatCurrency(n, locale)}`;
  }

  function addBequest() {
    setForm((f) => ({
      ...f,
      bequests: [
        ...f.bequests,
        { id: makeId(), recipient: "", relationship: "", type: "cash", amount: "" },
      ],
    }));
  }

  function removeBequest(id: string) {
    setForm((f) => ({ ...f, bequests: f.bequests.filter((b) => b.id !== id) }));
  }

  function updateBequest(id: string, field: keyof Bequest, value: string) {
    setForm((f) => ({
      ...f,
      bequests: f.bequests.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    }));
  }

  function validateStep2(): boolean {
    const errs: ValidationErrors = {};
    if (!form.fullName.trim()) errs.fullName = t("wasiat.validation.name");
    const est = parseInput(form.estateValue);
    if (!form.estateValue.trim() || isNaN(est) || est <= 0)
      errs.estateValue = t("wasiat.validation.estate");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goToStep(target: number) {
    if (target === 3 && step === 2) {
      if (!validateStep2()) return;
    }
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Step Indicator ──────────────────────────────────────────────────────────

  function StepIndicator() {
    const steps = [
      { num: 1, label: t("wasiat.step1.title") },
      { num: 2, label: t("wasiat.step2.title") },
      { num: 3, label: t("wasiat.step3.title") },
    ];
    return (
      <div className="flex items-center gap-1 sm:gap-2 print:hidden mb-6">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <button
              onClick={() => {
                if (s.num < step || (s.num === 3 && step === 2 && validateStep2())) {
                  setStep(s.num);
                } else if (s.num <= step) {
                  setStep(s.num);
                }
              }}
              className={`flex items-center gap-1.5 min-w-0 group ${
                s.num <= step ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                  step === s.num
                    ? "bg-primary text-primary-foreground"
                    : step > s.num
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block truncate transition-colors ${
                  step === s.num
                    ? "text-foreground"
                    : step > s.num
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 rounded transition-colors ${
                  step > s.num ? "bg-primary/40" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // ── Step 1: Eligibility & Intro ─────────────────────────────────────────────

  function Step1() {
    const eligibility = [
      t("wasiat.eligibility.muslim"),
      t("wasiat.eligibility.sane"),
      t("wasiat.eligibility.adult"),
    ];
    const rules = [
      t("wasiat.rules.onethird"),
      t("wasiat.rules.nolegalheir"),
      t("wasiat.rules.charitable"),
    ];
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {t("wasiat.intro.what")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("wasiat.intro.text")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {t("wasiat.eligibility.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {eligibility.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("wasiat.rules.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rules.map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary font-bold mt-0.5 flex-shrink-0">•</span>
                  {rule}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Button
          onClick={() => goToStep(2)}
          className="w-full gap-2 h-11"
        >
          {t("wasiat.next")}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // ── Step 2: Form ────────────────────────────────────────────────────────────

  function Step2() {
    return (
      <div className="space-y-4">
        {/* Testator Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("wasiat.form.testator.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm">{t("wasiat.form.fullname")}</Label>
              <Input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => {
                  setForm((f) => ({ ...f, fullName: e.target.value }));
                  setErrors((er) => ({ ...er, fullName: undefined }));
                }}
                placeholder={t("wasiat.form.fullname.placeholder")}
                className={errors.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ic" className="text-sm">{t("wasiat.form.ic")}</Label>
              <Input
                id="ic"
                type="text"
                value={form.ic}
                onChange={(e) => setForm((f) => ({ ...f, ic: e.target.value }))}
                placeholder={t("wasiat.form.ic.placeholder")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wasiatDate" className="text-sm">{t("wasiat.form.date")}</Label>
              <Input
                id="wasiatDate"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Estate Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("wasiat.form.estate.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Currency selector */}
            <div className="space-y-1.5">
              <Label className="text-sm">{t("faraid.currency")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setForm((f) => ({ ...f, currency: c.code }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      form.currency === c.code
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    {c.code} <span className="opacity-70">{c.symbol}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="estateValue" className="text-sm">{t("wasiat.form.estateValue")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                  {currencySymbol}
                </span>
                <Input
                  id="estateValue"
                  type="text"
                  inputMode="decimal"
                  value={form.estateValue}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      estateValue: formatInputValue(e.target.value, locale),
                    }));
                    setErrors((er) => ({ ...er, estateValue: undefined }));
                  }}
                  placeholder="0"
                  className={`pl-9 ${errors.estateValue ? "border-destructive" : ""}`}
                />
              </div>
              {errors.estateValue && (
                <p className="text-xs text-destructive">{errors.estateValue}</p>
              )}
              {estateNum > 0 && (
                <p className="text-xs text-muted-foreground">
                  Max 1/3 = {formatAmount(maxBequest)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bequests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("wasiat.form.bequests.title")}</CardTitle>
              {form.bequests.length > 0 && (
                <Badge variant={bequestExceeds ? "destructive" : "secondary"} className="text-xs">
                  {formatAmount(totalBequests)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {bequestExceeds && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{t("wasiat.form.bequests.warning")}</span>
              </div>
            )}

            {form.bequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("wasiat.form.bequests.empty")}
              </p>
            ) : (
              <div className="space-y-4">
                {form.bequests.map((b, idx) => (
                  <div key={b.id} className="rounded-lg border p-3 space-y-2.5 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        #{idx + 1}
                      </span>
                      <button
                        onClick={() => removeBequest(b.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={t("wasiat.form.bequests.remove")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{t("wasiat.form.bequests.recipient")}</Label>
                        <Input
                          type="text"
                          value={b.recipient}
                          onChange={(e) => updateBequest(b.id, "recipient", e.target.value)}
                          placeholder="e.g. Masjid Al-Nuur"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("wasiat.form.bequests.relationship")}</Label>
                        <Input
                          type="text"
                          value={b.relationship}
                          onChange={(e) => updateBequest(b.id, "relationship", e.target.value)}
                          placeholder="e.g. Charity"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{t("wasiat.form.bequests.type")}</Label>
                        <select
                          value={b.type}
                          onChange={(e) =>
                            updateBequest(b.id, "type", e.target.value as Bequest["type"])
                          }
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="cash">{t("wasiat.form.bequests.type.cash")}</option>
                          <option value="asset">{t("wasiat.form.bequests.type.asset")}</option>
                          <option value="percentage">{t("wasiat.form.bequests.type.percentage")}</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("wasiat.form.bequests.amount")}</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                            {b.type === "percentage" ? "%" : currencySymbol}
                          </span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={b.amount}
                            onChange={(e) =>
                              updateBequest(
                                b.id,
                                "amount",
                                b.type === "percentage"
                                  ? e.target.value
                                  : formatInputValue(e.target.value, locale)
                              )
                            }
                            placeholder="0"
                            className="h-8 text-sm pl-7"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              onClick={addBequest}
              className="w-full h-9 text-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t("wasiat.form.bequests.add")}
            </Button>
          </CardContent>
        </Card>

        {/* Special Wishes */}
        <Card>
          <CardContent className="pt-5 space-y-1.5">
            <Label htmlFor="specialWishes" className="text-sm">
              {t("wasiat.form.specialWishes")}
            </Label>
            <textarea
              id="specialWishes"
              value={form.specialWishes}
              onChange={(e) => setForm((f) => ({ ...f, specialWishes: e.target.value }))}
              placeholder={t("wasiat.form.specialWishes.placeholder")}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </CardContent>
        </Card>

        <AdSlot id="wasiat-mid" variant="banner" className="print:hidden" />

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => goToStep(1)} className="gap-2 h-11 flex-1">
            <ArrowLeft className="w-4 h-4" />
            {t("wasiat.back")}
          </Button>
          <Button onClick={() => goToStep(3)} className="gap-2 h-11 flex-1">
            {t("wasiat.next")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 3: Summary & Output ────────────────────────────────────────────────

  function Step3() {
    const lawyerItems = [
      t("wasiat.lawyer.witnesses"),
      t("wasiat.lawyer.solicitor"),
      t("wasiat.lawyer.register"),
      t("wasiat.lawyer.copy"),
    ];

    const bequestFraction =
      estateNum > 0 && totalBequests > 0
        ? ((totalBequests / estateNum) * 100).toFixed(1)
        : null;

    return (
      <div className="space-y-4">
        {/* Summary card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("wasiat.summary.title")}</CardTitle>
              <Badge variant="outline" className="text-xs print:hidden">
                {new Date().getFullYear()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t("wasiat.summary.testator")}</p>
                <p className="font-medium">{form.fullName || "—"}</p>
                {form.ic && <p className="text-xs text-muted-foreground">{form.ic}</p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t("wasiat.summary.date")}</p>
                <p className="font-medium">{form.date || "—"}</p>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("wasiat.summary.estate")}</span>
                <span className="font-mono font-semibold">
                  {estateNum > 0 ? formatAmount(estateNum) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("wasiat.summary.bequests")}</span>
                <span className="font-mono font-semibold text-primary">
                  {totalBequests > 0 ? (
                    <>
                      {formatAmount(totalBequests)}
                      {bequestFraction && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({bequestFraction}%)
                        </span>
                      )}
                    </>
                  ) : (
                    t("wasiat.summary.none")
                  )}
                </span>
              </div>
              {estateNum > 0 && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">{t("wasiat.summary.faraid")}</span>
                  <span className="font-mono font-semibold">
                    {formatAmount(Math.max(0, estateNum - totalBequests))}
                  </span>
                </div>
              )}
            </div>

            {/* Bequests list */}
            {form.bequests.length > 0 && (
              <div className="border-t pt-3 space-y-1.5">
                {form.bequests.map((b, idx) => (
                  <div key={b.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {idx + 1}. {b.recipient || "—"}
                      {b.relationship && ` (${b.relationship})`}
                    </span>
                    <span className="font-mono">
                      {b.type === "percentage"
                        ? `${b.amount}%`
                        : `${currencySymbol} ${b.amount}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Special wishes */}
            {form.specialWishes && (
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-1">
                  {t("wasiat.summary.specialWishes")}
                </p>
                <p className="text-sm whitespace-pre-line">{form.specialWishes}</p>
              </div>
            )}

            {bequestExceeds && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive mt-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {t("wasiat.form.bequests.warning")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lawyer checklist */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              {t("wasiat.lawyer.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {lawyerItems.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <span className="w-5 h-5 rounded-full border-2 border-primary/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-primary/40" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <AdSlot id="wasiat-bottom" variant="rectangle" className="print:hidden" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="gap-2 h-11 flex-1"
          >
            <Printer className="w-4 h-4" />
            {t("wasiat.print")}
          </Button>
          <Button variant="outline" onClick={() => goToStep(2)} className="gap-2 h-11 flex-1">
            <ArrowLeft className="w-4 h-4" />
            {t("wasiat.back")}
          </Button>
        </div>

        <Link href="/faraid" className="print:hidden">
          <Button variant="ghost" className="w-full gap-2 h-10 text-sm text-muted-foreground">
            <Scale className="w-4 h-4" />
            {t("wasiat.backToFaraid")}
          </Button>
        </Link>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-4 print:space-y-3">
      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm print:hidden">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-800 dark:text-amber-200">{t("wasiat.disclaimer")}</p>
      </div>

      {/* Page title */}
      <div className="flex items-center gap-3 print:mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("wasiat.title")}</h1>
        </div>
      </div>

      <StepIndicator />

      <AdSlot id="wasiat-top" variant="banner" className="print:hidden" />

      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
    </div>
  );
}
