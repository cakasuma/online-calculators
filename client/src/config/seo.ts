// Per-route SEO metadata. Imported by the app (for runtime <head> updates)
// and by the build-time prerender script (for static HTML emission).
// Keep this module side-effect-free and free of browser-only globals.

import type { Locale } from "@/lib/i18n";

export const SITE_ORIGIN = "https://hellokalku.com";
export const SITE_NAME = "HelloKalku";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-default.png`;

export type RouteSlug =
  | "home"
  | "salary"
  | "normal"
  | "scientific"
  | "faraid"
  | "zakat"
  | "wasiat"
  | "privacy"
  | "terms";

export interface RouteSeoCopy {
  title: string;
  description: string;
  keywords?: string;
  /** Used as the <h1> when prerendered content is emitted. */
  heading?: string;
  /** One-line tagline shown beside the heading in prerendered HTML. */
  tagline?: string;
}

export interface RouteSeoEntry {
  slug: RouteSlug;
  /** Path WITHOUT the locale prefix, e.g. "/" or "/salary". */
  path: string;
  copy: Record<Locale, RouteSeoCopy>;
  /** Whether this route should be included in sitemap.xml + prerender. */
  prerender: boolean;
  /** Priority/changefreq hints for sitemap.xml. */
  sitemap?: { priority?: number; changefreq?: string };
}

export const routes: RouteSeoEntry[] = [
  {
    slug: "home",
    path: "/",
    prerender: true,
    sitemap: { priority: 1.0, changefreq: "weekly" },
    copy: {
      en: {
        title: "Online Calculators for Malaysia | HelloKalku",
        description:
          "Free Malaysia-focused calculators for salary (EPF, SOCSO, EIS, PCB), zakat, faraid inheritance, and wasiat planning. Fast, accurate, mobile-friendly.",
        keywords:
          "online calculator malaysia, salary calculator, zakat calculator, faraid calculator, epf calculator",
        heading: "Online calculators built for Malaysia",
        tagline: "Salary, tax, zakat, faraid, and planning tools — free and bilingual.",
      },
      id: {
        title: "Kalkulator Online untuk Malaysia | HelloKalku",
        description:
          "Kalkulator gratis fokus Malaysia: gaji (EPF, SOCSO, EIS, PCB), zakat, faraid, dan perencanaan wasiat. Cepat, akurat, dan ramah mobile.",
        keywords:
          "kalkulator online malaysia, kalkulator gaji, kalkulator zakat, kalkulator faraid",
        heading: "Kalkulator online untuk Malaysia",
        tagline: "Gaji, pajak, zakat, faraid, dan perencanaan — gratis dan dwibahasa.",
      },
    },
  },
  {
    slug: "salary",
    path: "/salary",
    prerender: true,
    sitemap: { priority: 0.9, changefreq: "monthly" },
    copy: {
      en: {
        title: "Malaysia Salary Calculator 2026 (EPF, SOCSO, EIS, PCB) | HelloKalku",
        description:
          "Estimate your Malaysia take-home pay with EPF, SOCSO, EIS, and PCB deductions. Supports residents, non-residents, Malaysians, and foreign workers.",
        keywords:
          "malaysia salary calculator, take home pay malaysia, epf calculator, socso calculator, pcb calculator, income tax malaysia",
        heading: "Malaysia salary calculator",
        tagline: "EPF, SOCSO, EIS, and PCB take-home pay estimator.",
      },
      id: {
        title: "Kalkulator Gaji Malaysia 2026 (EPF, SOCSO, EIS, PCB) | HelloKalku",
        description:
          "Hitung gaji bersih Malaysia dengan potongan EPF, SOCSO, EIS, dan PCB. Mendukung penduduk, non-penduduk, dan pekerja asing.",
        heading: "Kalkulator gaji Malaysia",
        tagline: "Estimasi gaji bersih dengan EPF, SOCSO, EIS, dan PCB.",
      },
    },
  },
  {
    slug: "normal",
    path: "/normal",
    prerender: true,
    sitemap: { priority: 0.6, changefreq: "yearly" },
    copy: {
      en: {
        title: "Basic Calculator Online (Free, with History) | HelloKalku",
        description:
          "A fast, free online basic calculator for daily arithmetic. Includes keyboard support, calculation history, and dark mode.",
        heading: "Basic calculator",
        tagline: "Fast arithmetic with history and keyboard support.",
      },
      id: {
        title: "Kalkulator Dasar Online (Gratis, dengan Riwayat) | HelloKalku",
        description:
          "Kalkulator dasar online untuk aritmatika sehari-hari. Mendukung keyboard, riwayat hitung, dan mode gelap.",
        heading: "Kalkulator dasar",
        tagline: "Aritmatika cepat dengan riwayat dan dukungan keyboard.",
      },
    },
  },
  {
    slug: "scientific",
    path: "/scientific",
    prerender: true,
    sitemap: { priority: 0.7, changefreq: "yearly" },
    copy: {
      en: {
        title: "Scientific Calculator Online (Trig, Logs, Powers) | HelloKalku",
        description:
          "Free online scientific calculator with trigonometry, logarithms, exponents, factorials, and mathematical constants.",
        keywords:
          "scientific calculator, trigonometry calculator, log calculator, sin cos tan calculator",
        heading: "Scientific calculator",
        tagline: "Trigonometry, logarithms, powers, and constants in one place.",
      },
      id: {
        title: "Kalkulator Saintifik Online | HelloKalku",
        description:
          "Kalkulator saintifik online dengan trigonometri, logaritma, eksponen, faktorial, dan konstanta matematika.",
        heading: "Kalkulator saintifik",
        tagline: "Trigonometri, logaritma, eksponen, dan konstanta.",
      },
    },
  },
  {
    slug: "faraid",
    path: "/faraid",
    prerender: true,
    sitemap: { priority: 0.9, changefreq: "monthly" },
    copy: {
      en: {
        title: "Faraid Calculator (Islamic Inheritance) Malaysia | HelloKalku",
        description:
          "Calculate Islamic inheritance shares (faraid) for spouse, children, parents, and siblings. Step-by-step distribution with explanations.",
        keywords:
          "faraid calculator, islamic inheritance calculator, faraid malaysia, pengiraan faraid",
        heading: "Faraid calculator",
        tagline: "Islamic inheritance distribution made clear.",
      },
      id: {
        title: "Kalkulator Faraid (Pembagian Waris Islam) | HelloKalku",
        description:
          "Hitung pembagian waris faraid untuk suami/istri, anak, orang tua, dan saudara berdasarkan kaidah Islam.",
        heading: "Kalkulator faraid",
        tagline: "Pembagian waris Islam yang jelas dan sistematis.",
      },
    },
  },
  {
    slug: "zakat",
    path: "/zakat",
    prerender: true,
    sitemap: { priority: 0.9, changefreq: "monthly" },
    copy: {
      en: {
        title: "Zakat Calculator Malaysia (Nisab 2026) | HelloKalku",
        description:
          "Calculate your annual zakat across cash, savings, gold, silver, investments, and business assets. Uses the latest nisab guidance.",
        keywords:
          "zakat calculator, zakat malaysia, zakat harta, nisab calculator, gold silver zakat",
        heading: "Zakat calculator",
        tagline: "Estimate your annual zakat across all asset classes.",
      },
      id: {
        title: "Kalkulator Zakat Malaysia (Nisab 2026) | HelloKalku",
        description:
          "Hitung zakat tahunan untuk tabungan, emas, perak, investasi, dan aset usaha berdasarkan nisab terkini.",
        heading: "Kalkulator zakat",
        tagline: "Estimasi zakat tahunan untuk semua jenis aset.",
      },
    },
  },
  {
    slug: "wasiat",
    path: "/wasiat",
    prerender: true,
    sitemap: { priority: 0.8, changefreq: "yearly" },
    copy: {
      en: {
        title: "Wasiat (Islamic Will) Guide & Checklist Malaysia | HelloKalku",
        description:
          "Plan an Islamic will (wasiat) step-by-step with a printable checklist covering assets, executors, beneficiaries, and Shariah constraints.",
        heading: "Wasiat planning guide",
        tagline: "A practical Islamic will workflow with checklist and action steps.",
      },
      id: {
        title: "Panduan Wasiat Islam & Checklist | HelloKalku",
        description:
          "Susun wasiat Islam langkah demi langkah dengan checklist mencakup aset, wasi, ahli waris, dan ketentuan syariah.",
        heading: "Panduan wasiat",
        tagline: "Alur kerja wasiat Islam dengan checklist dan langkah praktis.",
      },
    },
  },
  {
    slug: "privacy",
    path: "/privacy",
    prerender: true,
    sitemap: { priority: 0.2, changefreq: "yearly" },
    copy: {
      en: {
        title: "Privacy Policy | HelloKalku",
        description:
          "How HelloKalku handles privacy, analytics, lead capture, and advertising data across calculator tools.",
        heading: "Privacy policy",
      },
      id: {
        title: "Kebijakan Privasi | HelloKalku",
        description:
          "Cara HelloKalku menangani privasi, analitik, pengumpulan prospek, dan data iklan.",
        heading: "Kebijakan privasi",
      },
    },
  },
  {
    slug: "terms",
    path: "/terms",
    prerender: true,
    sitemap: { priority: 0.2, changefreq: "yearly" },
    copy: {
      en: {
        title: "Terms of Use | HelloKalku",
        description:
          "HelloKalku terms of use, service scope, disclaimers, and user responsibilities.",
        heading: "Terms of use",
      },
      id: {
        title: "Syarat Penggunaan | HelloKalku",
        description:
          "Syarat penggunaan HelloKalku, cakupan layanan, penafian, dan tanggung jawab pengguna.",
        heading: "Syarat penggunaan",
      },
    },
  },
];

export function findRouteByPath(path: string): RouteSeoEntry | undefined {
  return routes.find((r) => r.path === path);
}

export function findRouteBySlug(slug: RouteSlug): RouteSeoEntry | undefined {
  return routes.find((r) => r.slug === slug);
}

export function canonicalUrl(locale: Locale, path: string): string {
  return `${SITE_ORIGIN}/${locale}${path === "/" ? "" : path}`;
}
