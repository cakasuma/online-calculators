// ─── i18n System ────────────────────────────────────────────────────────────
// Simple, zero-dependency i18n for English + Bahasa Indonesia.
// Locale is persisted in localStorage and exposed via React context.

export type Locale = "en" | "id";

export const LOCALE_STORAGE_KEY = "calc_locale";

export function getSavedLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === "en" || saved === "id") return saved;
  } catch { /* noop */ }
  // Auto-detect from browser
  const nav = navigator.language?.toLowerCase() || "";
  if (nav.startsWith("id") || nav.startsWith("ms")) return "id";
  return "en";
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch { /* noop */ }
}

// ─── Number Formatting ────────────────────────────────────────────────────
// English: 1,234,567.89   Indonesian: 1.234.567,89

export function formatNumber(n: number, locale: Locale, decimals = 2): string {
  const loc = locale === "id" ? "id-ID" : "en-US";
  return new Intl.NumberFormat(loc, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
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
  "site.title": { en: "Online Calculators", id: "Kalkulator Online" },
  "nav.home": { en: "Home", id: "Beranda" },
  "nav.basic": { en: "Basic", id: "Dasar" },
  "nav.scientific": { en: "Scientific", id: "Ilmiah" },
  "nav.faraid": { en: "Faraid", id: "Faraid" },
  "common.history": { en: "History", id: "Riwayat" },
  "common.noHistory": { en: "No history yet", id: "Belum ada riwayat" },
  "common.historyHint": { en: "Your calculations will appear here", id: "Perhitungan Anda akan muncul di sini" },
  "common.clear": { en: "Clear", id: "Hapus" },
  "common.justNow": { en: "Just now", id: "Baru saja" },
  "common.mAgo": { en: "m ago", id: "m lalu" },
  "common.hAgo": { en: "h ago", id: "j lalu" },
  "common.calculate": { en: "Calculate", id: "Hitung" },
  "common.reset": { en: "Reset", id: "Atur Ulang" },
  "common.error": { en: "Error", id: "Kesalahan" },

  // ── Home Page ──
  "home.title": { en: "Online Calculators", id: "Kalkulator Online" },
  "home.subtitle": { en: "Free browser-based calculators with history saved locally.", id: "Kalkulator gratis berbasis browser dengan riwayat tersimpan secara lokal." },
  "home.basic.title": { en: "Basic Calculator", id: "Kalkulator Dasar" },
  "home.basic.desc": { en: "Standard arithmetic operations — addition, subtraction, multiplication, and division.", id: "Operasi aritmatika standar — penjumlahan, pengurangan, perkalian, dan pembagian." },
  "home.scientific.title": { en: "Scientific Calculator", id: "Kalkulator Ilmiah" },
  "home.scientific.desc": { en: "Trigonometric functions, logarithms, powers, factorials, and more.", id: "Fungsi trigonometri, logaritma, pangkat, faktorial, dan lainnya." },
  "home.faraid.title": { en: "Faraid Calculator", id: "Kalkulator Faraid" },
  "home.faraid.desc": { en: "Simplified Islamic inheritance distribution — prototype for basic estate scenarios.", id: "Distribusi waris Islam yang disederhanakan — prototipe untuk skenario harta dasar." },

  // ── Faraid Calculator ──
  "faraid.disclaimer.title": { en: "Prototype Only", id: "Hanya Prototipe" },
  "faraid.disclaimer.text": {
    en: "This is a simplified Faraid calculator. It covers basic inheritance scenarios only. Always consult a qualified Islamic scholar for actual estate distribution.",
    id: "Ini adalah kalkulator Faraid yang disederhanakan. Hanya mencakup skenario warisan dasar. Selalu konsultasikan dengan ulama yang berkompeten untuk pembagian harta sesungguhnya.",
  },
  "faraid.estateDetails": { en: "Estate Details", id: "Detail Harta" },
  "faraid.totalEstate": { en: "Total Estate Value", id: "Total Nilai Harta" },
  "faraid.totalEstate.placeholder": { en: "e.g. 100,000", id: "cth. 100.000" },
  "faraid.debts": { en: "Debts & Expenses", id: "Utang & Biaya" },
  "faraid.wasiyyah": { en: "Wasiyyah (max 1/3)", id: "Wasiat (maks 1/3)" },
  "faraid.heirs": { en: "Heirs", id: "Ahli Waris" },
  "faraid.husband": { en: "Husband", id: "Suami" },
  "faraid.wife": { en: "Wife", id: "Istri" },
  "faraid.father": { en: "Father", id: "Ayah" },
  "faraid.mother": { en: "Mother", id: "Ibu" },
  "faraid.sons": { en: "Sons", id: "Anak Laki-laki" },
  "faraid.daughters": { en: "Daughters", id: "Anak Perempuan" },
  "faraid.calculateDist": { en: "Calculate Distribution", id: "Hitung Pembagian" },
  "faraid.results": { en: "Distribution Results", id: "Hasil Pembagian" },
  "faraid.netEstate": { en: "Net estate", id: "Harta bersih" },
  "faraid.share": { en: "Share", id: "Bagian" },
  "faraid.totalDistributed": { en: "Total Distributed", id: "Total Dibagikan" },
  "faraid.residual": { en: "Residual", id: "Sisa" },
  "faraid.son": { en: "Son", id: "Anak Laki-laki" },
  "faraid.daughter": { en: "Daughter", id: "Anak Perempuan" },
  "faraid.fatherFixed": { en: "Father (fixed)", id: "Ayah (tetap)" },
  "faraid.fatherResidual": { en: "Father (residual)", id: "Ayah (sisa)" },

  // ── Faraid Tooltips ──
  "tooltip.faraid": {
    en: "Faraid is the Islamic law of inheritance that determines how a deceased person's estate is distributed among heirs according to the Quran and Sunnah.",
    id: "Faraid adalah hukum waris Islam yang menentukan bagaimana harta seseorang yang meninggal dibagikan kepada ahli waris sesuai Al-Quran dan Sunnah.",
  },
  "tooltip.wasiyyah": {
    en: "Wasiyyah (bequest/will) is a voluntary gift from the estate, limited to a maximum of 1/3 of the net estate after debts. It cannot be given to legal heirs.",
    id: "Wasiat adalah hibah sukarela dari harta, dibatasi maksimal 1/3 dari harta bersih setelah utang. Tidak boleh diberikan kepada ahli waris yang sah.",
  },
  "tooltip.totalEstate": {
    en: "The total value of all assets owned by the deceased, including property, savings, investments, and personal belongings.",
    id: "Total nilai seluruh aset milik almarhum, termasuk properti, tabungan, investasi, dan barang pribadi.",
  },
  "tooltip.debts": {
    en: "All outstanding debts and funeral/burial expenses that must be settled before inheritance distribution.",
    id: "Semua utang yang belum dibayar dan biaya pemakaman yang harus diselesaikan sebelum pembagian warisan.",
  },
  "tooltip.asabah": {
    en: "Asabah (residuary heir) receives the remaining estate after fixed-share heirs take their portions. Sons are asabah — they receive what's left.",
    id: "Asabah (ahli waris sisa) menerima sisa harta setelah ahli waris bagian tetap mengambil bagiannya. Anak laki-laki adalah asabah.",
  },
  "tooltip.fixedShare": {
    en: "Fixed share (fard) heirs receive a predetermined fraction of the estate as specified in the Quran (e.g. 1/2, 1/4, 1/6, 1/3, 1/8, 2/3).",
    id: "Ahli waris bagian tetap (fard) menerima pecahan yang telah ditentukan sesuai Al-Quran (mis. 1/2, 1/4, 1/6, 1/3, 1/8, 2/3).",
  },
  "tooltip.husband": {
    en: "The husband receives 1/4 of the estate if the wife has children, or 1/2 if she has no children.",
    id: "Suami menerima 1/4 harta jika istri memiliki anak, atau 1/2 jika tidak memiliki anak.",
  },
  "tooltip.wife": {
    en: "The wife receives 1/8 of the estate if the husband has children, or 1/4 if he has no children.",
    id: "Istri menerima 1/8 harta jika suami memiliki anak, atau 1/4 jika tidak memiliki anak.",
  },
  "tooltip.father": {
    en: "The father receives 1/6 as a fixed share if the deceased has children. If no children, he becomes asabah (residuary heir).",
    id: "Ayah menerima 1/6 sebagai bagian tetap jika almarhum memiliki anak. Jika tidak ada anak, dia menjadi asabah (ahli waris sisa).",
  },
  "tooltip.mother": {
    en: "The mother receives 1/6 if the deceased has children, or 1/3 if there are no children.",
    id: "Ibu menerima 1/6 jika almarhum memiliki anak, atau 1/3 jika tidak ada anak.",
  },
  "tooltip.sons": {
    en: "Sons are asabah (residuary heirs) who receive the remaining estate. A son's share is twice that of a daughter when both are present.",
    id: "Anak laki-laki adalah asabah yang menerima sisa harta. Bagian anak laki-laki dua kali bagian anak perempuan jika keduanya ada.",
  },
  "tooltip.daughters": {
    en: "One daughter receives 1/2 of the estate; two or more daughters share 2/3. When sons are present, daughters become asabah (son gets 2x daughter's share).",
    id: "Satu anak perempuan menerima 1/2 harta; dua atau lebih berbagi 2/3. Jika ada anak laki-laki, anak perempuan menjadi asabah (laki-laki mendapat 2x bagian perempuan).",
  },

  // ── Validation Messages ──
  "validation.required": { en: "This field is required", id: "Kolom ini wajib diisi" },
  "validation.positiveNumber": { en: "Must be a positive number", id: "Harus berupa angka positif" },
  "validation.invalidNumber": { en: "Invalid number format", id: "Format angka tidak valid" },
  "validation.noHeirs": { en: "Please select at least one heir", id: "Silakan pilih minimal satu ahli waris" },
  "validation.wasiyyahExceeds": {
    en: "Wasiyyah cannot exceed 1/3 of estate after debts",
    id: "Wasiat tidak boleh melebihi 1/3 harta setelah utang",
  },
  "validation.debtsExceedEstate": {
    en: "Debts and expenses exceed the total estate value",
    id: "Utang dan biaya melebihi total nilai harta",
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[locale] || entry.en;
}
