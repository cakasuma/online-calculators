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
  | "epf"
  | "housing"
  | "tax"
  | "bmi"
  | "normal"
  | "scientific"
  | "faraid"
  | "zakat"
  | "wasiat"
  | "blog"
  | "partners"
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
          "Free Malaysia-focused calculators for salary (EPF, SOCSO, EIS, PCB), zakat, faraid inheritance, and wasiat planning. Fast, private, mobile-friendly.",
        keywords:
          "online calculator malaysia, salary calculator, zakat calculator, faraid calculator, epf calculator",
        heading: "Online calculators built for Malaysia",
        tagline: "Salary, tax, zakat, faraid, and planning tools — free and bilingual.",
      },
      
      ms: {
        title: "Kalkulator Online untuk Malaysia | HelloKalku",
        description:
          "Kalkulator percuma fokus Malaysia: gaji (EPF, SOCSO, EIS, PCB), zakat, faraid, dan perancangan wasiat. Pantas, tepat, dan mesra mudah alih.",
        keywords:
          "kalkulator online malaysia, kalkulator gaji, kalkulator zakat, kalkulator faraid",
        heading: "Kalkulator online untuk Malaysia",
        tagline: "Gaji, cukai, zakat, faraid, dan perancangan — percuma dan dwibahasa.",
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
      
      ms: {
        title: "Kalkulator Gaji Malaysia 2026 (EPF, SOCSO, EIS, PCB) | HelloKalku",
        description:
          "Kira gaji bersih Malaysia dengan potongan EPF, SOCSO, EIS, dan PCB. Menyokong pemastautin, non-pemastautin, dan pekerja asing.",
        heading: "Kalkulator gaji Malaysia",
        tagline: "Anggaran gaji bersih dengan EPF, SOCSO, EIS, dan PCB.",
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
    slug: "epf",
    path: "/epf-retirement",
    prerender: true,
    sitemap: { priority: 0.85, changefreq: "monthly" },
    copy: {
      en: {
        title: "EPF Retirement Calculator Malaysia 2026 (KWSP Basic Savings) | HelloKalku",
        description:
          "Project your KWSP balance at retirement age. Compares against the 2026 EPF Basic Savings target (RM 270k @ 55, RM 390k @ 60) and estimates your monthly retirement income.",
        keywords:
          "epf calculator malaysia, kwsp retirement calculator, basic savings target, ria retirement calculator, epf projection",
        heading: "EPF retirement projection",
        tagline: "Project your KWSP balance and compare against the Basic Savings target.",
      },
      ms: {
        title: "Kalkulator Persaraan EPF Malaysia 2026 (Simpanan Asas KWSP) | HelloKalku",
        description:
          "Unjurkan baki KWSP anda pada umur persaraan. Bandingkan dengan sasaran Simpanan Asas EPF 2026 (RM 270k @ 55, RM 390k @ 60) dan anggarkan pendapatan persaraan bulanan anda.",
        heading: "Unjuran persaraan EPF",
        tagline: "Unjurkan baki KWSP dan bandingkan dengan sasaran Simpanan Asas.",
      },
      id: {
        title: "Kalkulator Pensiun EPF Malaysia 2026 (Simpanan Asas KWSP) | HelloKalku",
        description:
          "Proyeksikan saldo KWSP Anda pada usia pensiun. Bandingkan dengan target Basic Savings EPF 2026 (RM 270k @ 55, RM 390k @ 60) dan perkirakan pendapatan pensiun bulanan Anda.",
        heading: "Proyeksi pensiun EPF",
        tagline: "Proyeksikan saldo KWSP dan bandingkan dengan target Basic Savings.",
      },
    },
  },
  {
    slug: "housing",
    path: "/housing-loan",
    prerender: true,
    sitemap: { priority: 0.9, changefreq: "monthly" },
    copy: {
      en: {
        title: "Housing Loan Calculator Malaysia 2026 (Stamp Duty + Legal Fees) | HelloKalku",
        description:
          "Calculate your Malaysia home loan monthly repayment plus stamp duty (MOT + loan agreement), legal fees, and total upfront cash. Includes first-home buyer exemption.",
        keywords:
          "housing loan calculator malaysia, home loan calculator, stamp duty calculator malaysia, mot stamp duty, legal fees calculator, loan agreement stamp duty",
        heading: "Malaysia housing loan calculator",
        tagline: "Monthly repayment plus stamp duty, legal fees, and upfront cash.",
      },
      ms: {
        title: "Kalkulator Pinjaman Perumahan Malaysia 2026 (Duti Setem + Yuran Guaman) | HelloKalku",
        description:
          "Kira ansuran bulanan pinjaman rumah Malaysia berserta duti setem (MOT + perjanjian pinjaman), yuran guaman, dan jumlah tunai pendahuluan. Termasuk pengecualian pembeli rumah pertama.",
        heading: "Kalkulator pinjaman perumahan Malaysia",
        tagline: "Ansuran bulanan berserta duti setem, yuran guaman, dan tunai pendahuluan.",
      },
      id: {
        title: "Kalkulator KPR Malaysia 2026 (Bea Meterai + Biaya Hukum) | HelloKalku",
        description:
          "Hitung cicilan bulanan pinjaman rumah Malaysia plus bea meterai (MOT + perjanjian pinjaman), biaya hukum, dan total uang muka. Termasuk pembebasan pembeli rumah pertama.",
        heading: "Kalkulator pinjaman rumah Malaysia",
        tagline: "Cicilan bulanan plus bea meterai, biaya hukum, dan uang muka.",
      },
    },
  },
  {
    slug: "tax",
    path: "/income-tax",
    prerender: true,
    sitemap: { priority: 0.9, changefreq: "monthly" },
    copy: {
      en: {
        title: "Income Tax Calculator Malaysia 2026 (Reliefs + Rebate) | HelloKalku",
        description:
          "Estimate your Malaysia personal income tax for YA 2026. Apply EPF, lifestyle, medical, and education reliefs, see your chargeable income, rebate, tax payable, and effective rate.",
        keywords:
          "income tax calculator malaysia, lhdn tax calculator 2026, tax relief malaysia, pcb calculator, chargeable income, tax rebate malaysia",
        heading: "Malaysia income tax calculator 2026",
        tagline: "Reliefs, rebates, chargeable income, and effective tax rate.",
      },
      ms: {
        title: "Kalkulator Cukai Pendapatan Malaysia 2026 (Pelepasan + Rebat) | HelloKalku",
        description:
          "Anggarkan cukai pendapatan peribadi Malaysia untuk TT 2026. Masukkan pelepasan EPF, gaya hidup, perubatan, dan pendidikan, lihat pendapatan bercukai, rebat, cukai kena dibayar, dan kadar berkesan.",
        heading: "Kalkulator cukai pendapatan Malaysia 2026",
        tagline: "Pelepasan, rebat, pendapatan bercukai, dan kadar cukai berkesan.",
      },
      id: {
        title: "Kalkulator Pajak Penghasilan Malaysia 2026 (Keringanan + Rebat) | HelloKalku",
        description:
          "Perkirakan pajak penghasilan pribadi Malaysia untuk TP 2026. Terapkan keringanan EPF, gaya hidup, medis, dan pendidikan, lihat penghasilan kena pajak, rebat, pajak terutang, dan tarif efektif.",
        heading: "Kalkulator pajak penghasilan Malaysia 2026",
        tagline: "Keringanan, rebat, penghasilan kena pajak, dan tarif efektif.",
      },
    },
  },
  {
    slug: "bmi",
    path: "/bmi",
    prerender: true,
    sitemap: { priority: 0.85, changefreq: "monthly" },
    copy: {
      en: {
        title: "BMI Calculator (with BMR & Daily Calories) | HelloKalku",
        description:
          "Calculate your Body Mass Index (BMI), healthy weight range, BMR, and daily calorie needs (TDEE) using the Mifflin-St Jeor formula. Free, instant, and private.",
        keywords:
          "bmi calculator, body mass index, bmr calculator, tdee calculator, daily calorie calculator, healthy weight range",
        heading: "BMI calculator with BMR & calories",
        tagline: "BMI, healthy weight range, BMR, and daily calorie needs.",
      },
      ms: {
        title: "Kalkulator BMI (dengan BMR & Kalori Harian) | HelloKalku",
        description:
          "Kira Indeks Jisim Badan (BMI), julat berat sihat, BMR, dan keperluan kalori harian (TDEE) menggunakan formula Mifflin-St Jeor. Percuma, segera, dan peribadi.",
        heading: "Kalkulator BMI dengan BMR & kalori",
        tagline: "BMI, julat berat sihat, BMR, dan keperluan kalori harian.",
      },
      id: {
        title: "Kalkulator BMI (dengan BMR & Kalori Harian) | HelloKalku",
        description:
          "Hitung Indeks Massa Tubuh (BMI), rentang berat sehat, BMR, dan kebutuhan kalori harian (TDEE) menggunakan rumus Mifflin-St Jeor. Gratis, instan, dan privat.",
        heading: "Kalkulator BMI dengan BMR & kalori",
        tagline: "BMI, rentang berat sehat, BMR, dan kebutuhan kalori harian.",
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
      
      ms: {
        title: "Kalkulator Asas Online (Percuma, dengan Sejarah) | HelloKalku",
        description:
          "Kalkulator asas online untuk aritmetik harian. Menyokong keyboard, sejarah kira, dan mode gelap.",
        heading: "Kalkulator asas",
        tagline: "Aritmetik pantas dengan sejarah dan sokongan keyboard.",
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
      
      ms: {
        title: "Kalkulator Saintifik Online | HelloKalku",
        description:
          "Kalkulator saintifik online dengan trigonometri, logaritma, eksponen, faktorial, dan konstanta matematik.",
        heading: "Kalkulator saintifik",
        tagline: "Trigonometri, logaritma, eksponen, dan konstanta.",
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
      
      ms: {
        title: "Kalkulator Faraid (Pembahagian Waris Islam) | HelloKalku",
        description:
          "Kira pembahagian waris faraid untuk suami/isteri, anak, ibu bapa, dan saudara berdasarkan kaedah Islam.",
        heading: "Kalkulator faraid",
        tagline: "Pembahagian waris Islam yang jelas dan sistematis.",
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
      
      ms: {
        title: "Kalkulator Zakat Malaysia (Nisab 2026) | HelloKalku",
        description:
          "Kira zakat tahunan untuk simpanan, emas, perak, pelaburan, dan aset perniagaan berdasarkan nisab terkini.",
        heading: "Kalkulator zakat",
        tagline: "Anggaran zakat tahunan untuk semua jenis aset.",
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
      
      ms: {
        title: "Panduan Wasiat Islam & senarai semak | HelloKalku",
        description:
          "Susun wasiat Islam langkah demi langkah dengan senarai semak merangkumi aset, wasi, waris, dan syarat syariah.",
        heading: "Panduan wasiat",
        tagline: "Aliran kerja wasiat Islam dengan senarai semak dan langkah praktikal.",
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
    slug: "blog",
    path: "/blog",
    prerender: true,
    sitemap: { priority: 0.85, changefreq: "weekly" },
    copy: {
      en: {
        title: "Calculator Guides & Financial Education | HelloKalku",
        description:
          "In-depth guides on Malaysian salary deductions, EPF, income tax, zakat, faraid inheritance, wasiat, and SOCSO. Learn how every number on your payslip and tax form works.",
        keywords:
          "malaysia financial guides, EPF guide, income tax malaysia guide, zakat guide, faraid guide, salary deductions explained",
        heading: "Guides & Financial Education",
        tagline: "In-depth articles on Malaysian finance, Islamic wealth planning, and calculator tools.",
      },
      ms: {
        title: "Panduan Kalkulator & Pendidikan Kewangan | HelloKalku",
        description:
          "Panduan mendalam tentang potongan gaji Malaysia, EPF, cukai pendapatan, zakat, faraid, wasiat, dan SOCSO.",
        heading: "Panduan & Pendidikan Kewangan",
        tagline: "Artikel mendalam tentang kewangan Malaysia dan perancangan kekayaan Islam.",
      },
      id: {
        title: "Panduan Kalkulator & Edukasi Keuangan | HelloKalku",
        description:
          "Panduan mendalam tentang potongan gaji Malaysia, EPF, pajak penghasilan, zakat, faraid, wasiat, dan SOCSO.",
        heading: "Panduan & Edukasi Keuangan",
        tagline: "Artikel mendalam tentang keuangan Malaysia dan perencanaan kekayaan Islam.",
      },
    },
  },
  {
    slug: "partners",
    path: "/partners",
    prerender: true,
    sitemap: { priority: 0.4, changefreq: "weekly" },
    copy: {
      en: {
        title: "Sites embedding HelloKalku | Partners",
        description:
          "HelloKalku calculators are embedded on personal finance blogs, fintech sites, and educational platforms across Malaysia and Southeast Asia.",
        keywords: "hellokalku partners, embed calculator malaysia, calculator widget partners",
        heading: "Sites that embed HelloKalku",
        tagline: "Free, private calculators trusted by writers, planners, and platforms.",
      },
      ms: {
        title: "Laman web yang membenamkan HelloKalku | Rakan kongsi",
        description:
          "Kalkulator HelloKalku dibenamkan pada blog kewangan peribadi, laman fintech, dan platform pendidikan di Malaysia dan Asia Tenggara.",
        heading: "Laman yang membenamkan HelloKalku",
        tagline: "Kalkulator percuma dan tepat yang dipercayai penulis, perancang, dan platform.",
      },
      id: {
        title: "Situs yang menyematkan HelloKalku | Mitra",
        description:
          "Kalkulator HelloKalku disematkan di blog keuangan pribadi, situs fintech, dan platform pendidikan di seluruh Malaysia dan Asia Tenggara.",
        heading: "Situs yang menyematkan HelloKalku",
        tagline: "Kalkulator gratis dan akurat yang dipercaya penulis, perencana, dan platform.",
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
      
      ms: {
        title: "Dasar Privasi | HelloKalku",
        description:
          "Cara HelloKalku menangani privasi, analitik, pengumpulan prospek, dan data iklan.",
        heading: "Dasar privasi",
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
      
      ms: {
        title: "Syarat Penggunaan | HelloKalku",
        description:
          "Syarat penggunaan HelloKalku, skop perkhidmatan, penafian, dan tanggungjawab pengguna.",
        heading: "Syarat penggunaan",
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
