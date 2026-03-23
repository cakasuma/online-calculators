// ─── i18n System ────────────────────────────────────────────────────────────
// Simple, zero-dependency i18n for English + Bahasa Indonesia.
// Locale is persisted in localStorage and exposed via React context.

export type Locale = "en" | "id";

export const LOCALE_STORAGE_KEY = "calc_locale";

export function getLocaleFromUrl(): Locale | null {
  try {
    const hash = window.location.hash; // e.g. "#/id/faraid" or "#/en/"
    const path = hash.startsWith("#/") ? hash.slice(2) : hash.slice(1);
    const firstSegment = path.split("/")[0];
    if (firstSegment === "en" || firstSegment === "id") return firstSegment;
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
    if (saved === "en" || saved === "id") return saved;
  } catch { /* noop */ }
  // Priority 3: Auto-detect from browser
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
  // Manual formatter — avoids Intl locale-data gaps in some environments.
  // Indonesian: 1.234.567,89  (dot thousands, comma decimal)
  // English:    1,234,567.89  (comma thousands, dot decimal)
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
  "faraid.paternalGrandmother": { en: "Paternal Grandmother", id: "Nenek (dari Ayah)" },
  "faraid.maternalGrandmother": { en: "Maternal Grandmother", id: "Nenek (dari Ibu)" },
  "faraid.grandsons": { en: "Grandsons", id: "Cucu Laki-laki" },
  "faraid.grandson": { en: "Grandson", id: "Cucu Laki-laki" },
  "faraid.granddaughters": { en: "Granddaughters", id: "Cucu Perempuan" },
  "faraid.granddaughter": { en: "Granddaughter", id: "Cucu Perempuan" },
  "faraid.paternalBrothers": { en: "Paternal Brothers", id: "Saudara Laki-laki Seayah" },
  "faraid.paternalBrother": { en: "Paternal Brother", id: "Saudara Laki-laki Seayah" },
  "faraid.paternalSisters": { en: "Paternal Sisters", id: "Saudara Perempuan Seayah" },
  "faraid.paternalSister": { en: "Paternal Sister", id: "Saudara Perempuan Seayah" },
  "faraid.maternalBrothers": { en: "Maternal Brothers", id: "Saudara Laki-laki Seibu" },
  "faraid.maternalBrother": { en: "Maternal Brother", id: "Saudara Laki-laki Seibu" },
  "faraid.maternalSisters": { en: "Maternal Sisters", id: "Saudara Perempuan Seibu" },
  "faraid.maternalSister": { en: "Maternal Sister", id: "Saudara Perempuan Seibu" },
  "faraid.consanguineMale": { en: "Consanguine (Agnate Relative)", id: "Kerabat Asabah (Paman/Sepupu)" },
  "faraid.grandchildrenSection": { en: "Grandchildren", id: "Cucu" },
  "faraid.fullSiblingsSection": { en: "Full Siblings", id: "Saudara Kandung" },
  "faraid.paternalSiblingsSection": { en: "Paternal Siblings (half, father's side)", id: "Saudara Seayah (setengah, dari ayah)" },
  "faraid.maternalSiblingsSection": { en: "Maternal Siblings (uterine)", id: "Saudara Seibu (uterus)" },
  "faraid.otherRelativesSection": { en: "Other Relatives", id: "Kerabat Lainnya" },
  "faraid.distantKindredNote": { en: "Distant Kindred (dhawi al-arham) are not calculated here — consult a qualified Islamic scholar for complex cases.", id: "Kerabat jauh (dzawi al-arham) tidak dihitung di sini — konsultasikan dengan ulama untuk kasus kompleks." },

  // ── Faraid FAQ ──
  "faraid.faq.title": { en: "Frequently Asked Questions", id: "Pertanyaan yang Sering Ditanyakan" },
  "faraid.faq.noMaternalGrandfather.q": { en: "Why is there no Maternal Grandfather?", id: "Mengapa tidak ada Kakek dari Ibu?" },
  "faraid.faq.noMaternalGrandfather.a": {
    en: "This is intentional and correct in Sunni Islamic law. The maternal grandfather (mother's father) is not a primary heir — he falls under Distant Kindred (dhawi al-arham) and only inherits when no primary heirs exist at all. In Sunni fiqh, male relatives who connect to the deceased through a female link are classified as distant kindred. The paternal grandfather (father's father) is a primary heir because he is in the direct male (agnatic) lineage. Interestingly, both grandmothers are exceptions — they are explicitly recognised as sharers in hadith traditions despite connecting through a female in some cases.",
    id: "Hal ini disengaja dan benar dalam hukum Islam Sunni. Kakek dari pihak ibu (ayah dari ibu) bukan ahli waris utama — ia termasuk dalam Kerabat Jauh (dzawi al-arham) dan hanya mewarisi jika tidak ada ahli waris utama sama sekali. Dalam fikih Sunni, kerabat laki-laki yang terhubung kepada pewaris melalui jalur perempuan diklasifikasikan sebagai kerabat jauh. Kakek dari pihak ayah adalah ahli waris utama karena ia berada dalam jalur laki-laki (asabah) langsung. Menariknya, kedua nenek merupakan pengecualian — mereka secara eksplisit diakui sebagai ashab al-furud dalam tradisi hadis.",
  },
  "faraid.faq.awl.q": { en: "What happens when total fixed shares exceed 100%?", id: "Apa yang terjadi jika total bagian tetap melebihi 100%?" },
  "faraid.faq.awl.a": {
    en: "This is resolved by Awl (proportional reduction). Each heir's fixed share is reduced proportionally so that the total equals 100%. For example, if fixed shares add up to 7/6, each heir receives their share divided by 7/6. This ruling was established by Caliph Umar ibn al-Khattab (RA) and agreed upon by the companions.",
    id: "Hal ini diselesaikan dengan Awl (pengurangan proporsional). Bagian tetap setiap ahli waris dikurangi secara proporsional agar totalnya sama dengan 100%. Misalnya, jika bagian tetap berjumlah 7/6, setiap ahli waris menerima bagiannya dibagi 7/6. Putusan ini ditetapkan oleh Khalifah Umar ibn al-Khattab (RA) dan disepakati oleh para sahabat.",
  },
  "faraid.faq.hajb.q": { en: "What does 'Blocked (Hajb)' mean?", id: "Apa arti 'Terhalang (Hajb)'?" },
  "faraid.faq.hajb.a": {
    en: "Hajb means a closer heir prevents a more distant one from inheriting. There are two types: Hajb Hirman (complete exclusion, e.g. the father blocks the paternal grandfather) and Hajb Nuqsan (partial reduction, e.g. children reduce the spouse's share). A blocked heir receives nothing, but their presence in the family is still noted.",
    id: "Hajb berarti ahli waris yang lebih dekat mencegah ahli waris yang lebih jauh untuk mewarisi. Ada dua jenis: Hajb Hirman (pengecualian penuh, mis. ayah menghalangi kakek dari ayah) dan Hajb Nuqsan (pengurangan sebagian, mis. anak-anak mengurangi bagian pasangan). Ahli waris yang terhalang tidak menerima apa-apa, tetapi kehadirannya dalam keluarga tetap dicatat.",
  },
  "faraid.faq.wasiyyah.q": { en: "Why is Wasiyyah capped at 1/3?", id: "Mengapa Wasiat dibatasi 1/3?" },
  "faraid.faq.wasiyyah.a": {
    en: "The Prophet Muhammad ﷺ instructed that a bequest (wasiyyah) must not exceed one-third of the estate, as recorded in Sahih Bukhari and Muslim. The remainder must be distributed to legal heirs according to Faraid rules. Additionally, a wasiyyah cannot be made in favour of a legal heir — heirs receive their shares through Faraid, not through bequest.",
    id: "Nabi Muhammad ﷺ memerintahkan agar wasiat tidak melebihi sepertiga harta, sebagaimana tercatat dalam Sahih Bukhari dan Muslim. Sisanya harus dibagikan kepada ahli waris yang sah sesuai ketentuan Faraid. Selain itu, wasiat tidak boleh diberikan kepada ahli waris yang sah — ahli waris menerima bagian mereka melalui Faraid, bukan melalui wasiat.",
  },

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
  "faraid.blocked.mother": { en: "Mother", id: "Ibu" },
  "faraid.blocked.sons": { en: "Sons", id: "Anak Laki-laki" },
  "faraid.blocked.daughters": { en: "2 or more Daughters", id: "2 atau lebih Anak Perempuan" },
  "faraid.blocked.grandsons": { en: "Grandsons", id: "Cucu Laki-laki" },
  "faraid.blocked.fullBrothers": { en: "Full Brothers", id: "Saudara Kandung Laki-laki" },
  "faraid.spouseBothError": {
    en: "Deceased cannot have both a husband and wives.",
    id: "Almarhum tidak bisa memiliki suami dan istri sekaligus.",
  },
  "faraid.siblingsBlockedBy": {
    en: "Siblings are blocked (hajb) by",
    id: "Saudara kandung terhalang (hajb) oleh",
  },
  "faraid.share.thirdOfRemainder": { en: "1/3 of remainder", id: "1/3 dari sisa" },
  "faraid.share.sixthPlusResidual": { en: "1/6 + residual", id: "1/6 + sisa" },
  "faraid.share.reduced": { en: "reduced", id: "dikurangi" },
  "faraid.chart.amount": { en: "Amount", id: "Jumlah" },
  "faraid.umariyyatainNote": {
    en: "Mother's share calculated using umariyyatain rule (1/3 of remainder after spouse).",
    id: "Bagian ibu dihitung menggunakan aturan umariyyatain (1/3 sisa setelah pasangan).",
  },

  // ── Faraid References ──
  "faraid.references.title": { en: "Quranic & Hadith References", id: "Referensi Al-Quran & Hadis" },
  "faraid.references.quran411": { en: "Surah An-Nisa 4:11", id: "Surah An-Nisa 4:11" },
  "faraid.references.quran411.text": {
    en: "Allah instructs you concerning your children: for the male, what is equal to the share of two females. But if there are only daughters, two or more, for them is two-thirds of one's estate. And if there is only one, for her is half. And for one's parents, to each one of them is a sixth of his estate if he left children. But if he had no children and the parents alone inherit from him, then for his mother is one third…",
    id: "Allah mensyariatkan (mewajibkan) kepadamu tentang (pembagian warisan untuk) anak-anakmu, (yaitu) bagian seorang anak laki-laki sama dengan bagian dua orang anak perempuan. Dan jika anak itu semuanya perempuan yang jumlahnya lebih dari dua, maka bagian mereka dua pertiga dari harta yang ditinggalkan. Jika dia (anak perempuan) itu seorang saja, maka dia memperoleh setengah (harta yang ditinggalkan). Dan untuk kedua ibu-bapak, bagian masing-masing seperenam dari harta yang ditinggalkan, jika dia (yang meninggal) mempunyai anak…",
  },
  "faraid.references.quran412": { en: "Surah An-Nisa 4:12", id: "Surah An-Nisa 4:12" },
  "faraid.references.quran412.text": {
    en: "And for you is half of what your wives leave if they have no child. But if they have a child, for you is one fourth of what they leave, after any bequest they may have made or debt. And for the wives is one fourth if you leave no child. But if you leave a child, then for them is an eighth of what you leave, after any bequest you may have made or debt…",
    id: "Dan bagianmu (suami-suami) adalah setengah dari harta yang ditinggalkan oleh istri-istrimu, jika mereka tidak mempunyai anak. Jika mereka (istri-istrimu) itu mempunyai anak, maka kamu mendapat seperempat dari harta yang ditinggalkannya sesudah dipenuhi wasiat yang mereka buat atau (dan) sesudah dibayar utangnya. Para istri memperoleh seperempat harta yang kamu tinggalkan jika kamu tidak mempunyai anak. Jika kamu mempunyai anak, maka para istri memperoleh seperdelapan dari harta yang kamu tinggalkan sesudah dipenuhi wasiat yang kamu buat atau (dan) sesudah dibayar utang-utangmu…",
  },
  "faraid.references.quran4176": { en: "Surah An-Nisa 4:176", id: "Surah An-Nisa 4:176" },
  "faraid.references.quran4176.text": {
    en: "They ask you for a ruling. Say, 'Allah gives you a ruling concerning one who dies without children [kalalah]: If a man dies, leaving no child but a sister, she will have half of what he left. And he inherits from her if she has no child. But if there are two sisters, they will have two-thirds of what he left. If there are brothers and sisters, the male will have the share of two females…'",
    id: "Mereka meminta fatwa kepadamu (tentang kalalah). Katakanlah, 'Allah memberi fatwa kepadamu tentang kalalah, yaitu jika seseorang meninggal dunia, dan dia tidak mempunyai anak tetapi mempunyai saudara perempuan, maka bagiannya (saudara perempuannya itu) seperdua dari harta yang ditinggalkannya, dan saudaranya yang laki-laki mewarisi (seluruh harta saudara perempuan), jika dia tidak mempunyai anak. Tetapi jika saudara perempuan itu dua orang, maka bagi keduanya dua pertiga dari harta yang ditinggalkan. Dan jika mereka (ahli waris itu terdiri dari) saudara-saudara laki-laki dan perempuan, maka bagian seorang saudara laki-laki sama dengan bagian dua orang saudara perempuan…'",
  },
  "faraid.references.hadith": { en: "Hadith — Ibn Majah 2719", id: "Hadis — Ibnu Majah 2719" },
  "faraid.references.hadith.text": {
    en: "\"Learn the rules of inheritance and teach them to the people, for it is half of knowledge, and it is the first thing to be forgotten and the first thing to be taken away from my nation.\" — Prophet Muhammad ﷺ (Ibn Majah 2719)",
    id: "\"Pelajarilah ilmu faraid dan ajarkan kepada manusia, karena ia adalah setengah dari ilmu pengetahuan, dan ia adalah ilmu yang pertama kali dilupakan dan pertama kali dicabut dari umatku.\" — Nabi Muhammad ﷺ (Ibnu Majah 2719)",
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
  "tooltip.paternalGrandmother": {
    en: "Paternal Grandmother (father's mother). Gets 1/6 fixed share, shared equally with maternal grandmother if both are present. Blocked by the mother, father, or paternal grandfather.",
    id: "Nenek dari pihak ayah (ibu dari ayah). Mendapat 1/6 bagian tetap, dibagi rata dengan nenek dari ibu jika keduanya ada. Terhalang oleh ibu, ayah, atau kakek dari ayah.",
  },
  "tooltip.maternalGrandmother": {
    en: "Maternal Grandmother (mother's mother). Gets 1/6 fixed share, shared equally with paternal grandmother if both are present. Blocked only by the mother.",
    id: "Nenek dari pihak ibu (ibu dari ibu). Mendapat 1/6 bagian tetap, dibagi rata dengan nenek dari ayah jika keduanya ada. Hanya terhalang oleh ibu.",
  },
  "tooltip.grandsons": {
    en: "Grandsons (son's sons) are residuary heirs (asabah) taking the place of sons. Blocked by direct sons. When granddaughters are also present, grandsons receive twice their share (2:1 ratio).",
    id: "Cucu laki-laki (dari anak laki-laki) adalah ahli waris asabah. Terhalang oleh anak laki-laki. Jika ada cucu perempuan, cucu laki-laki mendapat 2x bagian (rasio 2:1).",
  },
  "tooltip.granddaughters": {
    en: "Granddaughters (son's daughters). Get 1/2 (one alone), 2/3 (two or more), or 1/6 complementary share when one daughter exists. Blocked by sons, or 2+ daughters (unless grandsons are present).",
    id: "Cucu perempuan (dari anak laki-laki). Mendapat 1/2 (seorang), 2/3 (dua atau lebih), atau 1/6 pelengkap jika ada satu anak perempuan. Terhalang oleh anak laki-laki atau 2+ anak perempuan tanpa cucu laki-laki.",
  },
  "tooltip.paternalBrothers": {
    en: "Paternal Brothers (half-siblings, same father different mother). Residuary heirs (asabah). Blocked by father, grandfather, sons, grandsons, or full brothers.",
    id: "Saudara laki-laki seayah (ayah sama, ibu berbeda). Ahli waris asabah. Terhalang oleh ayah, kakek, anak laki-laki, cucu laki-laki, atau saudara kandung laki-laki.",
  },
  "tooltip.paternalSisters": {
    en: "Paternal Sisters (half-siblings, same father different mother). Get 1/2 (one), 2/3 (two+), or 1/6 alongside one full sister. Become asabah when a paternal brother is present. Blocked by father, grandfather, sons, grandsons, full brothers.",
    id: "Saudara perempuan seayah. Mendapat 1/2 (seorang), 2/3 (dua+), atau 1/6 jika ada satu saudara kandung perempuan. Menjadi asabah jika ada saudara laki-laki seayah. Terhalang oleh ayah, kakek, anak/cucu laki-laki, saudara kandung laki-laki.",
  },
  "tooltip.maternalBrothers": {
    en: "Maternal Brothers (uterine, same mother different father). Fixed share: 1/6 for one, 1/3 shared equally among all maternal siblings (brothers and sisters together). Blocked by any children or grandchildren, father, or grandfather.",
    id: "Saudara laki-laki seibu (ibu sama, ayah berbeda). Bagian tetap: 1/6 untuk satu orang, 1/3 dibagi rata semua saudara seibu (laki dan perempuan bersama). Terhalang oleh anak/cucu (laki/perempuan), ayah, atau kakek.",
  },
  "tooltip.maternalSisters": {
    en: "Maternal Sisters (uterine, same mother different father). Same shares as maternal brothers — together they share 1/6 (one total sibling) or 1/3 (two or more total). Blocked by any children or grandchildren, father, or grandfather.",
    id: "Saudara perempuan seibu. Bagian sama dengan saudara laki-laki seibu — bersama mereka berbagi 1/6 (satu orang total) atau 1/3 (dua atau lebih). Terhalang oleh anak/cucu (laki/perempuan), ayah, atau kakek.",
  },
  "tooltip.consanguineMale": {
    en: "Consanguine Agnate Relative (e.g. paternal uncle, son of paternal uncle). Inherits the residual estate after all closer heirs. Blocked by all brothers and paternal brothers.",
    id: "Kerabat asabah jauh (mis. paman dari ayah, anak paman dari ayah). Mewarisi sisa harta setelah semua ahli waris lebih dekat. Terhalang oleh semua saudara laki-laki.",
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
