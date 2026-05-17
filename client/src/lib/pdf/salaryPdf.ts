import type { Locale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/i18n";
import {
  BRAND,
  PAGE,
  drawFooter,
  drawHeader,
  drawSectionHeading,
  drawStatRow,
  pdfFilename,
} from "./pdfChrome";

export interface SalaryPdfData {
  inputs: {
    monthlySalary: number;
    annualBonus: number;
    otherRelief: number;
    epfRate: number;
    workerType: "malaysian" | "foreigner";
    residentStatus: "resident" | "non-resident";
  };
  result: {
    monthlyNet: number;
    monthlyEpf: number;
    monthlyTax: number;
    monthlySocso: number;
    monthlyEis: number;
    monthlyDeductions: number;
    annualGross: number;
    annualEpf: number;
    annualSocso: number;
    annualEis: number;
    chargeableIncome: number;
    annualIncomeTax: number;
  };
  locale: Locale;
  shareUrl?: string;
}

export async function downloadSalaryPdf(data: SalaryPdfData) {
  // Dynamic import keeps jsPDF + autotable out of the main bundle.
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const { inputs, result, locale } = data;
  const money = (n: number) => `RM ${formatCurrency(n, locale)}`;

  let y = drawHeader(doc, {
    title: "Salary breakdown",
    subtitle: `${inputs.residentStatus === "resident" ? "Malaysian tax resident" : "Non-resident"} · ${inputs.workerType === "malaysian" ? "Malaysian worker" : "Foreign worker / expat"} · EPF ${inputs.epfRate}%`,
    accent: "#10B981",
  });

  y = drawSectionHeading(doc, y, "Monthly take-home");
  y = drawStatRow(
    doc,
    y,
    "Net pay (after EPF, SOCSO, EIS, PCB)",
    money(result.monthlyNet),
    `${money(inputs.monthlySalary)} gross − ${money(result.monthlyDeductions)} deductions`,
  );

  y += 6;
  y = drawSectionHeading(doc, y, "Monthly deductions");
  autoTable(doc, {
    startY: y,
    head: [["Item", "Amount", "% of gross"]],
    body: [
      [
        "EPF (employee)",
        money(result.monthlyEpf),
        `${((result.monthlyEpf / inputs.monthlySalary) * 100).toFixed(2)}%`,
      ],
      [
        "PCB (income tax)",
        money(result.monthlyTax),
        `${((result.monthlyTax / inputs.monthlySalary) * 100).toFixed(2)}%`,
      ],
      [
        "SOCSO",
        money(result.monthlySocso),
        `${((result.monthlySocso / inputs.monthlySalary) * 100).toFixed(2)}%`,
      ],
      [
        "EIS",
        money(result.monthlyEis),
        `${((result.monthlyEis / inputs.monthlySalary) * 100).toFixed(2)}%`,
      ],
      [
        { content: "Total deductions", styles: { fontStyle: "bold" } },
        { content: money(result.monthlyDeductions), styles: { fontStyle: "bold" } },
        {
          content: `${((result.monthlyDeductions / inputs.monthlySalary) * 100).toFixed(2)}%`,
          styles: { fontStyle: "bold" },
        },
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: BRAND.text, textColor: "#FFFFFF" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    margin: { left: PAGE.marginX, right: PAGE.marginX },
  });
  // @ts-expect-error autotable extends doc with lastAutoTable at runtime
  y = (doc.lastAutoTable?.finalY ?? y) + 22;

  y = drawSectionHeading(doc, y, "Annual summary");
  y = drawStatRow(
    doc,
    y,
    "Annual gross income",
    money(result.annualGross),
    `${money(inputs.monthlySalary)} × 12${inputs.annualBonus ? ` + ${money(inputs.annualBonus)} bonus` : ""}`,
  );
  y = drawStatRow(doc, y, "Chargeable income (after reliefs)", money(result.chargeableIncome));
  y = drawStatRow(
    doc,
    y,
    "Annual income tax",
    money(result.annualIncomeTax),
    `Effective rate ${((result.annualIncomeTax / result.annualGross) * 100).toFixed(2)}%`,
  );
  y = drawStatRow(doc, y, "Annual EPF contribution", money(result.annualEpf));
  y = drawStatRow(doc, y, "Annual SOCSO + EIS", money(result.annualSocso + result.annualEis));

  drawFooter(doc, data.shareUrl);
  doc.save(pdfFilename("salary"));
}
