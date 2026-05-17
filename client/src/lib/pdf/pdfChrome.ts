// Lightweight PDF generation helpers. Calculator-specific generators live in
// pdf/<calculator>Pdf.ts and re-use this module's header/footer chrome so the
// brand voice is consistent across exports.
//
// jsPDF is dynamically imported by callers (see pdf/index.ts) so the ~90KB
// payload only loads when the user actually clicks Download PDF.

import type jsPDF from "jspdf";

export const PAGE = {
  width: 595, // A4 portrait at 72dpi (jsPDF default unit "pt")
  height: 842,
  marginX: 48,
  marginTop: 56,
  marginBottom: 56,
};

export const BRAND = {
  name: "HelloKalku",
  domain: "hellokalku.com",
  primary: "#0EA5E9",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
};

export interface PdfHeaderOpts {
  /** Page title shown beside the brand chip. */
  title: string;
  /** Optional subtitle / tagline below the title. */
  subtitle?: string;
  /** Optional accent colour for the top bar. Defaults to BRAND.primary. */
  accent?: string;
}

/** Draw the standard header on the current page and return the Y position
 *  where body content can start. */
export function drawHeader(doc: jsPDF, opts: PdfHeaderOpts): number {
  const accent = opts.accent ?? BRAND.primary;

  // Top accent bar
  doc.setFillColor(accent);
  doc.rect(0, 0, PAGE.width, 6, "F");

  // Brand chip
  doc.setFillColor(BRAND.text);
  doc.roundedRect(PAGE.marginX, PAGE.marginTop - 16, 110, 26, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor("#FFFFFF");
  doc.text(BRAND.name, PAGE.marginX + 55, PAGE.marginTop + 1, { align: "center" });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(BRAND.text);
  doc.text(opts.title, PAGE.marginX, PAGE.marginTop + 44);

  let y = PAGE.marginTop + 44;
  if (opts.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(BRAND.muted);
    doc.text(opts.subtitle, PAGE.marginX, y + 18);
    y += 18;
  }
  return y + 24;
}

/** Draw a thin footer with brand + page number + generated-on timestamp. */
export function drawFooter(doc: jsPDF, shareUrl?: string) {
  const totalPages = doc.getNumberOfPages();
  const generatedLabel = `Generated ${new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} · ${BRAND.domain}`;

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(BRAND.border);
    doc.setLineWidth(0.5);
    doc.line(
      PAGE.marginX,
      PAGE.height - PAGE.marginBottom + 16,
      PAGE.width - PAGE.marginX,
      PAGE.height - PAGE.marginBottom + 16,
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(BRAND.muted);
    doc.text(generatedLabel, PAGE.marginX, PAGE.height - PAGE.marginBottom + 30);
    doc.text(
      `Page ${p} / ${totalPages}`,
      PAGE.width - PAGE.marginX,
      PAGE.height - PAGE.marginBottom + 30,
      { align: "right" },
    );

    if (shareUrl && p === totalPages) {
      doc.setTextColor(BRAND.muted);
      const lines = doc.splitTextToSize(`Share link: ${shareUrl}`, PAGE.width - 2 * PAGE.marginX);
      doc.text(lines, PAGE.marginX, PAGE.height - PAGE.marginBottom + 44);
    }
  }
}

/** Draw a labelled stat card row. Returns the next Y. */
export function drawStatRow(
  doc: jsPDF,
  y: number,
  label: string,
  value: string,
  helper?: string,
): number {
  const rowHeight = helper ? 36 : 26;
  doc.setDrawColor(BRAND.border);
  doc.setFillColor("#F8FAFC");
  doc.roundedRect(PAGE.marginX, y, PAGE.width - 2 * PAGE.marginX, rowHeight, 4, 4, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.muted);
  doc.text(label, PAGE.marginX + 12, y + 17);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(BRAND.text);
  doc.text(value, PAGE.width - PAGE.marginX - 12, y + 17, { align: "right" });

  if (helper) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(BRAND.muted);
    doc.text(helper, PAGE.marginX + 12, y + 30);
  }

  return y + rowHeight + 6;
}

export function drawSectionHeading(doc: jsPDF, y: number, text: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(BRAND.text);
  doc.text(text, PAGE.marginX, y);
  return y + 16;
}

/** Build a sane PDF filename from the calculator slug + ISO date. */
export function pdfFilename(calculator: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `hellokalku-${calculator}-${stamp}.pdf`;
}
