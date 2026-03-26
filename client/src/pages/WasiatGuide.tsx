import { useState, useEffect } from "react";
import { Link } from "wouter";
// @ts-ignore
import jsPDF from "jspdf";
import {
  Printer,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Save,
  X,
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

function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const initialForm: WasiatForm = {
  fullName: "",
  ic: "",
  date: getLocalTodayDateString(),
  estateValue: "",
  currency: "MYR",
  bequests: [],
  specialWishes: "",
};

function makeId() {
  return crypto.randomUUID();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WasiatGuide() {
  const { t, locale } = useLocale();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WasiatForm>(initialForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [savedBanner, setSavedBanner] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("wasiat-plan");
    if (saved) {
      try {
        JSON.parse(saved);
        setSavedBanner(true);
      } catch {
        // ignore invalid saved data
      }
    }
  }, []);

  function handleResumePlan() {
    const saved = localStorage.getItem("wasiat-plan");
    if (saved) {
      try {
        setForm(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    setSavedBanner(false);
  }

  function handleSavePlan() {
    localStorage.setItem("wasiat-plan", JSON.stringify(form));
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  }

  async function handleGeneratePDF() {
    setPdfLoading(true);
    setPdfError(false);
    try {
      generatePDF();
    } catch {
      setPdfError(true);
      setTimeout(() => setPdfError(false), 3000);
    } finally {
      setPdfLoading(false);
    }
  }

  function generatePDF() {
    const sym = CURRENCIES.find((c) => c.code === form.currency)?.symbol ?? form.currency;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 22;
    const contentW = pageW - margin * 2;
    let y = 18;

    // ── Outer border ──────────────────────────────────────────────────────────
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.8);
    doc.rect(12, 12, pageW - 24, pageH - 24);
    doc.setLineWidth(0.3);
    doc.rect(14, 14, pageW - 28, pageH - 28);

    // ── Header block ──────────────────────────────────────────────────────────
    y = 24;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    doc.text("In the name of Allah, the Most Gracious, the Most Merciful", pageW / 2, y, { align: "center" });
    y += 7;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text("WASIAT", pageW / 2, y, { align: "center" });
    y += 6;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text("ISLAMIC WILL & BEQUEST DECLARATION", pageW / 2, y, { align: "center" });
    y += 4;

    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y);
    y += 2;
    doc.setLineWidth(1.2);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    // ── Preamble ──────────────────────────────────────────────────────────────
    const formattedDate = form.date
      ? new Date(form.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "___________________________";
    const preamble =
      `I, ${form.fullName || "___________________________"}, bearing Identity Card / Passport No. ` +
      `${form.ic || "___________________________"}, being of sound mind and memory, hereby declare ` +
      `this to be my Wasiat (Islamic Testament) made on ${formattedDate}.`;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const preambleLines = doc.splitTextToSize(preamble, contentW);
    doc.text(preambleLines, margin, y);
    y += preambleLines.length * 5.5 + 5;

    // ── Section helper ────────────────────────────────────────────────────────
    function sectionHeader(title: string) {
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.rect(margin, y - 4, contentW, 7, "FD");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(title, margin + 2, y + 0.5);
      y += 8;
    }

    // ── Testator Details ─────────────────────────────────────────────────────
    sectionHeader("1.  TESTATOR DETAILS");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);

    function labeledField(label: string, value: string, xOff = 0) {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin + xOff, y);
      doc.setFont("helvetica", "normal");
      doc.text(value || "—", margin + xOff + 40, y);
      y += 5.5;
    }
    labeledField("Full Name", form.fullName);
    labeledField("IC / Passport No.", form.ic);
    labeledField("Date of Wasiat", formattedDate);
    labeledField("Estimated Estate Value", `${sym} ${form.estateValue || "0"}`);
    y += 3;

    // ── Bequests ──────────────────────────────────────────────────────────────
    sectionHeader("2.  BEQUEST DETAILS (MAX 1/3 OF ESTATE)");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    if (form.bequests.length === 0) {
      doc.text("No bequests have been specified.", margin + 2, y);
      y += 5.5;
    } else {
      form.bequests.forEach((b, i) => {
        const amtStr = b.type === "percentage" ? `${b.amount}%` : `${sym} ${b.amount}`;
        const typeLabel = b.type.charAt(0).toUpperCase() + b.type.slice(1);
        const line = `${i + 1}.  Recipient: ${b.recipient || "—"}${b.relationship ? `  (${b.relationship})` : ""}   |   ${typeLabel}: ${amtStr}`;
        const lines = doc.splitTextToSize(line, contentW - 4);
        doc.text(lines, margin + 2, y);
        y += lines.length * 5.5;
      });
    }
    y += 3;

    // ── Special Wishes ────────────────────────────────────────────────────────
    sectionHeader("3.  SPECIAL WISHES / INSTRUCTIONS");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    if (form.specialWishes) {
      const wishLines = doc.splitTextToSize(form.specialWishes, contentW - 4);
      doc.text(wishLines, margin + 2, y);
      y += wishLines.length * 5.5;
    } else {
      doc.text("None specified.", margin + 2, y);
      y += 5.5;
    }
    y += 5;

    // ── Check if we need a new page for signatures ─────────────────────────
    const sigBlockHeight = 90;
    if (y + sigBlockHeight > pageH - 20) {
      doc.addPage();
      doc.setDrawColor(60, 60, 60);
      doc.setLineWidth(0.8);
      doc.rect(12, 12, pageW - 24, pageH - 24);
      doc.setLineWidth(0.3);
      doc.rect(14, 14, pageW - 28, pageH - 28);
      y = 24;
    }

    // ── Signature section header ───────────────────────────────────────────
    sectionHeader("4.  DECLARATION & SIGNATURES");
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(60, 60, 60);
    const declText =
      "This Wasiat is hereby declared voluntarily and without duress. " +
      "To be legally binding, it must be signed before at least two (2) adult Muslim witnesses " +
      "and, where required, in the presence of a licensed solicitor or commissioner for oaths.";
    const declLines = doc.splitTextToSize(declText, contentW);
    doc.text(declLines, margin, y);
    y += declLines.length * 5 + 6;

    // ── Signature block helper ─────────────────────────────────────────────
    function sigBlock(title: string, xStart: number, width: number, yStart: number): number {
      let sy = yStart;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(title, xStart, sy);
      sy += 5;

      const lineX2 = xStart + width - 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);

      // Signature area box
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.3);
      doc.rect(xStart, sy, width - 4, 22);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text("Signature", xStart + 2, sy + 20);
      sy += 25;

      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "normal");

      doc.text("Name:", xStart, sy);
      doc.setDrawColor(140, 140, 140);
      doc.setLineWidth(0.3);
      doc.line(xStart + 10, sy + 0.5, lineX2, sy + 0.5);
      sy += 5.5;

      doc.text("IC / Passport:", xStart, sy);
      doc.line(xStart + 21, sy + 0.5, lineX2, sy + 0.5);
      sy += 5.5;

      doc.text("Date:", xStart, sy);
      doc.line(xStart + 9, sy + 0.5, lineX2, sy + 0.5);
      sy += 5.5;

      return sy;
    }

    // Testator occupies full width
    const testatorBottom = sigBlock("TESTATOR  (Maker of Wasiat)", margin, contentW, y);
    y = testatorBottom + 6;

    // Two witnesses side by side
    const halfW = (contentW - 6) / 2;
    const w1y = sigBlock("WITNESS 1", margin, halfW, y);
    const w2y = sigBlock("WITNESS 2", margin + halfW + 6, halfW, y);
    y = Math.max(w1y, w2y) + 6;

    // ── Solicitor / Commissioner for Oaths ──────────────────────────────────
    if (y + 40 > pageH - 20) {
      doc.addPage();
      doc.setDrawColor(60, 60, 60);
      doc.setLineWidth(0.8);
      doc.rect(12, 12, pageW - 24, pageH - 24);
      doc.setLineWidth(0.3);
      doc.rect(14, 14, pageW - 28, pageH - 28);
      y = 24;
    }
    sigBlock("SOLICITOR / COMMISSIONER FOR OATHS  (if applicable)", margin, contentW, y);

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = pageH - 16;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 3, pageW - margin, footerY - 3);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text(
      "This document is a planning tool only. Consult a qualified solicitor to create a legally binding Islamic will.",
      pageW / 2,
      footerY,
      { align: "center" }
    );

    const filename = `wasiat-${form.fullName.replace(/\s+/g, "-") || "plan"}.pdf`;
    doc.save(filename);
  }

  function handlePrint() {
    setPrintLoading(true);
    setTimeout(() => {
      window.print();
      setPrintLoading(false);
    }, 300);
  }

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
      <div className="flex justify-center items-center print:hidden mb-6">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (s.num < step || (s.num === 3 && step === 2 && validateStep2())) {
                  setStep(s.num);
                } else if (s.num <= step) {
                  setStep(s.num);
                }
              }}
              className={`flex items-center gap-1.5 group ${
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
                className={`text-xs font-medium hidden sm:block transition-colors ${
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
                className={`w-8 sm:w-14 h-0.5 mx-2 rounded flex-shrink-0 transition-colors ${
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
              <Label className="text-sm">{t("wasiat.form.date")}</Label>
              {(() => {
                const [yyyy, mm, dd] = (form.date || getLocalTodayDateString()).split("-");
                const selectClass =
                  "flex-1 min-w-0 h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";
                function updateDatePart(part: "yyyy" | "mm" | "dd", val: string) {
                  const parts = { yyyy, mm, dd, [part]: val };
                  setForm((f) => ({ ...f, date: `${parts.yyyy}-${parts.mm}-${parts.dd}` }));
                }
                const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
                const months = [
                  ["01", "January"], ["02", "February"], ["03", "March"], ["04", "April"],
                  ["05", "May"], ["06", "June"], ["07", "July"], ["08", "August"],
                  ["09", "September"], ["10", "October"], ["11", "November"], ["12", "December"],
                ];
                const currentYear = new Date().getFullYear();
                const years = Array.from({ length: 21 }, (_, i) => String(currentYear - 5 + i));
                return (
                  <div className="flex gap-1.5 w-full">
                    <select value={dd} onChange={(e) => updateDatePart("dd", e.target.value)} className={selectClass} aria-label="Day">
                      {days.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={mm} onChange={(e) => updateDatePart("mm", e.target.value)} className={`${selectClass} flex-[2]`} aria-label="Month">
                      {months.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                    <select value={yyyy} onChange={(e) => updateDatePart("yyyy", e.target.value)} className={`${selectClass} flex-[1.5]`} aria-label="Year">
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                );
              })()}
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
                    type="button"
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
                        type="button"
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
                          onChange={(e) => {
                            const newType = e.target.value as Bequest["type"];
                            updateBequest(b.id, "type", newType);
                            // Clear amount when type changes to avoid misinterpreting formatted values
                            updateBequest(b.id, "amount", "");
                          }}
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
          <Button variant="outline" onClick={handleSavePlan} className="gap-2 h-11 relative">
            <Save className="w-4 h-4" />
            {saveToast ? (
              <span className="text-emerald-600 font-medium">Saved!</span>
            ) : (
              "Save Plan"
            )}
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
                <p className="font-medium">
                  {form.date
                    ? new Date(form.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                    : "—"}
                </p>
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
        {pdfError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive print:hidden">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Failed to generate PDF. Please try again.
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
          <Button
            onClick={handleGeneratePDF}
            disabled={pdfLoading}
            className="gap-2 h-11 flex-1"
          >
            <Download className="w-4 h-4" />
            {pdfLoading ? "Generating..." : "Download PDF"}
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={printLoading}
            className="gap-2 h-11 flex-1"
          >
            <Printer className="w-4 h-4" />
            {printLoading ? "Preparing..." : "Print"}
          </Button>
          <Button variant="outline" onClick={() => goToStep(2)} className="gap-2 h-11 flex-1">
            <ArrowLeft className="w-4 h-4" />
            {t("wasiat.back")}
          </Button>
        </div>

        <Link href="/faraid" className="print:hidden">
          <Button variant="ghost" className="w-full gap-2 h-10 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            {t("wasiat.backToFaraid")}
          </Button>
        </Link>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-4 print:space-y-3">
      {/* Resume saved plan banner */}
      {savedBanner && (
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm print:hidden">
          <span className="text-foreground font-medium">You have a saved plan.</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleResumePlan} className="h-7 text-xs gap-1">
              Resume saved plan
            </Button>
            <button
              type="button"
              onClick={() => setSavedBanner(false)}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

      {StepIndicator()}

      <AdSlot id="wasiat-top" variant="banner" className="print:hidden" />

      {step === 1 && Step1()}
      {step === 2 && Step2()}
      {step === 3 && Step3()}
    </div>
  );
}
