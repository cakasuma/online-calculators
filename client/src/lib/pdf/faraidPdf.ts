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

export interface FaraidPdfHeir {
  name: string;
  share: string;
  amount: number;
  percentage: number;
  type: string;
}

export interface FaraidPdfData {
  currency: string;
  currencySymbol: string;
  estateValue: number;
  debtsAndExpenses: number;
  wasiyyah: number;
  netEstate: number;
  heirs: FaraidPdfHeir[];
  blockedHeirs: Array<{ name: string; blockedBy: string }>;
  hasAwl: boolean;
  awlFactor: number;
  undistributed: number;
  locale: Locale;
  shareUrl?: string;
}

export async function downloadFaraidPdf(data: FaraidPdfData) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const sym = data.currencySymbol;
  const money = (n: number) => `${sym} ${formatCurrency(n, data.locale)}`;

  let y = drawHeader(doc, {
    title: "Faraid distribution",
    subtitle: `Currency: ${data.currency} · ${data.heirs.length} heir${data.heirs.length === 1 ? "" : "s"}`,
    accent: "#8B5CF6",
  });

  y = drawSectionHeading(doc, y, "Estate summary");
  y = drawStatRow(doc, y, "Gross estate", money(data.estateValue));
  if (data.debtsAndExpenses > 0)
    y = drawStatRow(doc, y, "Less: debts & funeral expenses", `− ${money(data.debtsAndExpenses)}`);
  if (data.wasiyyah > 0)
    y = drawStatRow(doc, y, "Less: wasiyyah (capped at 1/3)", `− ${money(data.wasiyyah)}`);
  y = drawStatRow(doc, y, "Net distributable estate", money(data.netEstate));

  if (data.hasAwl) {
    y = drawStatRow(
      doc,
      y,
      "Awl adjustment applied",
      `× ${data.awlFactor.toFixed(4)}`,
      "Fixed shares exceeded 1; each share reduced proportionally.",
    );
  }

  y += 6;
  y = drawSectionHeading(doc, y, "Distribution by heir");
  autoTable(doc, {
    startY: y,
    head: [["Heir", "Share", "Type", "%", "Amount"]],
    body: data.heirs.map((h) => [
      h.name,
      h.share,
      h.type,
      `${h.percentage.toFixed(2)}%`,
      money(h.amount),
    ]),
    foot: [
      [
        { content: "Total distributed", colSpan: 4, styles: { fontStyle: "bold" } },
        {
          content: money(data.netEstate - data.undistributed),
          styles: { fontStyle: "bold", halign: "right" },
        },
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: BRAND.text, textColor: "#FFFFFF" },
    footStyles: { fillColor: "#F1F5F9", textColor: BRAND.text },
    columnStyles: { 3: { halign: "right" }, 4: { halign: "right" } },
    margin: { left: PAGE.marginX, right: PAGE.marginX },
  });
  // @ts-expect-error autotable extends doc at runtime
  y = (doc.lastAutoTable?.finalY ?? y) + 22;

  if (data.undistributed > 0) {
    y = drawStatRow(
      doc,
      y,
      "Undistributed (Baitulmal)",
      money(data.undistributed),
      "No residuary heirs remain to take the surplus.",
    );
  }

  if (data.blockedHeirs.length > 0) {
    y += 6;
    y = drawSectionHeading(doc, y, "Blocked heirs (Hajb)");
    autoTable(doc, {
      startY: y,
      head: [["Heir", "Blocked by"]],
      body: data.blockedHeirs.map((b) => [b.name, b.blockedBy]),
      theme: "plain",
      headStyles: { fontStyle: "bold", textColor: BRAND.muted, fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: BRAND.muted },
      margin: { left: PAGE.marginX, right: PAGE.marginX },
    });
  }

  drawFooter(doc, data.shareUrl);
  doc.save(pdfFilename("faraid"));
}
