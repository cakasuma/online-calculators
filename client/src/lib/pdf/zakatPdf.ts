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

export interface ZakatPdfData {
  currency: string;
  currencySymbol: string;
  nisab: number;
  total: number;
  zakatDue: number;
  breakdown: Array<{ label: string; amount: number }>;
  locale: Locale;
  shareUrl?: string;
}

export async function downloadZakatPdf(data: ZakatPdfData) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const sym = data.currencySymbol;
  const money = (n: number) => `${sym} ${formatCurrency(n, data.locale)}`;

  let y = drawHeader(doc, {
    title: "Zakat calculation",
    subtitle: `Currency: ${data.currency} · Nisab: ${money(data.nisab)}`,
    accent: "#F59E0B",
  });

  y = drawSectionHeading(doc, y, "Summary");
  y = drawStatRow(doc, y, "Total zakatable wealth", money(data.total));
  y = drawStatRow(doc, y, "Nisab threshold", money(data.nisab));
  y = drawStatRow(
    doc,
    y,
    data.zakatDue > 0 ? "Zakat due (2.5%)" : "Below nisab — no zakat due",
    money(data.zakatDue),
    data.zakatDue > 0
      ? `${money(data.total)} × 2.5%`
      : `Net wealth falls below the ${money(data.nisab)} threshold this hawl`,
  );

  y += 6;
  if (data.breakdown.length > 0) {
    y = drawSectionHeading(doc, y, "Asset breakdown");
    autoTable(doc, {
      startY: y,
      head: [["Asset class", "Zakatable amount"]],
      body: data.breakdown
        .filter((b) => b.amount > 0)
        .map((b) => [b.label, money(b.amount)]),
      foot: [
        [
          { content: "Total", styles: { fontStyle: "bold" } },
          { content: money(data.total), styles: { fontStyle: "bold" } },
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: BRAND.text, textColor: "#FFFFFF" },
      footStyles: { fillColor: "#F1F5F9", textColor: BRAND.text },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: PAGE.marginX, right: PAGE.marginX },
    });
  }

  drawFooter(doc, data.shareUrl);
  doc.save(pdfFilename("zakat"));
}
