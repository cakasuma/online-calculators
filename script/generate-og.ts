// OG (Open Graph) image generator — runs at build time after prerender.ts.
// For every route × locale we emit a 1200×630 PNG to dist/public/og/<locale>/<slug>.png
// plus a default fallback at dist/public/og-default.png. The image is hand-crafted
// SVG (no satori dependency / no font shipping) and rendered to PNG via @resvg/resvg-js.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { routes, SITE_ORIGIN, SITE_NAME, type RouteSeoEntry } from "../client/src/config/seo";
import type { Locale } from "../client/src/lib/i18n";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "dist/public/og");

const LOCALES: Locale[] = ["en", "ms", "id"];

// Per-slug accent colour + emoji-glyph (rendered as SVG text). We avoid emoji fonts
// (Resvg's default emoji rendering is brittle) and use simple coloured shapes.
const SLUG_STYLE: Record<string, { accent: string; tagShort: string; tagLong: Record<Locale, string> }> = {
  home: {
    accent: "#0EA5E9",
    tagShort: "HOME",
    tagLong: { en: "All calculators", ms: "Semua kalkulator", id: "Semua kalkulator" },
  },
  salary: {
    accent: "#10B981",
    tagShort: "FINANCE",
    tagLong: { en: "Salary & tax", ms: "Gaji & cukai", id: "Gaji & pajak" },
  },
  zakat: {
    accent: "#F59E0B",
    tagShort: "ZAKAT",
    tagLong: { en: "Wealth zakat", ms: "Zakat harta", id: "Zakat harta" },
  },
  faraid: {
    accent: "#8B5CF6",
    tagShort: "FARAID",
    tagLong: { en: "Islamic inheritance", ms: "Faraid Islam", id: "Waris Islam" },
  },
  wasiat: {
    accent: "#EC4899",
    tagShort: "WASIAT",
    tagLong: { en: "Islamic will", ms: "Wasiat Islam", id: "Wasiat Islam" },
  },
  normal: {
    accent: "#64748B",
    tagShort: "BASIC",
    tagLong: { en: "Basic calculator", ms: "Kalkulator asas", id: "Kalkulator dasar" },
  },
  scientific: {
    accent: "#EF4444",
    tagShort: "SCI",
    tagLong: { en: "Scientific calculator", ms: "Kalkulator saintifik", id: "Kalkulator saintifik" },
  },
  privacy: {
    accent: "#64748B",
    tagShort: "POLICY",
    tagLong: { en: "Privacy policy", ms: "Dasar privasi", id: "Kebijakan privasi" },
  },
  terms: {
    accent: "#64748B",
    tagShort: "TERMS",
    tagLong: { en: "Terms of use", ms: "Syarat penggunaan", id: "Syarat penggunaan" },
  },
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Wrap a long heading onto multiple lines for SVG <text> rendering.
// Approximate character widths for the heading font size.
function wrapHeading(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = w;
    }
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  // Truncate last line with ellipsis if we overran
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[lines.length - 1];
    if (last.length > maxChars - 1) {
      lines[lines.length - 1] = last.slice(0, maxChars - 1) + "…";
    } else {
      lines[lines.length - 1] = last + "…";
    }
  }
  return lines;
}

function buildSvg(opts: {
  heading: string;
  tagline: string;
  badge: string;
  badgeLong: string;
  accent: string;
}): string {
  const { heading, tagline, badge, badgeLong, accent } = opts;
  const headingLines = wrapHeading(heading, 28, 3);
  const taglineLines = wrapHeading(tagline, 56, 2);

  const headingY = 220;
  const lineH = 80;
  const taglineY = headingY + headingLines.length * lineH + 40;
  const taglineH = 38;

  const headingSpans = headingLines
    .map(
      (line, i) =>
        `<text x="80" y="${headingY + i * lineH}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="72" font-weight="800" fill="#0F172A">${escapeXml(line)}</text>`,
    )
    .join("\n  ");

  const taglineSpans = taglineLines
    .map(
      (line, i) =>
        `<text x="80" y="${taglineY + i * taglineH}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="30" font-weight="400" fill="#475569">${escapeXml(line)}</text>`,
    )
    .join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>
    <linearGradient id="accentBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.6" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="0" y="0" width="1200" height="12" fill="url(#accentBar)" />
  <circle cx="1080" cy="80" r="40" fill="${accent}" fill-opacity="0.12" />
  <circle cx="1100" cy="100" r="25" fill="${accent}" fill-opacity="0.18" />

  <!-- Brand chip -->
  <g transform="translate(80, 80)">
    <rect width="200" height="48" rx="12" fill="#0F172A" />
    <text x="100" y="32" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF">${escapeXml(SITE_NAME)}</text>
  </g>

  <!-- Category badge -->
  <g transform="translate(300, 80)">
    <rect width="${Math.max(80, badge.length * 18 + 32)}" height="48" rx="12" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-opacity="0.4" stroke-width="2" />
    <text x="${Math.max(40, (badge.length * 18 + 32) / 2)}" y="32" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="20" font-weight="700" fill="${accent}">${escapeXml(badge)}</text>
  </g>

  <!-- Heading -->
  ${headingSpans}

  <!-- Tagline -->
  ${taglineSpans}

  <!-- Footer ribbon -->
  <rect x="0" y="570" width="1200" height="60" fill="#0F172A" />
  <text x="80" y="608" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="22" font-weight="500" fill="#94A3B8">${escapeXml(SITE_ORIGIN.replace(/^https?:\/\//, ""))}</text>
  <text x="1120" y="608" text-anchor="end" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="22" font-weight="600" fill="#F1F5F9">${escapeXml(badgeLong)}</text>
</svg>`;
}

function renderPng(svg: string): Buffer {
  const r = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    background: "#ffffff",
  });
  return r.render().asPng();
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function generateForRoute(route: RouteSeoEntry, locale: Locale) {
  const copy = route.copy[locale] ?? route.copy.en;
  const style = SLUG_STYLE[route.slug] ?? SLUG_STYLE.home;
  const heading = copy.heading ?? copy.title;
  const tagline = copy.tagline ?? copy.description;

  const svg = buildSvg({
    heading,
    tagline,
    badge: style.tagShort,
    badgeLong: style.tagLong[locale],
    accent: style.accent,
  });

  const outDir = path.join(OUT_DIR, locale);
  ensureDir(outDir);
  const outPath = path.join(outDir, `${route.slug}.png`);
  fs.writeFileSync(outPath, renderPng(svg));
  return outPath;
}

function generateDefault() {
  const svg = buildSvg({
    heading: "Online calculators for Malaysia",
    tagline: "Salary, tax, zakat, faraid, and planning tools — free, fast, bilingual.",
    badge: "HELLOKALKU",
    badgeLong: "hellokalku.com",
    accent: "#0EA5E9",
  });
  const outPath = path.resolve(ROOT, "dist/public/og-default.png");
  fs.writeFileSync(outPath, renderPng(svg));
  return outPath;
}

ensureDir(OUT_DIR);

let count = 0;
for (const route of routes) {
  for (const locale of LOCALES) {
    generateForRoute(route, locale);
    count++;
  }
}
generateDefault();
console.log(`[generate-og] wrote ${count} per-route OG images + og-default.png`);
