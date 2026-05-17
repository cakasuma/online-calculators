// ─── i18n System ────────────────────────────────────────────────────────────
// Zero-dependency i18n for English, Bahasa Malaysia, and Bahasa Indonesia.
// Locale is the first path segment (e.g. /en/salary, /ms/zakat, /id/faraid)
// and is persisted to localStorage for return-visit detection.

export type Locale = "en" | "ms" | "id";

export const SUPPORTED_LOCALES: Locale[] = ["en", "ms", "id"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "calc_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ms" || value === "id";
}

export function getLocaleFromUrl(): Locale | null {
  try {
    const pathname = window.location.pathname;
    const firstSegment = pathname.split("/").filter(Boolean)[0];
    if (isLocale(firstSegment)) return firstSegment;
  } catch { /* noop */ }
  return null;
}

export function getSavedLocale(): Locale {
  // Priority 1: URL lang prefix (enables shareable URLs)
  const urlLocale = getLocaleFromUrl();
  if (urlLocale) return urlLocale;
  // Priority 2: localStorage
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch { /* noop */ }
  // Priority 3: Auto-detect from browser
  const nav = navigator.language?.toLowerCase() || "";
  if (nav.startsWith("ms")) return "ms";
  if (nav.startsWith("id")) return "id";
  return DEFAULT_LOCALE;
}

export function pathWithLocale(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean === "/" ? "" : clean}`;
}

export function stripLocaleFromPath(pathname: string): { locale: Locale | null; path: string } {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    const rest = segments.slice(1).join("/");
    return { locale: segments[0], path: rest ? `/${rest}` : "/" };
  }
  return { locale: null, path: pathname || "/" };
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch { /* noop */ }
}

// ─── Number Formatting ────────────────────────────────────────────────────
// English/Malay: 1,234,567.89   Indonesian: 1.234.567,89

export function formatNumber(n: number, locale: Locale, decimals = 2): string {
  // Manual formatter — avoids Intl locale-data gaps in some environments.
  // Indonesian: 1.234.567,89  (dot thousands, comma decimal)
  // English/Malay: 1,234,567.89  (comma thousands, dot decimal)
  const sign = n < 0 ? "-" : "";
  const fixed = Math.abs(n).toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  if (locale === "id") {
    const thousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${sign}${thousands}${decPart !== undefined ? `,${decPart}` : ""}`;
  }
  const thousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${thousands}${decPart !== undefined ? `.${decPart}` : ""}`;
}

export function formatCurrency(n: number, locale: Locale): string {
  return formatNumber(n, locale, 2);
}

export function formatInteger(n: number, locale: Locale): string {
  return formatNumber(n, locale, 0);
}

// Parse a locale-formatted number string back to a number
export function parseLocaleNumber(str: string, locale: Locale): number {
  if (!str || str.trim() === "") return NaN;
  let cleaned = str.trim();
  if (locale === "id") {
    // Indonesian: 1.234.567,89 → remove dots, replace comma with dot
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // English: 1,234,567.89 → remove commas
    cleaned = cleaned.replace(/,/g, "");
  }
  return parseFloat(cleaned);
}

// Format an input value as the user types (for currency inputs)
export function formatInputValue(raw: string, locale: Locale): string {
  // Allow empty or just minus
  if (!raw || raw === "-") return raw;
  
  const num = parseLocaleNumber(raw, locale);
  if (isNaN(num)) return raw;
  
  // Don't format if user is typing decimals
  const sep = locale === "id" ? "," : ".";
  if (raw.endsWith(sep) || raw.endsWith(sep + "0")) return raw;
  
  // Check how many decimal places user typed
  const parts = raw.split(sep);
  const decimalPlaces = parts.length > 1 ? parts[1].length : 0;
  
  return formatNumber(num, locale, Math.min(decimalPlaces, 2));
}

// ─── Translation Dictionary ──────────────────────────────────────────────

const translations = {
  // ── Common / Nav ──
  "site.title": { en: "HelloKalku", ms: "HelloKalku", id: "HelloKalku" },
  "nav.home": { en: "Home", ms: "Laman Utama", id: "Beranda" },
  "nav.basic": { en: "Basic", ms: "Asas", id: "Dasar" },
  "nav.scientific": { en: "Scientific", ms: "Saintifik", id: "Ilmiah" },
  "nav.faraid": { en: "Faraid", ms: "Faraid", id: "Faraid" },
  "nav.wasiat": { en: "Wasiat", ms: "Wasiat", id: "Wasiat" },
  "common.history": { en: "History", ms: "Sejarah", id: "Riwayat" },
  "history.open": { en: "Open", ms: "Buka", id: "Buka" },
  "common.noHistory": { en: "No history yet", ms: "Tiada sejarah", id: "Belum ada riwayat" },
  "common.historyHint": { en: "Your calculations will appear here", ms: "Pengiraan Anda akan muncul di sini", id: "Perhitungan Anda akan muncul di sini" },
  "common.clear": { en: "Clear", ms: "Padam", id: "Hapus" },
  "common.justNow": { en: "Just now", ms: "Baharu sahaja", id: "Baru saja" },
  "common.mAgo": { en: "m ago", ms: "m lalu", id: "m lalu" },
  "common.hAgo": { en: "h ago", ms: "j lalu", id: "j lalu" },
  "common.calculate": { en: "Calculate", ms: "Kira", id: "Hitung" },
  "common.reset": { en: "Reset", ms: "Tetapkan Semula", id: "Atur Ulang" },
  "common.error": { en: "Error", ms: "Ralat", id: "Kesalahan" },

  // ── Share ──
  "share.button": { en: "Share", ms: "Kongsi", id: "Bagikan" },
  "share.action": {
    en: "Copy share link",
    ms: "Salin pautan kongsi",
    id: "Salin tautan bagikan",
  },
  "share.copiedShort": { en: "Link copied!", ms: "Pautan disalin!", id: "Tautan disalin!" },
  "share.copied": { en: "Link copied", ms: "Pautan disalin", id: "Tautan disalin" },
  "share.copiedDesc": {
    en: "Anyone you send it to will see the same calculation.",
    ms: "Sesiapa yang menerima pautan akan melihat pengiraan yang sama.",
    id: "Siapa pun yang menerimanya akan melihat perhitungan yang sama.",
  },
  "share.error": { en: "Could not copy", ms: "Tidak boleh disalin", id: "Tidak dapat menyalin" },
  "share.errorDesc": {
    en: "Copy the URL from the address bar instead.",
    ms: "Salin URL dari bar alamat sebagai gantinya.",
    id: "Salin URL dari bilah alamat sebagai gantinya.",
  },
  "share.newsletter.title": {
    en: "Get monthly Malaysia finance tips",
    ms: "Dapatkan petua kewangan Malaysia bulanan",
    id: "Dapatkan tips keuangan Malaysia bulanan",
  },
  "share.newsletter.desc": {
    en: "Short, practical notes on salary, tax, zakat, and planning — one email per month, unsubscribe anytime.",
    ms: "Nota ringkas dan praktikal tentang gaji, cukai, zakat, dan perancangan — satu e-mel sebulan, henti langganan bila-bila masa.",
    id: "Catatan ringkas dan praktis tentang gaji, pajak, zakat, dan perencanaan — satu email sebulan, berhenti berlangganan kapan saja.",
  },
  "share.newsletter.cta": { en: "Subscribe", ms: "Langgan", id: "Berlangganan" },
  "share.newsletter.successTitle": {
    en: "Thanks for joining.",
    ms: "Terima kasih kerana melanggan.",
    id: "Terima kasih telah berlangganan.",
  },
  "share.newsletter.successDesc": {
    en: "Look out for your first issue in the coming weeks.",
    ms: "Nantikan keluaran pertama dalam beberapa minggu akan datang.",
    id: "Nantikan edisi pertama dalam beberapa minggu mendatang.",
  },
  "share.newsletter.disclaimer": {
    en: "We won't share your email. Unsubscribe in one click.",
    ms: "Kami tidak akan berkongsi e-mel anda. Henti langganan dengan satu klik.",
    id: "Kami tidak akan membagikan email Anda. Berhenti berlangganan dengan satu klik.",
  },
  "share.newsletter.dismiss": { en: "Dismiss", ms: "Tutup", id: "Tutup" },

  // ── Home Page ──
  "home.title": { en: "Islamic Inheritance Calculator", ms: "Kalkulator Waris Islam", id: "Kalkulator Waris Islam" },
  "home.subtitle": { en: "Accurately calculate Faraid (Islamic inheritance) distribution based on Quran and Sunnah.", ms: "Kira pembahagian Faraid (waris Islam) secara tepat berdasarkan Al-Qur'an dan Sunnah.", id: "Hitung pembagian Faraid (waris Islam) secara akurat berdasarkan Al-Qur'an dan Sunnah." },
  "home.faraid.title": { en: "Faraid Calculator", ms: "Kalkulator Faraid", id: "Kalkulator Faraid" },
  "home.faraid.desc": { en: "Full Islamic inheritance distribution with pie chart visualization, multiple heirs, and detailed breakdown.", ms: "Pembahagian waris Islam lengkap dengan visualisasi carta, pelbagai ahli waris, dan perincian terperinci.", id: "Pembagian waris Islam lengkap dengan visualisasi diagram, berbagai ahli waris, dan rincian detail." },
  "home.faraid.badge": { en: "Featured", ms: "Unggulan", id: "Unggulan" },
  "home.faraid.cta": { en: "Open Calculator", ms: "Buka Kalkulator", id: "Buka Kalkulator" },
  "home.islamicTools": { en: "Islamic Tools", ms: "Alat Islam", id: "Alat Islam" },
  "home.zakat.badge": { en: "Zakat", ms: "Zakat", id: "Zakat" },
  "home.hero.badge": { en: "Welcome to HelloKalku", ms: "Selamat datang di HelloKalku", id: "Selamat datang di HelloKalku" },
  "home.hero.subtitle": { en: "Fast, practical calculators and guides for daily finance, advanced math, and Islamic planning. Built for clarity, bilingual usage (English + Indonesian), and mobile-first speed.", ms: "Kalkulator dan panduan yang pantas dan praktikal untuk keuangan harian, matematik lanjutan, dan perancangan Islam. Dibuat agar jelas, menyokong dua bahasa (Inggris + Indonesia), dan pantas di peranti mudah alih.", id: "Kalkulator dan panduan yang cepat dan praktis untuk keuangan harian, matematika lanjutan, dan perencanaan Islam. Dibuat agar jelas, mendukung dua bahasa (Inggris + Indonesia), dan cepat di perangkat mobile." },
  "home.hero.ctaSalary": { en: "Start with Salary Calculator", ms: "Mulakan daripada Kalkulator Gaji", id: "Mulai dari Kalkulator Gaji" },
  "home.hero.ctaFaraid": { en: "Open Faraid Calculator", ms: "Buka Kalkulator Faraid", id: "Buka Kalkulator Faraid" },
  "home.featured.title": { en: "Featured tools", ms: "Alat unggulan", id: "Alat unggulan" },
  "home.featured.openTool": { en: "Open tool", ms: "Buka alat", id: "Buka alat" },
  "home.why.title": { en: "Why HelloKalku?", ms: "Kenapa HelloKalku?", id: "Kenapa HelloKalku?" },
  "home.why.body": { en: "HelloKalku is designed for users in Southeast Asia who need trustworthy calculators with clear explanations, localized numbers, and practical references. Whether you are checking net salary, computing zakat, planning faraid distribution, or solving formulas, HelloKalku keeps the interface clean and consistent.", ms: "HelloKalku dirancang untuk pengguna di Asia Tenggara yang memerlukan kalkulator tepercaya dengan penjelasan yang jelas, format angka lokal, dan referensi praktikal. Baik Anda mengira gaji bersih, zakat, pembahagian faraid, maupun rumus matematik, HelloKalku menjaga antarmuka tetap rapi dan konsisten.", id: "HelloKalku dirancang untuk pengguna di Asia Tenggara yang membutuhkan kalkulator tepercaya dengan penjelasan yang jelas, format angka lokal, dan referensi praktis. Baik Anda menghitung gaji bersih, zakat, pembagian faraid, maupun rumus matematika, HelloKalku menjaga antarmuka tetap rapi dan konsisten." },
  "home.category.Finance.name": { en: "Finance", ms: "Keuangan", id: "Keuangan" },
  "home.category.Finance.desc": { en: "Income, tax, and wealth planning tools", ms: "Alat untuk perancangan pendapatan, cukai, dan kekayaan", id: "Alat untuk perencanaan penghasilan, pajak, dan kekayaan" },
  "home.category.Math.name": { en: "Math", ms: "Matematik", id: "Matematika" },
  "home.category.Math.desc": { en: "Daily and advanced calculation helpers", ms: "Bantuan pengiraan harian dan lanjutan", id: "Bantuan perhitungan harian dan lanjutan" },
  "home.category.Islamic.name": { en: "Islamic", ms: "Islam", id: "Islam" },
  "home.category.Islamic.desc": { en: "Shariah-aware planning and guidance", ms: "Panduan dan perancangan selaras syariah", id: "Panduan dan perencanaan selaras syariah" },
  "home.category.Documents.name": { en: "Documents", ms: "Dokumen", id: "Dokumen" },
  "home.category.Documents.desc": { en: "Guides and generators for legal paperwork", ms: "Panduan dan generator untuk dokumen legal", id: "Panduan dan generator untuk dokumen legal" },
  "tools.salary-calculator.name": { en: "Salary Calculator (Malaysia)", ms: "Kalkulator Gaji (Malaysia)", id: "Kalkulator Gaji (Malaysia)" },
  "tools.salary-calculator.desc": { en: "Estimate monthly take-home pay with EPF, SOCSO, EIS, and income tax deductions.", ms: "Perkirakan gaji bersih bulanan dengan potongan EPF, SOCSO, EIS, dan cukai pendapatan.", id: "Perkirakan gaji bersih bulanan dengan potongan EPF, SOCSO, EIS, dan pajak penghasilan." },
  "tools.salary-calculator.badge": { en: "Popular", ms: "Populer", id: "Populer" },
  "tools.faraid-calculator.name": { en: "Faraid Calculator", ms: "Kalkulator Faraid", id: "Kalkulator Faraid" },
  "tools.faraid-calculator.desc": { en: "Islamic inheritance share calculator with detailed heir distribution.", ms: "Kalkulator pembahagian waris Islam dengan perincian ahli waris yang terperinci.", id: "Kalkulator pembagian waris Islam dengan rincian ahli waris yang detail." },
  "home.tools.title": { en: "Other Tools", ms: "Alat Lain", id: "Alat Lainnya" },
  "home.basic.title": { en: "Basic Calculator", ms: "Kalkulator Asas", id: "Kalkulator Dasar" },
  "home.basic.desc": { en: "Standard arithmetic operations — addition, subtraction, multiplication, and division.", ms: "Operasi aritmetik standar — penjumlahan, pengurangan, perkalian, dan pembahagian.", id: "Operasi aritmatika standar — penjumlahan, pengurangan, perkalian, dan pembagian." },
  "home.scientific.title": { en: "Scientific Calculator", ms: "Kalkulator Saintifik", id: "Kalkulator Ilmiah" },
  "home.scientific.desc": { en: "Trigonometric functions, logarithms, powers, factorials, and more.", ms: "Fungsi trigonometri, logaritma, pangkat, faktorial, dan lain.", id: "Fungsi trigonometri, logaritma, pangkat, faktorial, dan lainnya." },
  "home.about.title": { en: "What is Faraid?", ms: "Apa itu Faraid?", id: "Apa itu Faraid?" },
  "home.about.text": { en: "Faraid (فرائض) is the Islamic law of inheritance derived from the Quran and Sunnah. It defines the precise shares each heir receives from a deceased person's estate after settling debts and fulfilling any bequest (wasiyyah). This calculator covers primary heirs including spouses, parents, children, grandparents, and siblings.", ms: "Faraid (فرائض) adalah hukum waris Islam yang berasal daripada Al-Quran dan Sunnah. Ini mendefinisikan bahagian tepat yang diterima setiap ahli waris daripada harta seseorang yang meninggal selepas melunasi hutang dan memenuhi wasiat. Kalkulator ini merangkumi ahli waris utama termasuk pasangan, ibu bapa, anak-anak, kakek-nenek, dan saudara kandung.", id: "Faraid (فرائض) adalah hukum waris Islam yang berasal dari Al-Quran dan Sunnah. Ini mendefinisikan bagian tepat yang diterima setiap ahli waris dari harta seseorang yang meninggal setelah melunasi utang dan memenuhi wasiat. Kalkulator ini mencakup ahli waris utama termasuk pasangan, orang tua, anak-anak, kakek-nenek, dan saudara kandung.",
  },

  // ── Faraid Calculator ──
  "faraid.disclaimer.title": { en: "Educational Tool", ms: "Alat Pendidikan", id: "Alat Edukasi" },
  "faraid.disclaimer.text": { en: "This calculator covers primary Faraid scenarios based on mainstream Islamic jurisprudence. Always consult a qualified Islamic scholar or certified estate planner for official distribution.", ms: "Kalkulator ini merangkumi senario Faraid utama berdasarkan fiqh Islam yang muktabar. Sentiasa rujuk dengan ulama atau perencana warisan bersertifikat untuk pembahagian resmi.", id: "Kalkulator ini mencakup skenario Faraid utama berdasarkan fikih Islam yang muktabar. Selalu konsultasikan dengan ulama atau perencana warisan bersertifikat untuk pembagian resmi.",
  },
  "faraid.disclaimer.reference": { en: "Learn more about Islamic inheritance.", ms: "Pelajari lebih lanjut tentang waris Islam.", id: "Pelajari lebih lanjut tentang waris Islam." },
  "faraid.currency": { en: "Currency", ms: "Mata Wang", id: "Mata Uang" },
  "faraid.estateDetails": { en: "Estate Details", ms: "Terperinci Harta", id: "Detail Harta" },
  "faraid.estateBreakdown": { en: "Estate Breakdown", ms: "Perincian Harta", id: "Rincian Harta" },
  "faraid.totalEstate": { en: "Total Estate Value", ms: "Total Nilai Harta", id: "Total Nilai Harta" },
  "faraid.totalEstate.placeholder": { en: "e.g. 100,000", ms: "cth. 100.000", id: "cth. 100.000" },
  "faraid.debts": { en: "Debts & Funeral Expenses", ms: "Hutang & Kos Pengebumian", id: "Utang & Biaya Pemakaman" },
  "faraid.wasiyyah": { en: "Wasiyyah / Bequest (max 1/3)", ms: "Wasiat (maks 1/3)", id: "Wasiat (maks 1/3)" },
  "faraid.heirs": { en: "Heirs", ms: "Waris", id: "Ahli Waris" },
  "faraid.spouseSection": { en: "Spouse", ms: "Pasangan", id: "Pasangan" },
  "faraid.parentsSection": { en: "Parents & Grandparents", ms: "Ibu Bapa & Datuk-Nenek", id: "Orang Tua & Kakek-Nenek" },
  "faraid.childrenSection": { en: "Children", ms: "Anak-anak", id: "Anak-anak" },
  "faraid.siblingsSection": { en: "Siblings", ms: "Saudara Kandung", id: "Saudara Kandung" },
  "faraid.husband": { en: "Husband", ms: "Suami", id: "Suami" },
  "faraid.wife": { en: "Wife", ms: "Isteri", id: "Istri" },
  "faraid.numberOfWives": { en: "Number of Wives", ms: "Jumlah Isteri", id: "Jumlah Istri" },
  "faraid.wifeN": { en: "Wife", ms: "Isteri", id: "Istri" },
  "faraid.father": { en: "Father", ms: "Bapa", id: "Ayah" },
  "faraid.grandfather": { en: "Paternal Grandfather", ms: "Datuk (daripada Bapa)", id: "Kakek (dari Ayah)" },
  "faraid.grandfatherResidual": { en: "Grandfather (residual)", ms: "Datuk (sisa)", id: "Kakek (sisa)" },
  "faraid.mother": { en: "Mother", ms: "Ibu", id: "Ibu" },
  "faraid.sons": { en: "Sons", ms: "Anak Lelaki", id: "Anak Laki-laki" },
  "faraid.daughters": { en: "Daughters", ms: "Anak Perempuan", id: "Anak Perempuan" },
  "faraid.fullBrothers": { en: "Full Brothers", ms: "Saudara Lelaki Kandung", id: "Saudara Laki-laki Kandung" },
  "faraid.fullBrother": { en: "Full Brother", ms: "Saudara Lelaki Kandung", id: "Saudara Laki-laki Kandung" },
  "faraid.fullSisters": { en: "Full Sisters", ms: "Saudara Perempuan Kandung", id: "Saudara Perempuan Kandung" },
  "faraid.fullSister": { en: "Full Sister", ms: "Saudara Perempuan Kandung", id: "Saudara Perempuan Kandung" },
  "faraid.paternalGrandmother": { en: "Paternal Grandmother", ms: "Nenek (daripada Bapa)", id: "Nenek (dari Ayah)" },
  "faraid.maternalGrandmother": { en: "Maternal Grandmother", ms: "Nenek (daripada Ibu)", id: "Nenek (dari Ibu)" },
  "faraid.grandsons": { en: "Grandsons", ms: "Cucu Lelaki", id: "Cucu Laki-laki" },
  "faraid.grandson": { en: "Grandson", ms: "Cucu Lelaki", id: "Cucu Laki-laki" },
  "faraid.granddaughters": { en: "Granddaughters", ms: "Cucu Perempuan", id: "Cucu Perempuan" },
  "faraid.granddaughter": { en: "Granddaughter", ms: "Cucu Perempuan", id: "Cucu Perempuan" },
  "faraid.paternalBrothers": { en: "Paternal Brothers", ms: "Saudara Lelaki Sebapa", id: "Saudara Laki-laki Seayah" },
  "faraid.paternalBrother": { en: "Paternal Brother", ms: "Saudara Lelaki Sebapa", id: "Saudara Laki-laki Seayah" },
  "faraid.paternalSisters": { en: "Paternal Sisters", ms: "Saudara Perempuan Sebapa", id: "Saudara Perempuan Seayah" },
  "faraid.paternalSister": { en: "Paternal Sister", ms: "Saudara Perempuan Sebapa", id: "Saudara Perempuan Seayah" },
  "faraid.maternalBrothers": { en: "Maternal Brothers", ms: "Saudara Lelaki Seibu", id: "Saudara Laki-laki Seibu" },
  "faraid.maternalBrother": { en: "Maternal Brother", ms: "Saudara Lelaki Seibu", id: "Saudara Laki-laki Seibu" },
  "faraid.maternalSisters": { en: "Maternal Sisters", ms: "Saudara Perempuan Seibu", id: "Saudara Perempuan Seibu" },
  "faraid.maternalSister": { en: "Maternal Sister", ms: "Saudara Perempuan Seibu", id: "Saudara Perempuan Seibu" },
  "faraid.consanguineMale": { en: "Consanguine (Agnate Relative)", ms: "Kerabat Asabah (Paman/Sepupu)", id: "Kerabat Asabah (Paman/Sepupu)" },
  "faraid.grandchildrenSection": { en: "Grandchildren", ms: "Cucu", id: "Cucu" },
  "faraid.fullSiblingsSection": { en: "Full Siblings", ms: "Saudara Kandung", id: "Saudara Kandung" },
  "faraid.paternalSiblingsSection": { en: "Paternal Siblings (half, father's side)", ms: "Saudara Sebapa (setengah, daripada bapa)", id: "Saudara Seayah (setengah, dari ayah)" },
  "faraid.maternalSiblingsSection": { en: "Maternal Siblings (uterine)", ms: "Saudara Seibu (Uterine)", id: "Saudara Seibu (Uterine)" },
  "faraid.otherRelativesSection": { en: "Other Relatives", ms: "Kerabat Lain", id: "Kerabat Lainnya" },
  "faraid.distantKindredNote": { en: "Distant Kindred (dhawi al-arham) are not calculated here — consult a qualified Islamic scholar for complex cases.", ms: "Kerabat jauh (dzawi al-arham) tidak dikira di sini — rujuk dengan ulama untuk kasus kompleks.", id: "Kerabat jauh (dzawi al-arham) tidak dihitung di sini — konsultasikan dengan ulama untuk kasus kompleks." },

  // ── Faraid FAQ ──
  "faraid.faq.title": { en: "Frequently Asked Questions", ms: "Soalan yang Sering Ditanyakan", id: "Pertanyaan yang Sering Ditanyakan" },
  "faraid.faq.noMaternalGrandfather.q": { en: "Why is there no Maternal Grandfather?", ms: "Mengapa tiada Datuk daripada Ibu?", id: "Mengapa tidak ada Kakek dari Ibu?" },
  "faraid.faq.noMaternalGrandfather.a": { en: "This is intentional and correct in Sunni Islamic law. The maternal grandfather (mother's father) is not a primary heir — he falls under Distant Kindred (dhawi al-arham) and only inherits when no primary heirs exist at all. In Sunni fiqh, male relatives who connect to the deceased through a female link are classified as distant kindred. The paternal grandfather (father's father) is a primary heir because he is in the direct male (agnatic) lineage. Interestingly, both grandmothers are exceptions — they are explicitly recognised as sharers in hadith traditions despite connecting through a female in some cases.", ms: "Hal ini disengaja dan benar dalam hukum Islam Sunni. Datuk daripada pihak ibu (bapa daripada ibu) bukan ahli waris utama — ia termasuk dalam Kerabat Jauh (dzawi al-arham) dan hanya mewarisi jika tiada ahli waris utama sama sekali. Dalam fiqh Sunni, kerabat lelaki yang terhubung kepada pewaris melalui jalur perempuan diklasifikasikan sebagai kerabat jauh. Datuk daripada pihak bapa adalah ahli waris utama karena ia berada dalam jalur lelaki (asabah) terus. Menariknya, kedua nenek merupakan pengecualian — mereka secara eksplisit diakui sebagai ashab al-furud dalam tradisi hadis.", id: "Hal ini disengaja dan benar dalam hukum Islam Sunni. Kakek dari pihak ibu (ayah dari ibu) bukan ahli waris utama — ia termasuk dalam Kerabat Jauh (dzawi al-arham) dan hanya mewarisi jika tidak ada ahli waris utama sama sekali. Dalam fikih Sunni, kerabat laki-laki yang terhubung kepada pewaris melalui jalur perempuan diklasifikasikan sebagai kerabat jauh. Kakek dari pihak ayah adalah ahli waris utama karena ia berada dalam jalur laki-laki (asabah) langsung. Menariknya, kedua nenek merupakan pengecualian — mereka secara eksplisit diakui sebagai ashab al-furud dalam tradisi hadis.",
  },
  "faraid.faq.awl.q": { en: "What happens when total fixed shares exceed 100%?", ms: "Apa yang terjadi jika total bahagian tetap melebihi 100%?", id: "Apa yang terjadi jika total bagian tetap melebihi 100%?" },
  "faraid.faq.awl.a": { en: "This is resolved by Awl (proportional reduction). Each heir's fixed share is reduced proportionally so that the total equals 100%. For example, if fixed shares add up to 7/6, each heir receives their share divided by 7/6. This ruling was established by Caliph Umar ibn al-Khattab (RA) and agreed upon by the companions.", ms: "Hal ini diselesaikan dengan Awl (pengurangan proporsional). Bahagian tetap setiap ahli waris dikurangi secara proporsional agar totalnya sama dengan 100%. Sebagai contoh, jika bahagian tetap berjumlah 7/6, setiap ahli waris menerima bagiannya dibahagikan 7/6. Putusan ini ditetapkan oleh Khalifah Umar ibn al-Khattab (RA) dan disepakati oleh para sahabat.", id: "Hal ini diselesaikan dengan Awl (pengurangan proporsional). Bagian tetap setiap ahli waris dikurangi secara proporsional agar totalnya sama dengan 100%. Misalnya, jika bagian tetap berjumlah 7/6, setiap ahli waris menerima bagiannya dibagi 7/6. Putusan ini ditetapkan oleh Khalifah Umar ibn al-Khattab (RA) dan disepakati oleh para sahabat.",
  },
  "faraid.faq.hajb.q": { en: "What does 'Blocked (Hajb)' mean?", ms: "Apa arti 'Terhalang (Hajb)'?", id: "Apa arti 'Terhalang (Hajb)'?" },
  "faraid.faq.hajb.a": { en: "Hajb means a closer heir prevents a more distant one from inheriting. There are two types: Hajb Hirman (complete exclusion, e.g. the father blocks the paternal grandfather) and Hajb Nuqsan (partial reduction, e.g. children reduce the spouse's share). A blocked heir receives nothing, but their presence in the family is still noted.", ms: "Hajb berarti ahli waris yang lebih dekat mencegah ahli waris yang lebih jauh untuk mewarisi. Ada dua jenis: Hajb Hirman (pengecualian penuh, mis. bapa menghalangi kakek daripada bapa) dan Hajb Nuqsan (pengurangan sebagian, mis. anak-anak mengurangi bahagian pasangan). Ahli waris yang terhalang tidak menerima apa-apa, tetapi kehadirannya dalam keluarga tetap dicatat.", id: "Hajb berarti ahli waris yang lebih dekat mencegah ahli waris yang lebih jauh untuk mewarisi. Ada dua jenis: Hajb Hirman (pengecualian penuh, mis. ayah menghalangi kakek dari ayah) dan Hajb Nuqsan (pengurangan sebagian, mis. anak-anak mengurangi bagian pasangan). Ahli waris yang terhalang tidak menerima apa-apa, tetapi kehadirannya dalam keluarga tetap dicatat.",
  },
  "faraid.faq.wasiyyah.q": { en: "Why is Wasiyyah capped at 1/3?", ms: "Mengapa Wasiat dibatasi 1/3?", id: "Mengapa Wasiat dibatasi 1/3?" },
  "faraid.faq.wasiyyah.a": { en: "The Prophet Muhammad ﷺ instructed that a bequest (wasiyyah) must not exceed one-third of the estate, as recorded in Sahih Bukhari and Muslim. The remainder must be distributed to legal heirs according to Faraid rules. Additionally, a wasiyyah cannot be made in favour of a legal heir — heirs receive their shares through Faraid, not through bequest.", ms: "Nabi Muhammad ﷺ memerintahkan agar wasiat tidak melebihi sepertiga harta, sebagaimana tercatat dalam Sahih Bukhari dan Muslim. Sisanya perlu dibahagikan kepada ahli waris yang sah sepadan syarat Faraid. Selain itu, wasiat tidak boleh diberikan kepada ahli waris yang sah — ahli waris menerima bahagian mereka melalui Faraid, bukan melalui wasiat.", id: "Nabi Muhammad ﷺ memerintahkan agar wasiat tidak melebihi sepertiga harta, sebagaimana tercatat dalam Sahih Bukhari dan Muslim. Sisanya harus dibagikan kepada ahli waris yang sah sesuai ketentuan Faraid. Selain itu, wasiat tidak boleh diberikan kepada ahli waris yang sah — ahli waris menerima bagian mereka melalui Faraid, bukan melalui wasiat.",
  },

  "faraid.calculateDist": { en: "Calculate Distribution", ms: "Kira Pembahagian", id: "Hitung Pembagian" },
  "faraid.results": { en: "Distribution Results", ms: "Hasil Pembahagian", id: "Hasil Pembagian" },
  "faraid.netEstate": { en: "Net Estate", ms: "Harta Bersih", id: "Harta Bersih" },
  "faraid.share": { en: "Share", ms: "Bahagian", id: "Bagian" },
  "faraid.amount": { en: "Amount", ms: "Jumlah", id: "Jumlah" },
  "faraid.percentage": { en: "%", ms: "%", id: "%" },
  "faraid.totalDistributed": { en: "Total Distributed", ms: "Total Dibagikan", id: "Total Dibagikan" },
  "faraid.residual": { en: "Residual", ms: "Sisa", id: "Sisa" },
  "faraid.son": { en: "Son", ms: "Anak Lelaki", id: "Anak Laki-laki" },
  "faraid.daughter": { en: "Daughter", ms: "Anak Perempuan", id: "Anak Perempuan" },
  "faraid.fatherFixed": { en: "Father (fixed)", ms: "Bapa (tetap)", id: "Ayah (tetap)" },
  "faraid.fatherResidual": { en: "Father (residual)", ms: "Bapa (sisa)", id: "Ayah (sisa)" },
  "faraid.blockedHeirs": { en: "Blocked Heirs (Hajb)", ms: "Waris Terhalang (Hajb)", id: "Ahli Waris Terhalang (Hajb)" },
  "faraid.blockedNote": { en: "Blocked by", ms: "Terhalang oleh", id: "Terhalang oleh" },
  "faraid.awlNote": { en: "Note: Fixed shares exceeded 100% — shares have been reduced proportionally (awl).", ms: "Nota: Bahagian tetap melebihi 100% — bahagian dikurangi secara proporsional (awl).", id: "Catatan: Bagian tetap melebihi 100% — bagian dikurangi secara proporsional (awl).",
  },
  "faraid.undistributed": { en: "Undistributed (Baitulmal)", ms: "Tidak Terbagi (Baitulmal)", id: "Tidak Terbagi (Baitulmal)" },
  "faraid.undistributedNote": { en: "The remaining estate is returned to eligible heirs (radd) or to the public treasury (Baitulmal) if no eligible heir exists.", ms: "Sisa harta dikembalikan kepada ahli waris yang berhak (radd) atau ke kas negara (Baitulmal) jika tiada ahli waris yang berhak.", id: "Sisa harta dikembalikan kepada ahli waris yang berhak (radd) atau ke kas negara (Baitulmal) jika tidak ada ahli waris yang berhak.",
  },
  "faraid.distribution": { en: "Distribution Chart", ms: "Carta Pembahagian", id: "Diagram Pembagian" },
  "faraid.printResults": { en: "Print / Save PDF", ms: "Cetak / Simpan PDF", id: "Cetak / Simpan PDF" },
  "faraid.shareResults": { en: "Share via WhatsApp", ms: "Bagikan via WhatsApp", id: "Bagikan via WhatsApp" },
  "faraid.consultCTA.title": { en: "Need Professional Advice?", ms: "Butuh Saran Profesional?", id: "Butuh Saran Profesional?" },
  "faraid.consultCTA.text": { en: "For legally binding estate distribution, consult a certified Islamic estate planner or faraid practitioner.", ms: "Untuk pembahagian harta yang sah secara hukum, rujuk dengan perencana warisan Islam bersertifikat atau praktisi faraid.", id: "Untuk pembagian harta yang sah secara hukum, konsultasikan dengan perencana warisan Islam bersertifikat atau praktisi faraid.",
  },
  "faraid.consultCTA.button": { en: "Find a Consultant", ms: "Cari Konsultan", id: "Cari Konsultan" },
  "faraid.blocked.father": { en: "Father", ms: "Bapa", id: "Ayah" },
  "faraid.blocked.grandfather": { en: "Paternal Grandfather", ms: "Datuk", id: "Kakek" },
  "faraid.blocked.mother": { en: "Mother", ms: "Ibu", id: "Ibu" },
  "faraid.blocked.sons": { en: "Sons", ms: "Anak Lelaki", id: "Anak Laki-laki" },
  "faraid.blocked.daughters": { en: "2 or more Daughters", ms: "2 atau lebih Anak Perempuan", id: "2 atau lebih Anak Perempuan" },
  "faraid.blocked.grandsons": { en: "Grandsons", ms: "Cucu Lelaki", id: "Cucu Laki-laki" },
  "faraid.blocked.fullBrothers": { en: "Full Brothers", ms: "Saudara Kandung Lelaki", id: "Saudara Kandung Laki-laki" },
  "faraid.spouseBothError": { en: "Deceased cannot have both a husband and wives.", ms: "Almarhum tidak boleh memiliki suami dan isteri sekaligus.", id: "Almarhum tidak bisa memiliki suami dan istri sekaligus.",
  },
  "faraid.siblingsBlockedBy": { en: "Siblings are blocked (hajb) by", ms: "Saudara kandung terhalang (hajb) oleh", id: "Saudara kandung terhalang (hajb) oleh",
  },
  "faraid.share.thirdOfRemainder": { en: "1/3 of remainder", ms: "1/3 daripada sisa", id: "1/3 dari sisa" },
  "faraid.share.sixthPlusResidual": { en: "1/6 + residual", ms: "1/6 + sisa", id: "1/6 + sisa" },
  "faraid.share.reduced": { en: "reduced", ms: "dikurangi", id: "dikurangi" },
  "faraid.chart.amount": { en: "Amount", ms: "Jumlah", id: "Jumlah" },
  "faraid.umariyyatainNote": { en: "Mother's share calculated using umariyyatain rule (1/3 of remainder after spouse).", ms: "Bahagian ibu dikira menggunakan peraturan umariyyatain (1/3 sisa selepas pasangan).", id: "Bagian ibu dihitung menggunakan aturan umariyyatain (1/3 sisa setelah pasangan).",
  },

  // ── Faraid References ──
  "faraid.references.title": { en: "Quranic & Hadith References", ms: "Referensi Al-Quran & Hadis", id: "Referensi Al-Quran & Hadis" },
  "faraid.references.quran411": { en: "Surah An-Nisa 4:11", ms: "Surah An-Nisa 4:11", id: "Surah An-Nisa 4:11" },
  "faraid.references.quran411.text": { en: "Allah instructs you concerning your children: for the male, what is equal to the share of two females. But if there are only daughters, two or more, for them is two-thirds of one's estate. And if there is only one, for her is half. And for one's parents, to each one of them is a sixth of his estate if he left children. But if he had no children and the parents alone inherit from him, then for his mother is one third…", ms: "Allah mensyariatkan (mewajibkan) kepadamu tentang (pembahagian warisan untuk) anak-anakmu, (yaitu) bahagian seorang anak lelaki sama dengan bahagian dua orang anak perempuan. Dan jika anak itu semuanya perempuan yang jumlahnya lebih daripada dua, maka bahagian mereka dua pertiga daripada harta yang ditinggalkan. Jika dia (anak perempuan) itu seorang sahaja, maka dia memperoleh setengah (harta yang ditinggalkan). Dan untuk kedua ibu-bapak, bahagian masing-masing seperenam daripada harta yang ditinggalkan, jika dia (yang meninggal) mempunyai anak…", id: "Allah mensyariatkan (mewajibkan) kepadamu tentang (pembagian warisan untuk) anak-anakmu, (yaitu) bagian seorang anak laki-laki sama dengan bagian dua orang anak perempuan. Dan jika anak itu semuanya perempuan yang jumlahnya lebih dari dua, maka bagian mereka dua pertiga dari harta yang ditinggalkan. Jika dia (anak perempuan) itu seorang saja, maka dia memperoleh setengah (harta yang ditinggalkan). Dan untuk kedua ibu-bapak, bagian masing-masing seperenam dari harta yang ditinggalkan, jika dia (yang meninggal) mempunyai anak…",
  },
  "faraid.references.quran412": { en: "Surah An-Nisa 4:12", ms: "Surah An-Nisa 4:12", id: "Surah An-Nisa 4:12" },
  "faraid.references.quran412.text": { en: "And for you is half of what your wives leave if they have no child. But if they have a child, for you is one fourth of what they leave, after any bequest they may have made or debt. And for the wives is one fourth if you leave no child. But if you leave a child, then for them is an eighth of what you leave, after any bequest you may have made or debt…", ms: "Dan bagianmu (suami-suami) adalah setengah daripada harta yang ditinggalkan oleh isteri-istrimu, jika mereka tidak mempunyai anak. Jika mereka (isteri-istrimu) itu mempunyai anak, maka kamu mendapat seperempat daripada harta yang ditinggalkannya sesudah dipenuhi wasiat yang mereka buat atau (dan) sesudah dibayar utangnya. Para isteri memperoleh seperempat harta yang kamu tinggalkan jika kamu tidak mempunyai anak. Jika kamu mempunyai anak, maka para isteri memperoleh seperdelapan daripada harta yang kamu tinggalkan sesudah dipenuhi wasiat yang kamu buat atau (dan) sesudah dibayar hutang-utangmu…", id: "Dan bagianmu (suami-suami) adalah setengah dari harta yang ditinggalkan oleh istri-istrimu, jika mereka tidak mempunyai anak. Jika mereka (istri-istrimu) itu mempunyai anak, maka kamu mendapat seperempat dari harta yang ditinggalkannya sesudah dipenuhi wasiat yang mereka buat atau (dan) sesudah dibayar utangnya. Para istri memperoleh seperempat harta yang kamu tinggalkan jika kamu tidak mempunyai anak. Jika kamu mempunyai anak, maka para istri memperoleh seperdelapan dari harta yang kamu tinggalkan sesudah dipenuhi wasiat yang kamu buat atau (dan) sesudah dibayar utang-utangmu…",
  },
  "faraid.references.quran4176": { en: "Surah An-Nisa 4:176", ms: "Surah An-Nisa 4:176", id: "Surah An-Nisa 4:176" },
  "faraid.references.quran4176.text": { en: "They ask you for a ruling. Say, 'Allah gives you a ruling concerning one who dies without children [kalalah]: If a man dies, leaving no child but a sister, she will have half of what he left. And he inherits from her if she has no child. But if there are two sisters, they will have two-thirds of what he left. If there are brothers and sisters, the male will have the share of two females…'", ms: "Mereka meminta fatwa kepadamu (tentang kalalah). Katakanlah, 'Allah memberi fatwa kepadamu tentang kalalah, yaitu jika seseorang meninggal dunia, dan dia tidak mempunyai anak tetapi mempunyai saudara perempuan, maka bagiannya (saudara perempuannya itu) seperdua daripada harta yang ditinggalkannya, dan saudaranya yang lelaki mewarisi (seluruh harta saudara perempuan), jika dia tidak mempunyai anak. Tetapi jika saudara perempuan itu dua orang, maka bagi keduanya dua pertiga daripada harta yang ditinggalkan. Dan jika mereka (ahli waris itu terdiri daripada) saudara-saudara lelaki dan perempuan, maka bahagian seorang saudara lelaki sama dengan bahagian dua orang saudara perempuan…'", id: "Mereka meminta fatwa kepadamu (tentang kalalah). Katakanlah, 'Allah memberi fatwa kepadamu tentang kalalah, yaitu jika seseorang meninggal dunia, dan dia tidak mempunyai anak tetapi mempunyai saudara perempuan, maka bagiannya (saudara perempuannya itu) seperdua dari harta yang ditinggalkannya, dan saudaranya yang laki-laki mewarisi (seluruh harta saudara perempuan), jika dia tidak mempunyai anak. Tetapi jika saudara perempuan itu dua orang, maka bagi keduanya dua pertiga dari harta yang ditinggalkan. Dan jika mereka (ahli waris itu terdiri dari) saudara-saudara laki-laki dan perempuan, maka bagian seorang saudara laki-laki sama dengan bagian dua orang saudara perempuan…'",
  },
  "faraid.references.hadith": { en: "Hadith — Ibn Majah 2719", ms: "Hadis — Ibnu Majah 2719", id: "Hadis — Ibnu Majah 2719" },
  "faraid.references.hadith.text": { en: "\"Learn the rules of inheritance and teach them to the people, for it is half of knowledge, and it is the first thing to be forgotten and the first thing to be taken away from my nation.\" — Prophet Muhammad ﷺ (Ibn Majah 2719)", ms: "\"Pelajarilah ilmu faraid dan ajarkan kepada manusia, karena ia adalah setengah daripada ilmu pengetahuan, dan ia adalah ilmu yang pertama kali dilupakan dan pertama kali dicabut daripada umatku.\" — Nabi Muhammad ﷺ (Ibnu Majah 2719)", id: "\"Pelajarilah ilmu faraid dan ajarkan kepada manusia, karena ia adalah setengah dari ilmu pengetahuan, dan ia adalah ilmu yang pertama kali dilupakan dan pertama kali dicabut dari umatku.\" — Nabi Muhammad ﷺ (Ibnu Majah 2719)",
  },

  // ── Faraid Tooltips ──
  "tooltip.numberOfWives": { en: "Islam permits up to 4 wives. If multiple wives exist, they share the wife's portion equally (1/4 or 1/8 split between them).", ms: "Islam mengizinkan hingga 4 isteri. Jika ada beberapa isteri, mereka berbagi bahagian isteri secara merata (1/4 atau 1/8 dibahagikan di antara mereka).", id: "Islam mengizinkan hingga 4 istri. Jika ada beberapa istri, mereka berbagi bagian istri secara merata (1/4 atau 1/8 dibagi di antara mereka).",
  },
  "tooltip.grandfather": { en: "The paternal grandfather (father's father) inherits in the same position as the father, but only if the father is not alive. He is blocked (hajb) by the father.", ms: "Datuk daripada pihak bapa mewarisi dalam posisi yang sama dengan bapa, tetapi hanya jika bapa tidak hidup. Ia terhalang (hajb) oleh bapa.", id: "Kakek dari pihak ayah mewarisi dalam posisi yang sama dengan ayah, tetapi hanya jika ayah tidak hidup. Ia terhalang (hajb) oleh ayah.",
  },
  "tooltip.fullBrothers": { en: "Full brothers (same father and mother) are residuary heirs (asabah). They are blocked by the father, paternal grandfather, or sons of the deceased.", ms: "Saudara lelaki kandung (bapa dan ibu sama) adalah ahli waris asabah. Mereka terhalang oleh bapa, kakek daripada pihak bapa, atau anak lelaki almarhum.", id: "Saudara laki-laki kandung (ayah dan ibu sama) adalah ahli waris asabah. Mereka terhalang oleh ayah, kakek dari pihak ayah, atau anak laki-laki almarhum.",
  },
  "tooltip.fullSisters": { en: "Full sisters (same father and mother). One sister gets 1/2; two or more share 2/3. When a full brother is present, they become asabah (2:1 ratio). Blocked by father, grandfather, or sons.", ms: "Saudara perempuan kandung (bapa dan ibu sama). Satu saudara perempuan mendapat 1/2; dua atau lebih berbagi 2/3. Jika ada saudara lelaki, mereka menjadi asabah (2:1). Terhalang oleh bapa, kakek, atau anak lelaki.", id: "Saudara perempuan kandung (ayah dan ibu sama). Satu saudara perempuan mendapat 1/2; dua atau lebih berbagi 2/3. Jika ada saudara laki-laki, mereka menjadi asabah (2:1). Terhalang oleh ayah, kakek, atau anak laki-laki.",
  },
  "tooltip.faraid": { en: "Faraid is the Islamic law of inheritance that determines how a deceased person's estate is distributed among heirs according to the Quran and Sunnah.", ms: "Faraid adalah hukum waris Islam yang menentukan bagaimana harta seseorang yang meninggal dibahagikan kepada ahli waris sepadan Al-Quran dan Sunnah.", id: "Faraid adalah hukum waris Islam yang menentukan bagaimana harta seseorang yang meninggal dibagikan kepada ahli waris sesuai Al-Quran dan Sunnah.",
  },
  "tooltip.wasiyyah": { en: "Wasiyyah (bequest/will) is a voluntary gift from the estate, limited to a maximum of 1/3 of the net estate after debts. It cannot be given to legal heirs.", ms: "Wasiat adalah hibah sukarela daripada harta, dibatasi maksimal 1/3 daripada harta bersih selepas hutang. Tidak boleh diberikan kepada ahli waris yang sah.", id: "Wasiat adalah hibah sukarela dari harta, dibatasi maksimal 1/3 dari harta bersih setelah utang. Tidak boleh diberikan kepada ahli waris yang sah.",
  },
  "tooltip.totalEstate": { en: "The total value of all assets owned by the deceased, including property, savings, investments, and personal belongings.", ms: "Total nilai seluruh aset milik almarhum, termasuk properti, simpanan, pelaburan, dan barang pribadi.", id: "Total nilai seluruh aset milik almarhum, termasuk properti, tabungan, investasi, dan barang pribadi.",
  },
  "tooltip.debts": { en: "All outstanding debts and funeral/burial expenses that must be settled before inheritance distribution.", ms: "Semua hutang yang belum dibayar dan kos pengebumian yang perlu diselesaikan sebelum pembahagian warisan.", id: "Semua utang yang belum dibayar dan biaya pemakaman yang harus diselesaikan sebelum pembagian warisan.",
  },
  "tooltip.asabah": { en: "Asabah (residuary heir) receives the remaining estate after fixed-share heirs take their portions. Sons are asabah — they receive what's left.", ms: "Asabah (ahli waris sisa) menerima sisa harta selepas ahli waris bahagian tetap mengambil bagiannya. Anak lelaki adalah asabah.", id: "Asabah (ahli waris sisa) menerima sisa harta setelah ahli waris bagian tetap mengambil bagiannya. Anak laki-laki adalah asabah.",
  },
  "tooltip.fixedShare": { en: "Fixed share (fard) heirs receive a predetermined fraction of the estate as specified in the Quran (e.g. 1/2, 1/4, 1/6, 1/3, 1/8, 2/3).", ms: "Ahli waris bahagian tetap (fard) menerima pecahan yang telah ditentukan sepadan Al-Quran (mis. 1/2, 1/4, 1/6, 1/3, 1/8, 2/3).", id: "Ahli waris bagian tetap (fard) menerima pecahan yang telah ditentukan sesuai Al-Quran (mis. 1/2, 1/4, 1/6, 1/3, 1/8, 2/3).",
  },
  "tooltip.husband": { en: "The husband receives 1/4 of the estate if the wife has children, or 1/2 if she has no children.", ms: "Suami menerima 1/4 harta jika isteri memiliki anak, atau 1/2 jika tidak memiliki anak.", id: "Suami menerima 1/4 harta jika istri memiliki anak, atau 1/2 jika tidak memiliki anak.",
  },
  "tooltip.wife": { en: "The wife receives 1/8 of the estate if the husband has children, or 1/4 if he has no children.", ms: "Isteri menerima 1/8 harta jika suami memiliki anak, atau 1/4 jika tidak memiliki anak.", id: "Istri menerima 1/8 harta jika suami memiliki anak, atau 1/4 jika tidak memiliki anak.",
  },
  "tooltip.father": { en: "The father receives 1/6 as a fixed share if the deceased has children. If no children, he becomes asabah (residuary heir).", ms: "Bapa menerima 1/6 sebagai bahagian tetap jika almarhum memiliki anak. Jika tiada anak, dia menjadi asabah (ahli waris sisa).", id: "Ayah menerima 1/6 sebagai bagian tetap jika almarhum memiliki anak. Jika tidak ada anak, dia menjadi asabah (ahli waris sisa).",
  },
  "tooltip.mother": { en: "The mother receives 1/6 if the deceased has children, or 1/3 if there are no children.", ms: "Ibu menerima 1/6 jika almarhum memiliki anak, atau 1/3 jika tiada anak.", id: "Ibu menerima 1/6 jika almarhum memiliki anak, atau 1/3 jika tidak ada anak.",
  },
  "tooltip.sons": { en: "Sons are asabah (residuary heirs) who receive the remaining estate. A son's share is twice that of a daughter when both are present.", ms: "Anak lelaki adalah asabah yang menerima sisa harta. Bahagian anak lelaki dua kali bahagian anak perempuan jika keduanya ada.", id: "Anak laki-laki adalah asabah yang menerima sisa harta. Bagian anak laki-laki dua kali bagian anak perempuan jika keduanya ada.",
  },
  "tooltip.daughters": { en: "One daughter receives 1/2 of the estate; two or more daughters share 2/3. When sons are present, daughters become asabah (son gets 2x daughter's share).", ms: "Satu anak perempuan menerima 1/2 harta; dua atau lebih berbagi 2/3. Jika ada anak lelaki, anak perempuan menjadi asabah (lelaki mendapat 2x bahagian perempuan).", id: "Satu anak perempuan menerima 1/2 harta; dua atau lebih berbagi 2/3. Jika ada anak laki-laki, anak perempuan menjadi asabah (laki-laki mendapat 2x bagian perempuan).",
  },
  "tooltip.paternalGrandmother": { en: "Paternal Grandmother (father's mother). Gets 1/6 fixed share, shared equally with maternal grandmother if both are present. Blocked by the mother, father, or paternal grandfather.", ms: "Nenek daripada pihak bapa (ibu daripada bapa). Mendapat 1/6 bahagian tetap, dibahagikan rata dengan nenek daripada ibu jika keduanya ada. Terhalang oleh ibu, bapa, atau kakek daripada bapa.", id: "Nenek dari pihak ayah (ibu dari ayah). Mendapat 1/6 bagian tetap, dibagi rata dengan nenek dari ibu jika keduanya ada. Terhalang oleh ibu, ayah, atau kakek dari ayah.",
  },
  "tooltip.maternalGrandmother": { en: "Maternal Grandmother (mother's mother). Gets 1/6 fixed share, shared equally with paternal grandmother if both are present. Blocked only by the mother.", ms: "Nenek daripada pihak ibu (ibu daripada ibu). Mendapat 1/6 bahagian tetap, dibahagikan rata dengan nenek daripada bapa jika keduanya ada. Hanya terhalang oleh ibu.", id: "Nenek dari pihak ibu (ibu dari ibu). Mendapat 1/6 bagian tetap, dibagi rata dengan nenek dari ayah jika keduanya ada. Hanya terhalang oleh ibu.",
  },
  "tooltip.grandsons": { en: "Grandsons (son's sons) are residuary heirs (asabah) taking the place of sons. Blocked by direct sons. When granddaughters are also present, grandsons receive twice their share (2:1 ratio).", ms: "Cucu lelaki (daripada anak lelaki) adalah ahli waris asabah. Terhalang oleh anak lelaki. Jika ada cucu perempuan, cucu lelaki mendapat 2x bahagian (rasio 2:1).", id: "Cucu laki-laki (dari anak laki-laki) adalah ahli waris asabah. Terhalang oleh anak laki-laki. Jika ada cucu perempuan, cucu laki-laki mendapat 2x bagian (rasio 2:1).",
  },
  "tooltip.granddaughters": { en: "Granddaughters (son's daughters). Get 1/2 (one alone), 2/3 (two or more), or 1/6 complementary share when one daughter exists. Blocked by sons, or 2+ daughters (unless grandsons are present).", ms: "Cucu perempuan (daripada anak lelaki). Mendapat 1/2 (seorang), 2/3 (dua atau lebih), atau 1/6 pelengkap jika ada satu anak perempuan. Terhalang oleh anak lelaki atau 2+ anak perempuan tanpa cucu lelaki.", id: "Cucu perempuan (dari anak laki-laki). Mendapat 1/2 (seorang), 2/3 (dua atau lebih), atau 1/6 pelengkap jika ada satu anak perempuan. Terhalang oleh anak laki-laki atau 2+ anak perempuan tanpa cucu laki-laki.",
  },
  "tooltip.paternalBrothers": { en: "Paternal Brothers (half-siblings, same father different mother). Residuary heirs (asabah). Blocked by father, grandfather, sons, grandsons, or full brothers.", ms: "Saudara lelaki sebapa (bapa sama, ibu berbeda). Ahli waris asabah. Terhalang oleh bapa, kakek, anak lelaki, cucu lelaki, atau saudara kandung lelaki.", id: "Saudara laki-laki seayah (ayah sama, ibu berbeda). Ahli waris asabah. Terhalang oleh ayah, kakek, anak laki-laki, cucu laki-laki, atau saudara kandung laki-laki.",
  },
  "tooltip.paternalSisters": { en: "Paternal Sisters (half-siblings, same father different mother). Get 1/2 (one), 2/3 (two+), or 1/6 alongside one full sister. Become asabah when a paternal brother is present. Blocked by father, grandfather, sons, grandsons, full brothers.", ms: "Saudara perempuan sebapa. Mendapat 1/2 (seorang), 2/3 (dua+), atau 1/6 jika ada satu saudara kandung perempuan. Menjadi asabah jika ada saudara lelaki sebapa. Terhalang oleh bapa, kakek, anak/cucu lelaki, saudara kandung lelaki.", id: "Saudara perempuan seayah. Mendapat 1/2 (seorang), 2/3 (dua+), atau 1/6 jika ada satu saudara kandung perempuan. Menjadi asabah jika ada saudara laki-laki seayah. Terhalang oleh ayah, kakek, anak/cucu laki-laki, saudara kandung laki-laki.",
  },
  "tooltip.maternalBrothers": { en: "Maternal Brothers (uterine, same mother different father). Fixed share: 1/6 for one, 1/3 shared equally among all maternal siblings (brothers and sisters together). Blocked by any children or grandchildren, father, or grandfather.", ms: "Saudara lelaki seibu (ibu sama, bapa berbeda). Bahagian tetap: 1/6 untuk satu orang, 1/3 dibahagikan rata semua saudara seibu (laki dan perempuan bersama). Terhalang oleh anak/cucu (laki/perempuan), bapa, atau kakek.", id: "Saudara laki-laki seibu (ibu sama, ayah berbeda). Bagian tetap: 1/6 untuk satu orang, 1/3 dibagi rata semua saudara seibu (laki dan perempuan bersama). Terhalang oleh anak/cucu (laki/perempuan), ayah, atau kakek.",
  },
  "tooltip.maternalSisters": { en: "Maternal Sisters (uterine, same mother different father). Same shares as maternal brothers — together they share 1/6 (one total sibling) or 1/3 (two or more total). Blocked by any children or grandchildren, father, or grandfather.", ms: "Saudara perempuan seibu. Bahagian sama dengan saudara lelaki seibu — bersama mereka berbagi 1/6 (satu orang total) atau 1/3 (dua atau lebih). Terhalang oleh anak/cucu (laki/perempuan), bapa, atau kakek.", id: "Saudara perempuan seibu. Bagian sama dengan saudara laki-laki seibu — bersama mereka berbagi 1/6 (satu orang total) atau 1/3 (dua atau lebih). Terhalang oleh anak/cucu (laki/perempuan), ayah, atau kakek.",
  },
  "tooltip.consanguineMale": { en: "Consanguine Agnate Relative (e.g. paternal uncle, son of paternal uncle). Inherits the residual estate after all closer heirs. Blocked by all brothers and paternal brothers.", ms: "Kerabat asabah jauh (mis. paman daripada bapa, anak paman daripada bapa). Mewarisi sisa harta selepas semua ahli waris lebih dekat. Terhalang oleh semua saudara lelaki.", id: "Kerabat asabah jauh (mis. paman dari ayah, anak paman dari ayah). Mewarisi sisa harta setelah semua ahli waris lebih dekat. Terhalang oleh semua saudara laki-laki.",
  },

  // ── Validation Messages ──
  "validation.required": { en: "This field is required", ms: "Kolom ini wajib diisi", id: "Kolom ini wajib diisi" },
  "validation.positiveNumber": { en: "Must be a positive number", ms: "Perlu berupa angka positif", id: "Harus berupa angka positif" },
  "validation.invalidNumber": { en: "Invalid number format", ms: "Format angka tidak valid", id: "Format angka tidak valid" },
  "validation.noHeirs": { en: "Please select at least one heir", ms: "Silakan pilih minimal satu ahli waris", id: "Silakan pilih minimal satu ahli waris" },
  "validation.wasiyyahExceeds": { en: "Wasiyyah cannot exceed 1/3 of estate after debts", ms: "Wasiat tidak boleh melebihi 1/3 harta selepas hutang", id: "Wasiat tidak boleh melebihi 1/3 harta setelah utang",
  },
  "validation.debtsExceedEstate": { en: "Debts and expenses exceed the total estate value", ms: "Hutang dan kos melebihi total nilai harta", id: "Utang dan biaya melebihi total nilai harta",
  },
  "validation.wivesMax": { en: "Maximum 4 wives permitted in Islam", ms: "Maksimal 4 isteri diperbolehkan dalam Islam", id: "Maksimal 4 istri diperbolehkan dalam Islam" },

  // ── Wasiat Guide ──
  "wasiat.title": { en: "Wasiat (Islamic Will) Guide", ms: "Panduan Wasiat Islam", id: "Panduan Wasiat Islam" },
  "wasiat.disclaimer": { en: "This guide is for educational purposes only. Consult a qualified solicitor or Islamic estate planner for a legally binding will.", ms: "Panduan ini hanya untuk tujuan pendidikan. Rujuk dengan pengacara atau perencana warisan Islam untuk wasiat yang sah secara hukum.", id: "Panduan ini hanya untuk tujuan edukasi. Konsultasikan dengan pengacara atau perencana warisan Islam untuk wasiat yang sah secara hukum." },
  "wasiat.step1.label": { en: "Step 1", ms: "Langkah 1", id: "Langkah 1" },
  "wasiat.step2.label": { en: "Step 2", ms: "Langkah 2", id: "Langkah 2" },
  "wasiat.step3.label": { en: "Step 3", ms: "Langkah 3", id: "Langkah 3" },
  "wasiat.step1.title": { en: "Eligibility & Introduction", ms: "Kelayakan & Pengantar", id: "Kelayakan & Pengantar" },
  "wasiat.step2.title": { en: "Bequest Planner", ms: "Perencana Wasiat", id: "Perencana Wasiat" },
  "wasiat.step3.title": { en: "Summary & Checklist", ms: "Ringkasan & Daftar Periksa", id: "Ringkasan & Daftar Periksa" },
  "wasiat.intro.what": { en: "What is a Wasiat?", ms: "Apa itu Wasiat?", id: "Apa itu Wasiat?" },
  "wasiat.intro.text": { en: "A Wasiat (Arabic: وصية) is an Islamic will — a document where a Muslim declares how up to one-third of their estate should be distributed to non-Faraid beneficiaries, charitable causes, or specific purposes after death. The remaining two-thirds are distributed to legal heirs according to Faraid (Islamic inheritance law).", ms: "Wasiat (Arab: وصية) adalah surat wasiat Islam — dokumen di mana seorang Muslim menyatakan bagaimana hingga sepertiga hartanya perlu dibahagikan kepada penerima non-Faraid, tujuan amal, atau keperluan tertentu selepas meninggal. Dua pertiga sisanya dibahagikan kepada ahli waris sepadan Faraid (hukum waris Islam).", id: "Wasiat (Arab: وصية) adalah surat wasiat Islam — dokumen di mana seorang Muslim menyatakan bagaimana hingga sepertiga hartanya harus dibagikan kepada penerima non-Faraid, tujuan amal, atau keperluan tertentu setelah meninggal. Dua pertiga sisanya dibagikan kepada ahli waris sesuai Faraid (hukum waris Islam)." },
  "wasiat.eligibility.title": { en: "Eligibility Checklist", ms: "Daftar Periksa Kelayakan", id: "Daftar Periksa Kelayakan" },
  "wasiat.eligibility.muslim": { en: "Muslim (Shahada confirmed)", ms: "Muslim (Syahadat terkonfirmasi)", id: "Muslim (Syahadat terkonfirmasi)" },
  "wasiat.eligibility.sane": { en: "Of sound mind (berakal)", ms: "Berakal sehat", id: "Berakal sehat" },
  "wasiat.eligibility.adult": { en: "Adult — 18 years or older", ms: "Dewasa — 18 tahun atau lebih", id: "Dewasa — 18 tahun atau lebih" },
  "wasiat.rules.title": { en: "Key Rules", ms: "Peraturan Utama", id: "Aturan Utama" },
  "wasiat.rules.onethird": { en: "Maximum 1/3 of estate to non-Faraid heirs or charities", ms: "Maksimal 1/3 harta kepada penerima non-Faraid atau badan amal", id: "Maksimal 1/3 harta kepada penerima non-Faraid atau badan amal" },
  "wasiat.rules.nolegalheir": { en: "Cannot bequeath to legal Faraid heirs (they receive via Faraid)", ms: "Tidak boleh berwasiat kepada ahli waris Faraid (mereka menerima melalui Faraid)", id: "Tidak boleh berwasiat kepada ahli waris Faraid (mereka menerima melalui Faraid)" },
  "wasiat.rules.charitable": { en: "Charitable bequests (sadaqah, waqf) are strongly encouraged", ms: "Wasiat amal (sedekah, wakaf) sangat dianjurkan", id: "Wasiat amal (sedekah, wakaf) sangat dianjurkan" },
  "wasiat.next": { en: "Continue", ms: "Lanjutkan", id: "Lanjutkan" },
  "wasiat.back": { en: "Back", ms: "Kembali", id: "Kembali" },
  "wasiat.form.testator.title": { en: "Testator Details", ms: "Terperinci Pembuat Wasiat", id: "Detail Pembuat Wasiat" },
  "wasiat.form.fullname": { en: "Full Name", ms: "Nama Lengkap", id: "Nama Lengkap" },
  "wasiat.form.fullname.placeholder": { en: "e.g. Ahmad bin Abdullah", ms: "mis. Ahmad bin Abdullah", id: "mis. Ahmad bin Abdullah" },
  "wasiat.form.ic": { en: "IC / Passport Number", ms: "No. KTP / Paspor", id: "No. KTP / Paspor" },
  "wasiat.form.ic.placeholder": { en: "e.g. 800101-14-5678", ms: "mis. 800101-14-5678", id: "mis. 800101-14-5678" },
  "wasiat.form.date": { en: "Date of Wasiat Declaration", ms: "Tanggal Pernyataan Wasiat", id: "Tanggal Pernyataan Wasiat" },
  "wasiat.form.estate.title": { en: "Estate Details", ms: "Terperinci Harta", id: "Detail Harta" },
  "wasiat.form.estateValue": { en: "Total Estimated Estate Value", ms: "Perkiraan Total Nilai Harta", id: "Perkiraan Total Nilai Harta" },
  "wasiat.form.bequests.title": { en: "Bequests", ms: "Daftar Wasiat", id: "Daftar Wasiat" },
  "wasiat.form.bequests.add": { en: "Add Bequest", ms: "Tambah Wasiat", id: "Tambah Wasiat" },
  "wasiat.form.bequests.remove": { en: "Remove", ms: "Padam", id: "Hapus" },
  "wasiat.form.bequests.recipient": { en: "Recipient Name", ms: "Nama Penerima", id: "Nama Penerima" },
  "wasiat.form.bequests.relationship": { en: "Relationship", ms: "Hubungan", id: "Hubungan" },
  "wasiat.form.bequests.type": { en: "Type", ms: "Jenis", id: "Jenis" },
  "wasiat.form.bequests.amount": { en: "Amount", ms: "Jumlah", id: "Jumlah" },
  "wasiat.form.bequests.type.cash": { en: "Cash", ms: "Tunai", id: "Tunai" },
  "wasiat.form.bequests.type.asset": { en: "Asset", ms: "Aset", id: "Aset" },
  "wasiat.form.bequests.type.percentage": { en: "Percentage (%)", ms: "Persentase (%)", id: "Persentase (%)" },
  "wasiat.form.bequests.warning": { en: "Total bequests exceed 1/3 of estate. Reduce to comply with Islamic law.", ms: "Total wasiat melebihi 1/3 harta. Kurangi agar sepadan hukum Islam.", id: "Total wasiat melebihi 1/3 harta. Kurangi agar sesuai hukum Islam." },
  "wasiat.form.bequests.empty": { en: "No bequests added yet. Click 'Add Bequest' to start.", ms: "Tiada wasiat. Klik 'Tambah Wasiat' untuk memulai.", id: "Belum ada wasiat. Klik 'Tambah Wasiat' untuk memulai." },
  "wasiat.form.specialWishes": { en: "Special Wishes / Instructions", ms: "Wasiat Khusus / Instruksi", id: "Wasiat Khusus / Instruksi" },
  "wasiat.form.specialWishes.placeholder": { en: "e.g. Donate 10% to mosque building fund, care instructions for dependants…", ms: "mis. Donasikan 10% untuk dana pembangunan masjid, instruksi perawatan tanggungan…", id: "mis. Donasikan 10% untuk dana pembangunan masjid, instruksi perawatan tanggungan…" },
  "wasiat.summary.title": { en: "Your Wasiat Summary", ms: "Ringkasan Wasiat Anda", id: "Ringkasan Wasiat Anda" },
  "wasiat.summary.testator": { en: "Testator", ms: "Pembuat Wasiat", id: "Pembuat Wasiat" },
  "wasiat.summary.date": { en: "Date", ms: "Tanggal", id: "Tanggal" },
  "wasiat.summary.estate": { en: "Estimated Estate", ms: "Perkiraan Harta", id: "Perkiraan Harta" },
  "wasiat.summary.bequests": { en: "Bequests", ms: "Wasiat", id: "Wasiat" },
  "wasiat.summary.faraid": { en: "Remainder distributed via Faraid to legal heirs", ms: "Sisa dibahagikan melalui Faraid kepada ahli waris", id: "Sisa dibagikan melalui Faraid kepada ahli waris" },
  "wasiat.summary.specialWishes": { en: "Special Wishes", ms: "Wasiat Khusus", id: "Wasiat Khusus" },
  "wasiat.summary.none": { en: "None", ms: "Tiada", id: "Tidak ada" },
  "wasiat.lawyer.title": { en: "Lawyer & Registration Checklist", ms: "Daftar Periksa Notaris & Pendaftaran", id: "Daftar Periksa Notaris & Pendaftaran" },
  "wasiat.lawyer.witnesses": { en: "Sign in the presence of 2 adult Muslim witnesses", ms: "Tanda tangan di hadapan 2 saksi Muslim dewasa", id: "Tanda tangan di hadapan 2 saksi Muslim dewasa" },
  "wasiat.lawyer.solicitor": { en: "Sign in front of a licensed solicitor / notary public", ms: "Tanda tangan di hadapan pengacara / notaris berlisensi", id: "Tanda tangan di hadapan pengacara / notaris berlisensi" },
  "wasiat.lawyer.register": { en: "Register with a will registry or relevant authority in your jurisdiction", ms: "Daftarkan ke lembaga pendaftaran wasiat atau otoritas terkait di yurisdiksi Anda", id: "Daftarkan ke lembaga pendaftaran wasiat atau otoritas terkait di yurisdiksi Anda" },
  "wasiat.lawyer.copy": { en: "Keep one copy with your executor and one with your solicitor", ms: "Simpan satu salinan dengan eksekutor dan satu dengan pengacara Anda", id: "Simpan satu salinan dengan eksekutor dan satu dengan pengacara Anda" },
  "wasiat.print": { en: "Print / Save PDF", ms: "Cetak / Simpan PDF", id: "Cetak / Simpan PDF" },
  "wasiat.backToFaraid": { en: "Back to Faraid Calculator", ms: "Kembali ke Kalkulator Faraid", id: "Kembali ke Kalkulator Faraid" },
  "wasiat.planCTA": { en: "Plan your Wasiat →", ms: "Rencanakan Wasiat →", id: "Rencanakan Wasiat →" },
  "wasiat.validation.name": { en: "Full name is required", ms: "Nama lengkap wajib diisi", id: "Nama lengkap wajib diisi" },
  "wasiat.validation.estate": { en: "Estate value must be a positive number", ms: "Nilai harta perlu berupa angka positif", id: "Nilai harta harus berupa angka positif" },

  // ── Zakat Calculator ──
  "zakat.title": { en: "Zakat Calculator", ms: "Kalkulator Zakat", id: "Kalkulator Zakat" },
  "zakat.subtitle": { en: "Calculate your annual Zakat obligation based on Quran and Sunnah.", ms: "Kira kewajiban Zakat tahunan Anda berdasarkan Al-Quran dan Sunnah.", id: "Hitung kewajiban Zakat tahunan Anda berdasarkan Al-Quran dan Sunnah." },
  "zakat.disclaimer.title": { en: "Educational Tool", ms: "Alat Pendidikan", id: "Alat Edukasi" },
  "zakat.disclaimer.text": { en: "This calculator provides an estimate based on mainstream Islamic jurisprudence. Consult a qualified Islamic scholar or zakat institution for official assessment.", ms: "Kalkulator ini memberikan anggaran berdasarkan fiqh Islam yang muktabar. Rujuk dengan ulama atau lembaga zakat resmi untuk penilaian resmi.", id: "Kalkulator ini memberikan estimasi berdasarkan fikih Islam yang muktabar. Konsultasikan dengan ulama atau lembaga zakat resmi untuk penilaian resmi." },
  "zakat.currency": { en: "Currency", ms: "Mata Wang", id: "Mata Uang" },
  "zakat.silverPrice.label": { en: "Silver Price / gram (for Nisab)", ms: "Harga Perak / gram (untuk Nisab)", id: "Harga Perak / gram (untuk Nisab)" },
  "zakat.silverPrice.help": { en: "Current market silver price per gram. Used to calculate the Nisab threshold (595g silver).", ms: "Harga perak pasar kini per gram. Digunakan untuk mengira batas Nisab (595g perak).", id: "Harga perak pasar saat ini per gram. Digunakan untuk menghitung batas Nisab (595g perak)." },
  "zakat.hawl.label": { en: "Hawl completed (held ≥ 1 lunar year)", ms: "Hawl terpenuhi (dimiliki ≥ 1 tahun hijriyah)", id: "Hawl terpenuhi (dimiliki ≥ 1 tahun hijriyah)" },
  "zakat.hawl.help": { en: "Hawl is the condition that wealth must have been held for one complete lunar year before Zakat is due. Uncheck if you haven't held these assets for a full year.", ms: "Hawl adalah syarat bahwa kekayaan perlu dimiliki selama satu tahun hijriyah penuh sebelum Zakat wajib. Kosongkan jika Anda belum memegang aset ini selama setahun penuh.", id: "Hawl adalah syarat bahwa kekayaan harus dimiliki selama satu tahun hijriyah penuh sebelum Zakat wajib. Kosongkan jika Anda belum memegang aset ini selama setahun penuh." },
  "zakat.category.cashSavings": { en: "Cash & Savings", ms: "Tunai & Simpanan", id: "Tunai & Tabungan" },
  "zakat.category.goldSilver": { en: "Gold & Silver", ms: "Emas & Perak", id: "Emas & Perak" },
  "zakat.category.investments": { en: "Investments", ms: "Pelaburan", id: "Investasi" },
  "zakat.category.business": { en: "Business Assets", ms: "Aset Perniagaan", id: "Aset Bisnis" },
  "zakat.category.rental": { en: "Rental Income", ms: "Pendapatan Sewa", id: "Pendapatan Sewa" },
  "zakat.cash.onHand": { en: "Cash on Hand", ms: "Uang Tunai", id: "Uang Tunai" },
  "zakat.cash.onHand.help": { en: "Physical cash you currently hold at home or in wallet", ms: "Uang tunai yang Anda pegang kini di rumah atau dompet", id: "Uang tunai yang Anda pegang saat ini di rumah atau dompet" },
  "zakat.cash.bankSavings": { en: "Bank Savings", ms: "Simpanan Bank", id: "Tabungan Bank" },
  "zakat.cash.bankSavings.help": { en: "Total balance across all savings and current accounts", ms: "Total saldo di semua rekening simpanan dan giro", id: "Total saldo di semua rekening tabungan dan giro" },
  "zakat.cash.fixedDeposits": { en: "Fixed / Time Deposits", ms: "Deposito Berjangka", id: "Deposito Berjangka" },
  "zakat.cash.fixedDeposits.help": { en: "Principal plus accrued profit or interest on all term deposits", ms: "Pokok ditambah keuntungan atau bunga yang terakumulasi pada semua deposito", id: "Pokok ditambah keuntungan atau bunga yang terakumulasi pada semua deposito" },
  "zakat.cash.epf": { en: "Include EPF / Provident Fund (Debated)", ms: "Sertakan KWSP / Dana Pensiun (Diperdebatkan)", id: "Sertakan KWSP / Dana Pensiun (Diperdebatkan)" },
  "zakat.cash.epf.help": { en: "Scholarly debate exists on EPF Zakat. Many contemporary scholars require 2.5% on voluntary contributions. Enable based on your followed opinion.", ms: "Ada perbedaan pendapat ulama tentang Zakat KWSP. Banyak ulama kontemporer mewajibkan 2,5% atas iuran sukarela. Aktifkan sepadan pendapat yang Anda ikuti.", id: "Ada perbedaan pendapat ulama tentang Zakat KWSP. Banyak ulama kontemporer mewajibkan 2,5% atas iuran sukarela. Aktifkan sesuai pendapat yang Anda ikuti." },
  "zakat.cash.epfAmount": { en: "EPF / Provident Fund Balance", ms: "Saldo KWSP / Dana Pensiun", id: "Saldo KWSP / Dana Pensiun" },
  "zakat.gold.goldGrams": { en: "Gold Owned (grams)", ms: "Emas yang Dimiliki (gram)", id: "Emas yang Dimiliki (gram)" },
  "zakat.gold.goldGrams.help": { en: "Total weight of gold coins, bars, and jewellery you own", ms: "Total berat koin emas, batangan, dan perhiasan yang Anda miliki", id: "Total berat koin emas, batangan, dan perhiasan yang Anda miliki" },
  "zakat.gold.goldPrice": { en: "Gold Price per Gram", ms: "Harga Emas per Gram", id: "Harga Emas per Gram" },
  "zakat.gold.goldPrice.help": { en: "Current market gold price per gram in your selected currency", ms: "Harga emas pasar kini per gram dalam mata uang yang dipilih", id: "Harga emas pasar saat ini per gram dalam mata uang yang dipilih" },
  "zakat.gold.silverGrams": { en: "Silver Owned (grams)", ms: "Perak yang Dimiliki (gram)", id: "Perak yang Dimiliki (gram)" },
  "zakat.gold.silverGrams.help": { en: "Total weight of silver coins, bars, and jewellery you own", ms: "Total berat koin perak, batangan, dan perhiasan yang Anda miliki", id: "Total berat koin perak, batangan, dan perhiasan yang Anda miliki" },
  "zakat.gold.silverPrice": { en: "Silver Price per Gram", ms: "Harga Perak per Gram", id: "Harga Perak per Gram" },
  "zakat.gold.silverPrice.help": { en: "Current market silver price per gram. This value is also used to compute the Nisab threshold.", ms: "Harga perak pasar kini per gram. Nilai ini juga digunakan untuk mengira batas Nisab.", id: "Harga perak pasar saat ini per gram. Nilai ini juga digunakan untuk menghitung batas Nisab." },
  "zakat.gold.jewelry": { en: "Include Personal Jewellery", ms: "Sertakan Perhiasan Pribadi", id: "Sertakan Perhiasan Pribadi" },
  "zakat.gold.jewelry.help": { en: "Hanafi school: zakat applies to all gold and silver including jewellery worn personally. Shafi'i and Hanbali: personal-use jewellery is generally exempt. Toggle based on your madhab.", ms: "Mazhab Hanafi: zakat berlaku untuk semua emas dan perak termasuk perhiasan yang dipakai. Syafi'i dan Hanbali: perhiasan untuk dipakai umumnya dikecualikan. Aktifkan sepadan mazhab Anda.", id: "Mazhab Hanafi: zakat berlaku untuk semua emas dan perak termasuk perhiasan yang dipakai. Syafi'i dan Hanbali: perhiasan untuk dipakai umumnya dikecualikan. Aktifkan sesuai mazhab Anda." },
  "zakat.investments.stocks": { en: "Stocks / Shares (Market Value)", ms: "Saham (Nilai Pasar)", id: "Saham (Nilai Pasar)" },
  "zakat.investments.stocks.help": { en: "Current market value of all equity shareholdings", ms: "Nilai pasar kini daripada semua kepemilikan saham", id: "Nilai pasar saat ini dari semua kepemilikan saham" },
  "zakat.investments.unitTrusts": { en: "Unit Trusts / Mutual Funds", ms: "Unit Amanah / Reksa Dana", id: "Unit Amanah / Reksa Dana" },
  "zakat.investments.unitTrusts.help": { en: "Net Asset Value (NAV) of all unit trust and mutual fund holdings", ms: "Nilai Aset Bersih (NAB) daripada semua kepemilikan unit amanah dan reksa dana", id: "Nilai Aset Bersih (NAB) dari semua kepemilikan unit amanah dan reksa dana" },
  "zakat.investments.crypto": { en: "Include Cryptocurrency (Debated)", ms: "Sertakan Kripto (Diperdebatkan)", id: "Sertakan Kripto (Diperdebatkan)" },
  "zakat.investments.crypto.help": { en: "Cryptocurrency is subject to active scholarly debate. Some scholars treat it as a tradeable commodity subject to Zakat; others do not. Enable if you follow scholars who consider it zakatable.", ms: "Kripto masih aktif diperdebatkan ulama. Sebagian menganggapnya komoditas dagang yang wajib dizakatkan; sebagian tidak. Aktifkan jika Anda mengikuti ulama yang menganggapnya wajib zakat.", id: "Kripto masih aktif diperdebatkan ulama. Sebagian menganggapnya komoditas dagang yang wajib dizakatkan; sebagian tidak. Aktifkan jika Anda mengikuti ulama yang menganggapnya wajib zakat." },
  "zakat.investments.cryptoAmount": { en: "Crypto Portfolio Value", ms: "Nilai Portofolio Kripto", id: "Nilai Portofolio Kripto" },
  "zakat.business.inventory": { en: "Inventory / Stock-in-Trade", ms: "Inventaris / Stok Dagangan", id: "Inventaris / Stok Dagangan" },
  "zakat.business.inventory.help": { en: "Current market value of all goods and products held for sale", ms: "Nilai pasar kini daripada semua barang dan produk yang dijual", id: "Nilai pasar saat ini dari semua barang dan produk yang dijual" },
  "zakat.business.receivables": { en: "Trade Receivables", ms: "Piutang Dagang", id: "Piutang Dagang" },
  "zakat.business.receivables.help": { en: "Money owed to you by customers that is expected to be collected", ms: "Uang yang terutang kepada Anda oleh pelanggan yang diharapkan boleh ditagih", id: "Uang yang terutang kepada Anda oleh pelanggan yang diharapkan dapat ditagih" },
  "zakat.business.liabilities": { en: "Short-term Liabilities (deductible)", ms: "Kewajiban Tempoh Pendek (boleh dikurangi)", id: "Kewajiban Jangka Pendek (dapat dikurangi)" },
  "zakat.business.liabilities.help": { en: "Deduct trade payables, short-term loans, and debts due within the year from your zakatable business assets", ms: "Kurangi hutang dagang, pinjaman tempoh pendek, dan hutang yang jatuh tempo dalam setahun daripada aset perniagaan yang wajib dizakatkan", id: "Kurangi utang dagang, pinjaman jangka pendek, dan utang yang jatuh tempo dalam setahun dari aset bisnis yang wajib dizakatkan" },
  "zakat.rental.annualIncome": { en: "Annual Rental Income", ms: "Pendapatan Sewa Tahunan", id: "Pendapatan Sewa Tahunan" },
  "zakat.rental.annualIncome.help": { en: "Total rental income received or receivable during the year", ms: "Total pendapatan sewa yang diterima atau terutang selama setahun", id: "Total pendapatan sewa yang diterima atau terutang selama setahun" },
  "zakat.rental.expenses": { en: "Annual Expenses & Maintenance", ms: "Pengeluaran & Pemeliharaan Tahunan", id: "Pengeluaran & Pemeliharaan Tahunan" },
  "zakat.rental.expenses.help": { en: "Deduct maintenance costs, repairs, management fees, and financing installments", ms: "Kurangi kos pemeliharaan, perbaikan, kos pengelolaan, dan ansuran pembiayaan", id: "Kurangi biaya pemeliharaan, perbaikan, biaya pengelolaan, dan cicilan pembiayaan" },
  "zakat.summary.title": { en: "Zakat Summary", ms: "Ringkasan Zakat", id: "Ringkasan Zakat" },
  "zakat.summary.totalZakatable": { en: "Total Zakatable Assets", ms: "Total Aset Wajib Zakat", id: "Total Aset Wajib Zakat" },
  "zakat.summary.nisab": { en: "Nisab Threshold (595g silver)", ms: "Batas Nisab (595g perak)", id: "Batas Nisab (595g perak)" },
  "zakat.summary.zakatDue": { en: "Zakat Due (2.5%)", ms: "Zakat Terutang (2,5%)", id: "Zakat Terutang (2,5%)" },
  "zakat.summary.belowNisab": { en: "Below Nisab — No Zakat Due", ms: "Di Bawah Nisab — Tidak Wajib Zakat", id: "Di Bawah Nisab — Tidak Wajib Zakat" },
  "zakat.summary.aboveNisab": { en: "Alhamdulillah — Zakat is obligatory", ms: "Alhamdulillah — Zakat wajib ditunaikan", id: "Alhamdulillah — Zakat wajib ditunaikan" },
  "zakat.summary.closeToNisab": { en: "Close to Nisab — double-check your assets", ms: "Mendekati Nisab — periksa kembali aset Anda", id: "Mendekati Nisab — periksa kembali aset Anda" },
  "zakat.nisab.title": { en: "About Nisab & Hawl", ms: "Tentang Nisab & Hawl", id: "Tentang Nisab & Hawl" },
  "zakat.nisab.text": { en: "Nisab is the minimum wealth threshold above which Zakat becomes obligatory, equal to 595g of silver or 85g of gold (use the lower — silver is traditional). Hawl is the requirement that this wealth has been held for one complete lunar year.", ms: "Nisab adalah ambang batas kekayaan minimum yang mewajibkan Zakat, setara dengan 595g perak atau 85g emas (gunakan yang lebih rendah — perak secara tradisi). Hawl adalah syarat bahwa kekayaan ini telah dimiliki selama satu tahun hijriyah penuh.", id: "Nisab adalah ambang batas kekayaan minimum yang mewajibkan Zakat, setara dengan 595g perak atau 85g emas (gunakan yang lebih rendah — perak secara tradisi). Hawl adalah syarat bahwa kekayaan ini telah dimiliki selama satu tahun hijriyah penuh." },
  "zakat.reset": { en: "Reset All", ms: "Tetapkan Semula Semua", id: "Atur Ulang Semua" },
  "zakat.breakdown.cash": { en: "Cash & Savings", ms: "Tunai & Simpanan", id: "Tunai & Tabungan" },
  "zakat.breakdown.gold": { en: "Gold & Silver", ms: "Emas & Perak", id: "Emas & Perak" },
  "zakat.breakdown.invest": { en: "Investments", ms: "Pelaburan", id: "Investasi" },
  "zakat.breakdown.business": { en: "Business Assets", ms: "Aset Perniagaan", id: "Aset Bisnis" },
  "zakat.breakdown.rental": { en: "Rental Income", ms: "Pendapatan Sewa", id: "Pendapatan Sewa" },

  // ── Footer ──
  "footer.quickLinks": { en: "Quick Links", ms: "Tautan Pantas", id: "Tautan Cepat" },
  "footer.builtBy": { en: "Built by", ms: "Dibuat oleh", id: "Dibuat oleh" },
  "footer.privacy": { en: "Privacy", ms: "Privasi", id: "Privasi" },
  "footer.terms": { en: "Terms", ms: "Syarat", id: "Syarat" },

  // ── Brand ──
  "brand.tagline": { en: "Smart calculators for everyday decisions", ms: "Kalkulator cerdas untuk keputusan harian", id: "Kalkulator cerdas untuk keputusan sehari-hari" },

  // ── Nav extras ──
  "nav.salary": { en: "Salary", ms: "Gaji", id: "Gaji" },
  "nav.zakat": { en: "Zakat", ms: "Zakat", id: "Zakat" },

  // ── Tool names (for footer / other non-Home uses) ──
  "tools.normal-calculator.name": { en: "Basic Calculator", ms: "Kalkulator Asas", id: "Kalkulator Dasar" },
  "tools.normal-calculator.desc": {
    en: "Quick arithmetic for everyday calculations.",
    ms: "Aritmetik pantas untuk pengiraan harian.",
    id: "Aritmatika cepat untuk perhitungan sehari-hari.",
  },
  "tools.scientific-calculator.name": { en: "Scientific Calculator", ms: "Kalkulator Saintifik", id: "Kalkulator Ilmiah" },
  "tools.scientific-calculator.desc": {
    en: "Advanced functions including trigonometry, logs, and powers.",
    ms: "Fungsi lanjutan termasuk trigonometri, logaritma, dan pangkat.",
    id: "Fungsi lanjutan termasuk trigonometri, logaritma, dan pangkat.",
  },
  "tools.zakat-calculator.name": { en: "Zakat Calculator", ms: "Kalkulator Zakat", id: "Kalkulator Zakat" },
  "tools.zakat-calculator.desc": {
    en: "Estimate annual zakat obligation across major zakatable asset classes.",
    ms: "Anggarkan kewajipan zakat tahunan merentas kelas aset utama yang wajib dizakatkan.",
    id: "Estimasi kewajiban zakat tahunan untuk kelas aset utama yang wajib dizakati.",
  },
  "tools.wasiat-guide.name": { en: "Wasiat Guide", ms: "Panduan Wasiat", id: "Panduan Wasiat" },
  "tools.wasiat-guide.desc": {
    en: "Step-by-step Islamic will guidance with printable planning checklist.",
    ms: "Panduan wasiat Islam langkah demi langkah dengan senarai semak perancangan boleh cetak.",
    id: "Panduan wasiat Islam langkah demi langkah dengan checklist perencanaan yang bisa dicetak.",
  },

  // ── Calculator content section headings ──
  "content.workedExamples": {
    en: "Worked examples",
    ms: "Contoh pengiraan",
    id: "Contoh perhitungan",
  },
  "content.resultLabel": {
    en: "Result: ",
    ms: "Hasil: ",
    id: "Hasil: ",
  },
  "content.faqTitle": {
    en: "Frequently asked questions",
    ms: "Soalan lazim",
    id: "Pertanyaan yang sering diajukan",
  },
  "content.relatedTitle": {
    en: "Related calculators",
    ms: "Kalkulator berkaitan",
    id: "Kalkulator terkait",
  },
  "content.lastReviewed": {
    en: "Last reviewed: ",
    ms: "Disemak terakhir: ",
    id: "Terakhir ditinjau: ",
  },

  // ── Not Found ──
  "notFound.title": { en: "Page not found", ms: "Halaman tidak ditemukan", id: "Halaman tidak ditemukan" },
  "notFound.message": { en: "The page you're looking for doesn't exist.", ms: "Halaman yang Anda cari tiada.", id: "Halaman yang Anda cari tidak ada." },

  // ── Privacy Policy ──
  "privacy.title": { en: "Privacy Policy", ms: "Dasar Privasi", id: "Kebijakan Privasi" },
  "privacy.lastUpdated": { en: "Last updated: April 28, 2026", ms: "Terakhir dikemas kini: 28 April 2026", id: "Terakhir diperbarui: 28 April 2026" },
  "privacy.p1": { en: "ToolHub MY respects your privacy. Most calculator inputs are processed in your browser and are not sent to our servers.", ms: "ToolHub MY menghormati privasi Anda. Sebagian besar input kalkulator diproses di browser Anda dan tidak dikirim ke server kami.", id: "ToolHub MY menghormati privasi Anda. Sebagian besar input kalkulator diproses di browser Anda dan tidak dikirim ke server kami." },
  "privacy.p2": { en: "We may use analytics and advertising partners (including Google AdSense) that use cookies or similar technologies to measure usage and serve relevant ads.", ms: "Kami boleh menggunakan mitra analitik dan iklan (termasuk Google AdSense) yang menggunakan cookie atau teknologi serupa untuk mengukur penggunaan dan menyajikan iklan yang relevan.", id: "Kami dapat menggunakan mitra analitik dan iklan (termasuk Google AdSense) yang menggunakan cookie atau teknologi serupa untuk mengukur penggunaan dan menyajikan iklan yang relevan." },
  "privacy.p3": { en: "You can control cookies in your browser settings. By using this site, you consent to data practices described in this policy.", ms: "Anda boleh mengontrol cookie di tetapan browser Anda. Dengan menggunakan situs ini, Anda menyetujui praktik data yang dijelaskan dalam dasar ini.", id: "Anda dapat mengontrol cookie di pengaturan browser Anda. Dengan menggunakan situs ini, Anda menyetujui praktik data yang dijelaskan dalam kebijakan ini." },
  "privacy.contact.title": { en: "Contact", ms: "Kontak", id: "Kontak" },
  "privacy.contact.text": { en: "For privacy questions, contact", ms: "Untuk soalan privasi, hubungi", id: "Untuk pertanyaan privasi, hubungi" },

  // ── Terms of Use ──
  "terms.title": { en: "Terms of Use", ms: "Syarat Penggunaan", id: "Syarat Penggunaan" },
  "terms.lastUpdated": { en: "Last updated: April 28, 2026", ms: "Terakhir dikemas kini: 28 April 2026", id: "Terakhir diperbarui: 28 April 2026" },
  "terms.p1": { en: "ToolHub MY provides calculators and educational guides for informational purposes only. Results may not reflect legal, tax, or religious rulings for your specific case.", ms: "ToolHub MY menyediakan kalkulator dan panduan pendidikan hanya untuk tujuan informasi. Hasil mungkin tidak mencerminkan keputusan hukum, cukai, atau agama untuk kasus spesifik Anda.", id: "ToolHub MY menyediakan kalkulator dan panduan edukasi hanya untuk tujuan informasi. Hasil mungkin tidak mencerminkan keputusan hukum, pajak, atau agama untuk kasus spesifik Anda." },
  "terms.p2": { en: "You are responsible for verifying outcomes and seeking qualified professional advice where required.", ms: "Anda bertanggung jawab untuk memverifikasi hasil dan mencari saran profesional yang berkualifikasi jika diperlukan.", id: "Anda bertanggung jawab untuk memverifikasi hasil dan mencari saran profesional yang berkualifikasi jika diperlukan." },
  "terms.p3": { en: "We may update or discontinue tools at any time without notice. Continued use of this website means you accept these terms.", ms: "Kami boleh memperbarui atau menghentikan alat kapan sahaja tanpa pemberitahuan. Penggunaan lanjutan situs ini berarti Anda menerima syarat-syarat ini.", id: "Kami dapat memperbarui atau menghentikan alat kapan saja tanpa pemberitahuan. Penggunaan lanjutan situs ini berarti Anda menerima syarat-syarat ini." },
  "terms.contact.title": { en: "Contact", ms: "Kontak", id: "Kontak" },
  "terms.contact.text": { en: "For terms-related questions, visit", ms: "Untuk soalan terkait syarat, kunjungi", id: "Untuk pertanyaan terkait syarat, kunjungi" },

  // ── Salary Calculator ──
  "salary.badge": { en: "Malaysia payroll estimator", ms: "Estimator gaji Malaysia", id: "Estimator gaji Malaysia" },
  "salary.title": { en: "Malaysia Salary Calculator", ms: "Kalkulator Gaji Malaysia", id: "Kalkulator Gaji Malaysia" },
  "salary.subtitle": { en: "Estimate monthly take-home pay after EPF, SOCSO, EIS, and Malaysian income tax. Useful for salary negotiation, offer comparison, and monthly budgeting.", ms: "Anggaran gaji bersih bulanan selepas EPF, SOCSO, EIS, dan cukai pendapatan Malaysia. Cocok untuk negosiasi gaji, membandingkan penawaran, dan budgeting bulanan.", id: "Estimasi gaji bersih bulanan setelah EPF, SOCSO, EIS, dan pajak penghasilan Malaysia. Cocok untuk negosiasi gaji, membandingkan penawaran, dan budgeting bulanan." },
  "salary.takeHomePay": { en: "Estimated monthly take-home pay", ms: "Anggaran gaji bersih bulanan", id: "Estimasi gaji bersih bulanan" },
  "salary.ofMonthlyGross": { en: "of monthly gross salary", ms: "daripada gaji kotor bulanan", id: "dari gaji kotor bulanan" },
  "salary.fixInputErrors": { en: "Fix input errors to view estimate", ms: "Perbaiki input yang error untuk melihat anggaran", id: "Perbaiki input yang error untuk melihat estimasi" },
  "salary.cta.calculate": {
    en: "Calculate my take-home pay",
    ms: "Kira gaji bersih saya",
    id: "Hitung gaji bersih saya",
  },
  "salary.cta.recalculate": {
    en: "Recalculate take-home pay",
    ms: "Kira semula gaji bersih",
    id: "Hitung ulang gaji bersih",
  },
  "salary.cta.tapToReveal": {
    en: "Tap Calculate to reveal your take-home pay",
    ms: "Tekan Kira untuk lihat gaji bersih anda",
    id: "Tekan Hitung untuk lihat gaji bersih Anda",
  },
  "salary.breakdown.ready": {
    en: "Your breakdown is ready",
    ms: "Pecahan anda sudah sedia",
    id: "Rincian Anda siap",
  },
  "salary.breakdown.hint": {
    en: "Fill in your salary details on the left, then tap Calculate to see EPF, PCB, SOCSO, and your monthly take-home.",
    ms: "Isikan butiran gaji anda di sebelah kiri, kemudian tekan Kira untuk melihat EPF, PCB, SOCSO dan gaji bersih bulanan anda.",
    id: "Isi detail gaji Anda di sebelah kiri, lalu tekan Hitung untuk melihat EPF, PCB, SOCSO, dan gaji bersih bulanan Anda.",
  },
  "salary.lead.title": {
    en: "Get personalised tax-saving tips",
    ms: "Dapatkan tip jimat cukai yang diperibadikan",
    id: "Dapatkan tips hemat pajak yang dipersonalisasi",
  },
  "salary.lead.desc": {
    en: "Free monthly email with EPF, PCB and tax-relief moves tailored to your salary band. Unsubscribe anytime.",
    ms: "E-mel bulanan percuma dengan langkah EPF, PCB dan pelepasan cukai yang sesuai dengan jurang gaji anda. Henti langganan bila-bila masa.",
    id: "Email bulanan gratis dengan langkah EPF, PCB, dan keringanan pajak yang sesuai dengan kisaran gaji Anda. Berhenti berlangganan kapan saja.",
  },
  "salary.lead.cta": {
    en: "Send me tax-saving tips",
    ms: "Hantar tip jimat cukai kepada saya",
    id: "Kirim tips hemat pajak ke saya",
  },
  "salary.lead.successTitle": {
    en: "You're in.",
    ms: "Anda sudah dalam senarai.",
    id: "Anda sudah terdaftar.",
  },
  "salary.lead.successDesc": {
    en: "We'll send the first tips within 24 hours.",
    ms: "Kami akan menghantar tip pertama dalam masa 24 jam.",
    id: "Kami akan mengirim tips pertama dalam 24 jam.",
  },
  "salary.lead.disclaimer": {
    en: "We never share your email. See our Privacy Policy.",
    ms: "Kami tidak akan berkongsi e-mel anda. Lihat Dasar Privasi kami.",
    id: "Kami tidak pernah membagikan email Anda. Lihat Kebijakan Privasi kami.",
  },
  "zakat.lead.reminder.title": {
    en: "Get a yearly Zakat reminder",
    ms: "Dapatkan peringatan Zakat tahunan",
    id: "Dapatkan pengingat Zakat tahunan",
  },
  "zakat.lead.reminder.desc": {
    en: "We'll email you next year on your hawl date with an updated nisab and a quick re-calculation link.",
    ms: "Kami akan menghantar e-mel kepada anda tahun depan pada tarikh haul anda dengan nisab terkini dan pautan kira semula yang pantas.",
    id: "Kami akan mengirim email Anda tahun depan pada tanggal haul Anda dengan nisab terbaru dan tautan hitung ulang yang cepat.",
  },
  "zakat.lead.reminder.cta": {
    en: "Set my reminder",
    ms: "Tetapkan peringatan saya",
    id: "Atur pengingat saya",
  },
  "zakat.lead.reminder.successTitle": {
    en: "Reminder set.",
    ms: "Peringatan ditetapkan.",
    id: "Pengingat diatur.",
  },
  "zakat.lead.reminder.successDesc": {
    en: "We'll email you a year from today.",
    ms: "Kami akan menghantar e-mel kepada anda setahun dari sekarang.",
    id: "Kami akan mengirim email kepada Anda satu tahun dari sekarang.",
  },
  "zakat.lead.reminder.disclaimer": {
    en: "One email per year. No spam.",
    ms: "Satu e-mel setahun. Tiada spam.",
    id: "Satu email per tahun. Tanpa spam.",
  },
  "zakat.price.lockToLive": {
    en: "Lock to live price",
    ms: "Kunci ke harga semasa",
    id: "Kunci ke harga terkini",
  },
  "zakat.price.editManually": {
    en: "Edit price manually",
    ms: "Edit harga secara manual",
    id: "Ubah harga secara manual",
  },
  "zakat.price.via": { en: "Price via", ms: "Harga daripada", id: "Harga dari" },
  "zakat.price.enterSilverFirst": {
    en: "Enter silver price above",
    ms: "Masukkan harga perak di atas",
    id: "Masukkan harga perak di atas",
  },
  "wasiat.lead.consult.title": {
    en: "Get a free 15-min consult with a Shariah lawyer",
    ms: "Dapatkan perundingan percuma 15 minit dengan peguam Syariah",
    id: "Dapatkan konsultasi gratis 15 menit dengan pengacara Syariah",
  },
  "wasiat.lead.consult.desc": {
    en: "A licensed solicitor will review your bequests and witness/registration steps. No obligation.",
    ms: "Peguam berlesen akan menyemak wasiat anda serta langkah saksi/pendaftaran. Tiada obligasi.",
    id: "Pengacara berlisensi akan meninjau wasiat Anda dan langkah saksi/pendaftaran. Tanpa kewajiban.",
  },
  "wasiat.lead.consult.cta": {
    en: "Book my free consult",
    ms: "Tempah perundingan percuma saya",
    id: "Pesan konsultasi gratis saya",
  },
  "wasiat.lead.consult.successTitle": {
    en: "Request received.",
    ms: "Permintaan diterima.",
    id: "Permintaan diterima.",
  },
  "wasiat.lead.consult.successDesc": {
    en: "A Shariah-trained partner will reach out within 1 business day.",
    ms: "Rakan terlatih Syariah akan menghubungi anda dalam 1 hari bekerja.",
    id: "Mitra terlatih Syariah akan menghubungi dalam 1 hari kerja.",
  },
  "wasiat.lead.consult.disclaimer": {
    en: "By submitting you agree to be contacted by a partnered solicitor about your Wasiat.",
    ms: "Dengan menghantar, anda bersetuju untuk dihubungi oleh peguam rakan kongsi tentang Wasiat anda.",
    id: "Dengan mengirim, Anda setuju dihubungi oleh pengacara mitra tentang Wasiat Anda.",
  },
  "faraid.lead.consult.successTitle": {
    en: "Consultation requested.",
    ms: "Perundingan diminta.",
    id: "Konsultasi diminta.",
  },
  "faraid.lead.consult.successDesc": {
    en: "A certified faraid consultant will be in touch within 1 business day.",
    ms: "Perunding faraid bertauliah akan menghubungi anda dalam 1 hari bekerja.",
    id: "Konsultan faraid bersertifikat akan menghubungi Anda dalam 1 hari kerja.",
  },
  "faraid.lead.consult.disclaimer": {
    en: "By submitting you agree to be contacted by a partnered consultant about your inheritance plan.",
    ms: "Dengan menghantar, anda bersetuju untuk dihubungi oleh perunding rakan kongsi tentang rancangan waris anda.",
    id: "Dengan mengirim, Anda setuju dihubungi oleh konsultan mitra tentang rencana waris Anda.",
  },
  "salary.inputs.title": { en: "Inputs", ms: "Input", id: "Input" },
  "salary.inputs.subtitle": { en: "Set your employment and tax profile for a closer monthly estimate.", ms: "Atur profil pekerjaan dan cukai Anda untuk anggaran bulanan yang lebih tepat.", id: "Atur profil pekerjaan dan pajak Anda untuk estimasi bulanan yang lebih akurat." },
  "salary.inputs.monthlySalary": { en: "Monthly gross salary", ms: "Gaji kotor bulanan", id: "Gaji kotor bulanan" },
  "salary.inputs.annualBonus": { en: "Annual bonus", ms: "Bonus tahunan", id: "Bonus tahunan" },
  "salary.inputs.otherRelief": { en: "Other annual relief", ms: "Pelepasan tahunan lain", id: "Pelepasan tahunan lainnya" },
  "salary.inputs.otherRelief.hint": { en: "Lifestyle, spouse, child, insurance, and other claimable relief.", ms: "Pelepasan gaya hidup, pasangan, anak, asuransi, dan lain-lain.", id: "Pelepasan gaya hidup, pasangan, anak, asuransi, dan lain-lain." },
  "salary.inputs.epfRate": { en: "EPF employee rate (%)", ms: "Kadar caruman EPF pekerja (%)", id: "Kadar caruman EPF pekerja (%)" },
  "salary.inputs.epfRate.hint.foreign": { en: "For foreign worker / expat, minimum EPF rate is 2%. You can set above 2%.", ms: "Untuk pekerja asing / ekspatriat, kadar EPF minimum adalah 2%. Anda boleh menetapkan di atas 2%.", id: "Untuk pekerja asing / ekspatriat, kadar EPF minimum adalah 2%. Anda boleh menetapkan di atas 2%." },
  "salary.inputs.epfRate.hint.local": { en: "Typical default is 11% for Malaysian/PR employees.", ms: "Kadar lalai biasa adalah 11% untuk pekerja Malaysia/PR.", id: "Kadar lalai biasa adalah 11% untuk pekerja Malaysia/PR." },
  "salary.inputs.workerType": { en: "Worker type", ms: "Jenis pekerja", id: "Jenis pekerja" },
  "salary.inputs.workerType.malaysian": { en: "Malaysian / PR", ms: "Warga Malaysia / PR", id: "Warga Malaysia / PR" },
  "salary.inputs.workerType.foreigner": { en: "Foreign worker / expat", ms: "Pekerja asing / ekspatriat", id: "Pekerja asing / ekspatriat" },
  "salary.inputs.taxResidency": { en: "Tax residency", ms: "Status cukai", id: "Status cukai" },
  "salary.inputs.resident": { en: "Resident", ms: "Pemastautin", id: "Pemastautin" },
  "salary.inputs.nonResident": { en: "Non-resident", ms: "Bukan pemastautin", id: "Bukan pemastautin" },
  "salary.disclaimer": { en: "Estimate only. This is not official PCB/payroll/tax advice. SOCSO and EIS in real payroll should follow official contribution tables issued by authorities.", ms: "Angka anggaran sahaja. Ini bukan nasihat PCB/penggajian/cukai rasmi. SOCSO dan EIS dalam penggajian sebenar perlu mengikut jadual caruman rasmi yang dikeluarkan oleh pihak berkuasa.", id: "Angka anggaran sahaja. Ini bukan nasihat PCB/penggajian/cukai rasmi. SOCSO dan EIS dalam penggajian sebenar perlu mengikut jadual caruman rasmi yang dikeluarkan oleh pihak berkuasa." },
  "salary.negativeWarning": { en: "Estimated deductions are higher than monthly gross salary. Review EPF rate, reliefs, and residency settings.", ms: "Anggaran potongan lebih tinggi daripada gaji kotor bulanan. Semak kadar EPF, pelepasan, dan tetapan pemastautin.", id: "Anggaran potongan lebih tinggi daripada gaji kotor bulanan. Semak kadar EPF, pelepasan, dan tetapan pemastautin." },
  "salary.epfMonth": { en: "EPF / month", ms: "KWSP / bulan", id: "KWSP / bulan" },
  "salary.taxMonth": { en: "Estimated tax / month", ms: "Anggaran cukai / bulan", id: "Anggaran cukai / bulan" },
  "salary.socsoMonth": { en: "SOCSO / month", ms: "PERKESO / bulan", id: "PERKESO / bulan" },
  "salary.eisMonth": { en: "EIS / month", ms: "SIP / bulan", id: "SIP / bulan" },
  "salary.rateEstimate": { en: "Rate estimate:", ms: "Anggaran kadar:", id: "Anggaran kadar:" },
  "salary.annual.title": { en: "Annual summary", ms: "Ringkasan tahunan", id: "Ringkasan tahunan" },
  "salary.annual.subtitle": { en: "High-level estimate for planning and comparison.", ms: "Anggaran umum untuk perancangan dan perbandingan.", id: "Anggaran umum untuk perancangan dan perbandingan." },
  "salary.save": { en: "Save", ms: "Simpan", id: "Simpan" },
  "salary.monthlyTakeHome": { en: "Monthly take-home pay", ms: "Gaji bersih bulanan", id: "Gaji bersih bulanan" },
  "salary.ofGross": { en: "of gross", ms: "daripada gaji kotor", id: "daripada gaji kotor" },
  "salary.annualGross": { en: "Annual gross", ms: "Gaji kotor tahunan", id: "Gaji kotor tahunan" },
  "salary.beforeDeductions": { en: "Before deductions", ms: "Sebelum potongan", id: "Sebelum potongan" },
  "salary.chargeableIncome": { en: "Chargeable income estimate", ms: "Anggaran pendapatan bercukai", id: "Anggaran pendapatan bercukai" },
  "salary.afterReliefs": { en: "After reliefs and deductible items", ms: "Selepas pelepasan dan potongan", id: "Selepas pelepasan dan potongan" },
  "salary.annualTax": { en: "Annual tax estimate", ms: "Anggaran cukai tahunan", id: "Anggaran cukai tahunan" },
  "salary.effectiveTax": { en: "Effective tax:", ms: "Cukai efektif:", id: "Cukai efektif:" },
  "salary.estimatedMonthlyTax": { en: "Estimated monthly tax", ms: "Anggaran cukai bulanan", id: "Anggaran cukai bulanan" },
  "salary.approxMonthlyRate": { en: "Approx monthly rate:", ms: "Kadar bulanan anggaran:", id: "Kadar bulanan anggaran:" },
  "salary.monthlyDeductions": { en: "Monthly deductions", ms: "Potongan bulanan", id: "Potongan bulanan" },
  "salary.deductionItems": { en: "EPF + SOCSO + EIS + tax", ms: "KWSP + PERKESO + SIP + cukai", id: "KWSP + PERKESO + SIP + cukai" },
  "salary.validation.monthlySalary": { en: "Monthly gross salary must be greater than 0.", ms: "Gaji kotor bulanan mesti lebih daripada 0.", id: "Gaji kotor bulanan mesti lebih daripada 0." },
  "salary.validation.annualBonus": { en: "Annual bonus cannot be negative.", ms: "Bonus tahunan tidak boleh negatif.", id: "Bonus tahunan tidak boleh negatif." },
  "salary.validation.otherRelief": { en: "Other annual relief cannot be negative.", ms: "Pelepasan tahunan lain tidak boleh negatif.", id: "Pelepasan tahunan lainnya tidak boleh negatif." },
  "salary.validation.epfForeigner": { en: "EPF employee rate for foreign worker / expat must be between 2% and 15%.", ms: "Kadar EPF pekerja asing / ekspatriat mesti antara 2% dan 15%.", id: "Kadar EPF pekerja asing / ekspatriat mesti antara 2% dan 15%." },
  "salary.validation.epfLocal": { en: "EPF employee rate must be between 0% and 15%.", ms: "Kadar EPF pekerja mesti antara 0% dan 15%.", id: "Kadar EPF pekerja mesti antara 0% dan 15%." },

  // ── Accessibility ──
  "a11y.themeToggle.light": { en: "Switch to light mode", ms: "Ganti ke mode terang", id: "Ganti ke mode terang" },
  "a11y.themeToggle.dark": { en: "Switch to dark mode", ms: "Ganti ke mode gelap", id: "Ganti ke mode gelap" },
  "a11y.historyToggle": { en: "Toggle history", ms: "Tampilkan sejarah", id: "Tampilkan riwayat" },
  "a11y.navToggle": { en: "Toggle navigation", ms: "Tampilkan navigasi", id: "Tampilkan navigasi" },
  "a11y.calc.multiply": { en: "multiply", ms: "kali", id: "kali" },
  "a11y.calc.divide": { en: "divide", ms: "bagi", id: "bagi" },
  "a11y.calc.toggleSign": { en: "toggle sign", ms: "ubah tanda", id: "ubah tanda" },
  "a11y.calc.percent": { en: "percent", ms: "persen", id: "persen" },
  "a11y.calc.backspace": { en: "backspace", ms: "padam", id: "hapus" },
  "a11y.calc.clear": { en: "clear", ms: "padam semua", id: "hapus semua" },
  "a11y.calc.equals": { en: "equals", ms: "sama dengan", id: "sama dengan" },
  "a11y.calc.xSquared": { en: "x squared", ms: "x kuadrat", id: "x kuadrat" },
  "a11y.calc.xPowerY": { en: "x to the power y", ms: "x pangkat y", id: "x pangkat y" },
  "a11y.calc.oneOverX": { en: "one over x", ms: "satu per x", id: "satu per x" },
  "a11y.calc.factorial": { en: "factorial", ms: "faktorial", id: "faktorial" },
  "a11y.calc.absoluteValue": { en: "absolute value", ms: "nilai mutlak", id: "nilai mutlak" },
  "a11y.calc.squareRoot": { en: "square root", ms: "akar kuadrat", id: "akar kuadrat" },
  "a11y.calc.pi": { en: "pi", ms: "pi", id: "pi" },
  "a11y.calc.euler": { en: "Euler's number", ms: "Bilangan Euler", id: "Bilangan Euler" },
  "a11y.calc.openParen": { en: "open parenthesis", ms: "kurung buka", id: "kurung buka" },
  "a11y.calc.closeParen": { en: "close parenthesis", ms: "kurung tutup", id: "kurung tutup" },
  "a11y.calc.arcsine": { en: "arcsine", ms: "arcsine", id: "arcsine" },
  "a11y.calc.arccosine": { en: "arccosine", ms: "arccosine", id: "arccosine" },
  "a11y.calc.arctangent": { en: "arctangent", ms: "arctangent", id: "arctangent" },
  "a11y.degRadToggle": { en: "angle mode", ms: "mode sudut", id: "mode sudut" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[locale] || entry.en;
}
