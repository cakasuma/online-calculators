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
  "site.title": { en: "Faraid Calculator", id: "Kalkulator Faraid" },
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
  "home.title": { en: "Islamic Inheritance Calculator", id: "Kalkulator Warisan Islam" },
  "home.subtitle": { en: "Accurately calculate Faraid (Islamic inheritance) distribution based on Quran and Sunnah.", id: "Hitung pembagian Faraid (waris Islam) secara akurat berdasarkan Al-Quran dan Sunnah." },
  "home.faraid.title": { en: "Faraid Calculator", id: "Kalkulator Faraid" },
  "home.faraid.desc": { en: "Full Islamic inheritance distribution with pie chart visualization, multiple heirs, and detailed breakdown.", id: "Pembagian waris Islam lengkap dengan visualisasi diagram, berbagai ahli waris, dan rincian detail." },
  "home.faraid.badge": { en: "Featured", id: "Unggulan" },
  "home.tools.title": { en: "Other Tools", id: "Alat Lainnya" },
  "home.basic.title": { en: "Basic Calculator", id: "Kalkulator Dasar" },
  "home.basic.desc": { en: "Standard arithmetic operations — addition, subtraction, multiplication, and division.", id: "Operasi aritmatika standar — penjumlahan, pengurangan, perkalian, dan pembagian." },
  "home.scientific.title": { en: "Scientific Calculator", id: "Kalkulator Ilmiah" },
  "home.scientific.desc": { en: "Trigonometric functions, logarithms, powers, factorials, and more.", id: "Fungsi trigonometri, logaritma, pangkat, faktorial, dan lainnya." },
  "home.about.title": { en: "What is Faraid?", id: "Apa itu Faraid?" },
  "home.about.text": {
    en: "Faraid (فرائض) is the Islamic law of inheritance derived from the Quran and Sunnah. It defines the precise shares each heir receives from a deceased person's estate after settling debts and fulfilling any bequest (wasiyyah). This calculator covers primary heirs including spouses, parents, children, grandparents, and siblings.",
    id: "Faraid (فرائض) adalah hukum waris Islam yang berasal dari Al-Quran dan Sunnah. Ini mendefinisikan bagian tepat yang diterima setiap ahli waris dari harta seseorang yang meninggal setelah melunasi utang dan memenuhi wasiat. Kalkulator ini mencakup ahli waris utama termasuk pasangan, orang tua, anak-anak, kakek-nenek, dan saudara kandung.",
  },

  // ── Faraid Calculator ──
  "faraid.disclaimer.title": { en: "Educational Tool", id: "Alat Edukasi" },
  "faraid.disclaimer.text": {
    en: "This calculator covers primary Faraid scenarios based on mainstream Islamic jurisprudence. Always consult a qualified Islamic scholar or certified estate planner for official distribution.",
    id: "Kalkulator ini mencakup skenario Faraid utama berdasarkan fikih Islam arus utama. Selalu konsultasikan dengan ulama atau perencana warisan bersertifikat untuk pembagian resmi.",
  },
  "faraid.currency": { en: "Currency", id: "Mata Uang" },
  "faraid.estateDetails": { en: "Estate Details", id: "Detail Harta" },
  "faraid.estateBreakdown": { en: "Estate Breakdown", id: "Rincian Harta" },
  "faraid.totalEstate": { en: "Total Estate Value", id: "Total Nilai Harta" },
  "faraid.totalEstate.placeholder": { en: "e.g. 100,000", id: "cth. 100.000" },
  "faraid.debts": { en: "Debts & Funeral Expenses", id: "Utang & Biaya Pemakaman" },
  "faraid.wasiyyah": { en: "Wasiyyah / Bequest (max 1/3)", id: "Wasiat (maks 1/3)" },
  "faraid.heirs": { en: "Heirs", id: "Ahli Waris" },
  "faraid.spouseSection": { en: "Spouse", id: "Pasangan" },
  "faraid.parentsSection": { en: "Parents & Grandparents", id: "Orang Tua & Kakek-Nenek" },
  "faraid.childrenSection": { en: "Children", id: "Anak-anak" },
  "faraid.siblingsSection": { en: "Siblings", id: "Saudara Kandung" },
  "faraid.husband": { en: "Husband", id: "Suami" },
  "faraid.wife": { en: "Wife", id: "Istri" },
  "faraid.numberOfWives": { en: "Number of Wives", id: "Jumlah Istri" },
  "faraid.wifeN": { en: "Wife", id: "Istri" },
  "faraid.father": { en: "Father", id: "Ayah" },
  "faraid.grandfather": { en: "Paternal Grandfather", id: "Kakek (dari Ayah)" },
  "faraid.grandfatherResidual": { en: "Grandfather (residual)", id: "Kakek (sisa)" },
  "faraid.mother": { en: "Mother", id: "Ibu" },
  "faraid.sons": { en: "Sons", id: "Anak Laki-laki" },
  "faraid.daughters": { en: "Daughters", id: "Anak Perempuan" },
  "faraid.fullBrothers": { en: "Full Brothers", id: "Saudara Laki-laki Kandung" },
  "faraid.fullBrother": { en: "Full Brother", id: "Saudara Laki-laki Kandung" },
  "faraid.fullSisters": { en: "Full Sisters", id: "Saudara Perempuan Kandung" },
  "faraid.fullSister": { en: "Full Sister", id: "Saudara Perempuan Kandung" },
  "faraid.calculateDist": { en: "Calculate Distribution", id: "Hitung Pembagian" },
  "faraid.results": { en: "Distribution Results", id: "Hasil Pembagian" },
  "faraid.netEstate": { en: "Net Estate", id: "Harta Bersih" },
  "faraid.share": { en: "Share", id: "Bagian" },
  "faraid.amount": { en: "Amount", id: "Jumlah" },
  "faraid.percentage": { en: "%", id: "%" },
  "faraid.totalDistributed": { en: "Total Distributed", id: "Total Dibagikan" },
  "faraid.residual": { en: "Residual", id: "Sisa" },
  "faraid.son": { en: "Son", id: "Anak Laki-laki" },
  "faraid.daughter": { en: "Daughter", id: "Anak Perempuan" },
  "faraid.fatherFixed": { en: "Father (fixed)", id: "Ayah (tetap)" },
  "faraid.fatherResidual": { en: "Father (residual)", id: "Ayah (sisa)" },
  "faraid.blockedHeirs": { en: "Blocked Heirs (Hajb)", id: "Ahli Waris Terhalang (Hajb)" },
  "faraid.blockedNote": { en: "Blocked by", id: "Terhalang oleh" },
  "faraid.awlNote": {
    en: "Note: Fixed shares exceeded 100% — shares have been reduced proportionally (awl).",
    id: "Catatan: Bagian tetap melebihi 100% — bagian dikurangi secara proporsional (awl).",
  },
  "faraid.undistributed": { en: "Undistributed (Baitulmal)", id: "Tidak Terbagi (Baitulmal)" },
  "faraid.undistributedNote": {
    en: "The remaining estate is returned to eligible heirs (radd) or to the public treasury (Baitulmal) if no eligible heir exists.",
    id: "Sisa harta dikembalikan kepada ahli waris yang berhak (radd) atau ke kas negara (Baitulmal) jika tidak ada ahli waris yang berhak.",
  },
  "faraid.distribution": { en: "Distribution Chart", id: "Diagram Pembagian" },
  "faraid.printResults": { en: "Print / Save PDF", id: "Cetak / Simpan PDF" },
  "faraid.shareResults": { en: "Share via WhatsApp", id: "Bagikan via WhatsApp" },
  "faraid.consultCTA.title": { en: "Need Professional Advice?", id: "Butuh Saran Profesional?" },
  "faraid.consultCTA.text": {
    en: "For legally binding estate distribution, consult a certified Islamic estate planner or faraid practitioner.",
    id: "Untuk pembagian harta yang sah secara hukum, konsultasikan dengan perencana warisan Islam bersertifikat atau praktisi faraid.",
  },
  "faraid.consultCTA.button": { en: "Find a Consultant", id: "Cari Konsultan" },
  "faraid.blocked.father": { en: "Father", id: "Ayah" },
  "faraid.blocked.grandfather": { en: "Paternal Grandfather", id: "Kakek" },
  "faraid.blocked.sons": { en: "Sons", id: "Anak Laki-laki" },
  "faraid.umariyyatainNote": {
    en: "Mother's share calculated using umariyyatain rule (1/3 of remainder after spouse).",
    id: "Bagian ibu dihitung menggunakan aturan umariyyatain (1/3 sisa setelah pasangan).",
  },

  // ── Faraid Tooltips ──
  "tooltip.numberOfWives": {
    en: "Islam permits up to 4 wives. If multiple wives exist, they share the wife's portion equally (1/4 or 1/8 split between them).",
    id: "Islam mengizinkan hingga 4 istri. Jika ada beberapa istri, mereka berbagi bagian istri secara merata (1/4 atau 1/8 dibagi di antara mereka).",
  },
  "tooltip.grandfather": {
    en: "The paternal grandfather (father's father) inherits in the same position as the father, but only if the father is not alive. He is blocked (hajb) by the father.",
    id: "Kakek dari pihak ayah mewarisi dalam posisi yang sama dengan ayah, tetapi hanya jika ayah tidak hidup. Ia terhalang (hajb) oleh ayah.",
  },
  "tooltip.fullBrothers": {
    en: "Full brothers (same father and mother) are residuary heirs (asabah). They are blocked by the father, paternal grandfather, or sons of the deceased.",
    id: "Saudara laki-laki kandung (ayah dan ibu sama) adalah ahli waris asabah. Mereka terhalang oleh ayah, kakek dari pihak ayah, atau anak laki-laki almarhum.",
  },
  "tooltip.fullSisters": {
    en: "Full sisters (same father and mother). One sister gets 1/2; two or more share 2/3. When a full brother is present, they become asabah (2:1 ratio). Blocked by father, grandfather, or sons.",
    id: "Saudara perempuan kandung (ayah dan ibu sama). Satu saudara perempuan mendapat 1/2; dua atau lebih berbagi 2/3. Jika ada saudara laki-laki, mereka menjadi asabah (2:1). Terhalang oleh ayah, kakek, atau anak laki-laki.",
  },
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
  "validation.wivesMax": { en: "Maximum 4 wives permitted in Islam", id: "Maksimal 4 istri diperbolehkan dalam Islam" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[locale] || entry.en;
}
