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
  "nav.epf": { en: "EPF", ms: "EPF", id: "EPF" },

  // ── EPF retirement calculator ──
  "epf.title": {
    en: "EPF retirement projection",
    ms: "Unjuran persaraan EPF",
    id: "Proyeksi pensiun EPF",
  },
  "epf.subtitle": {
    en: "Project your KWSP balance at retirement age, compare against the EPF Basic Savings target, and estimate your monthly retirement income.",
    ms: "Unjurkan baki KWSP anda pada umur persaraan, bandingkan dengan sasaran Simpanan Asas EPF, dan anggarkan pendapatan persaraan bulanan anda.",
    id: "Proyeksikan saldo KWSP Anda pada usia pensiun, bandingkan dengan target Basic Savings EPF, dan perkirakan pendapatan pensiun bulanan Anda.",
  },
  "epf.calculate": { en: "Calculate", ms: "Kira", id: "Hitung" },
  "epf.recalculate": { en: "Recalculate", ms: "Kira semula", id: "Hitung ulang" },
  "epf.inputs.heading": { en: "Your details", ms: "Maklumat anda", id: "Detail Anda" },
  "epf.inputs.advancedSettings": {
    en: "Advanced settings",
    ms: "Tetapan lanjutan",
    id: "Pengaturan lanjutan",
  },
  "epf.inputs.currentAge": { en: "Current age", ms: "Umur sekarang", id: "Usia sekarang" },
  "epf.inputs.retirementAge": {
    en: "Retirement age",
    ms: "Umur persaraan",
    id: "Usia pensiun",
  },
  "epf.inputs.retirementAgeHint": {
    en: "55 (early) or 60 (full withdrawal)",
    ms: "55 (awal) atau 60 (pengeluaran penuh)",
    id: "55 (awal) atau 60 (penarikan penuh)",
  },
  "epf.inputs.currentBalance": {
    en: "Current EPF balance",
    ms: "Baki EPF sekarang",
    id: "Saldo EPF sekarang",
  },
  "epf.inputs.currentBalanceHint": {
    en: "Akaun Persaraan + Akaun Sejahtera combined",
    ms: "Akaun Persaraan + Akaun Sejahtera digabungkan",
    id: "Akun Persaraan + Akun Sejahtera digabungkan",
  },
  "epf.inputs.monthlySalary": {
    en: "Monthly gross salary",
    ms: "Gaji kotor bulanan",
    id: "Gaji kotor bulanan",
  },
  "epf.inputs.salaryGrowth": {
    en: "Annual salary growth",
    ms: "Pertumbuhan gaji tahunan",
    id: "Pertumbuhan gaji tahunan",
  },
  "epf.inputs.dividendRate": {
    en: "Expected EPF dividend",
    ms: "Dividen EPF dijangka",
    id: "Dividen EPF diharapkan",
  },
  "epf.inputs.dividendRateHint": {
    en: "KWSP has paid 5.5%–6.4% in recent years",
    ms: "KWSP telah membayar 5.5%–6.4% dalam beberapa tahun kebelakangan",
    id: "KWSP telah membayar 5.5%–6.4% dalam beberapa tahun terakhir",
  },
  "epf.inputs.employeeRate": {
    en: "Employee rate",
    ms: "Kadar pekerja",
    id: "Tarif karyawan",
  },
  "epf.inputs.employerRate": {
    en: "Employer rate (override)",
    ms: "Kadar majikan (ganti)",
    id: "Tarif majikan (override)",
  },
  "epf.inputs.employerRateHint": {
    en: "Default for this salary:",
    ms: "Lalai untuk gaji ini:",
    id: "Default untuk gaji ini:",
  },
  "epf.inputs.bonusMonths": {
    en: "Bonus months / year",
    ms: "Bulan bonus / tahun",
    id: "Bulan bonus / tahun",
  },
  "epf.inputs.bonusMonthsHint": {
    en: "0 if no bonus, 2 if two-month bonus, etc.",
    ms: "0 jika tiada bonus, 2 untuk bonus dua bulan, dll.",
    id: "0 jika tanpa bonus, 2 untuk bonus dua bulan, dll.",
  },
  "epf.inputs.voluntary": {
    en: "Yearly voluntary contribution",
    ms: "Sumbangan sukarela tahunan",
    id: "Kontribusi sukarela tahunan",
  },
  "epf.inputs.voluntaryHint": {
    en: "e.g. i-Saraan top-ups",
    ms: "cth. tambahan i-Saraan",
    id: "cth. tambahan i-Saraan",
  },
  "epf.results.yearsAway": { en: "yrs to retirement", ms: "thn lagi", id: "thn lagi" },
  "epf.results.staleHint": {
    en: "Inputs changed — recalculate to update",
    ms: "Input berubah — kira semula untuk kemaskini",
    id: "Input berubah — hitung ulang untuk memperbarui",
  },
  "epf.results.emptyHint": {
    en: "Enter your details above and click Calculate to see your EPF projection.",
    ms: "Masukkan maklumat anda di atas dan klik Kira untuk melihat unjuran EPF anda.",
    id: "Masukkan detail Anda di atas dan klik Hitung untuk melihat proyeksi EPF Anda.",
  },
  "epf.units.years": { en: "yrs", ms: "thn", id: "thn" },
  "epf.units.months": { en: "mo", ms: "bln", id: "bln" },
  "epf.units.year": { en: "yr", ms: "thn", id: "thn" },
  "epf.results.projectedAt": {
    en: "Projected EPF balance at age",
    ms: "Unjuran baki EPF pada umur",
    id: "Proyeksi saldo EPF di usia",
  },
  "epf.results.contributed": {
    en: "contributed",
    ms: "disumbangkan",
    id: "dikontribusikan",
  },
  "epf.results.dividends": {
    en: "dividends",
    ms: "dividen",
    id: "dividen",
  },
  "epf.results.targetTitle": {
    en: "KWSP Basic Savings target",
    ms: "Sasaran Simpanan Asas KWSP",
    id: "Target Basic Savings KWSP",
  },
  "epf.results.aboveTargetBy": {
    en: "On track — above target by",
    ms: "Mengikut sasaran — melebihi sasaran sebanyak",
    id: "Sesuai jalur — di atas target sebesar",
  },
  "epf.results.belowTargetBy": {
    en: "Below the target by",
    ms: "Di bawah sasaran sebanyak",
    id: "Di bawah target sebesar",
  },
  "epf.results.targetSource": {
    en: "Source: KWSP Retirement Income Adequacy framework (RM 390k at age 60 by 2028).",
    ms: "Sumber: Rangka kerja Kecukupan Pendapatan Persaraan KWSP (RM 390k pada umur 60 menjelang 2028).",
    id: "Sumber: Kerangka Kecukupan Pendapatan Pensiun KWSP (RM 390k di usia 60 pada 2028).",
  },
  "epf.results.monthlyIncome": {
    en: "Estimated monthly retirement income",
    ms: "Anggaran pendapatan persaraan bulanan",
    id: "Estimasi pendapatan pensiun bulanan",
  },
  "epf.results.monthlyIncomeHint": {
    en: "Using a 4% safe-withdrawal rate. For a longer retirement, plan with a lower rate.",
    ms: "Menggunakan kadar pengeluaran selamat 4%. Untuk persaraan lebih panjang, rancang dengan kadar lebih rendah.",
    id: "Menggunakan tarif penarikan aman 4%. Untuk pensiun lebih panjang, rencanakan dengan tarif lebih rendah.",
  },
  "epf.results.yearly.title": {
    en: "Year-by-year breakdown",
    ms: "Pecahan tahun demi tahun",
    id: "Rincian tahun per tahun",
  },
  "epf.results.yearly.age": { en: "Age", ms: "Umur", id: "Usia" },
  "epf.results.yearly.salary": { en: "Salary", ms: "Gaji", id: "Gaji" },
  "epf.results.yearly.contrib": { en: "Contributions", ms: "Sumbangan", id: "Kontribusi" },
  "epf.results.yearly.div": { en: "Dividends", ms: "Dividen", id: "Dividen" },
  "epf.results.yearly.total": { en: "Total", ms: "Jumlah", id: "Total" },
  "epf.results.yearly.endBal": { en: "End balance", ms: "Baki akhir", id: "Saldo akhir" },
  "epf.results.yearly.chartView": { en: "Chart", ms: "Carta", id: "Grafik" },
  "epf.results.yearly.tableView": { en: "Table", ms: "Jadual", id: "Tabel" },
  "epf.results.yearly.targetLine": {
    en: "Basic Savings",
    ms: "Simpanan Asas",
    id: "Basic Savings",
  },

  "tools.epf-calculator.name": {
    en: "EPF Retirement Projection",
    ms: "Unjuran Persaraan EPF",
    id: "Proyeksi Pensiun EPF",
  },
  "tools.epf-calculator.desc": {
    en: "Project your KWSP balance at retirement and compare against the Basic Savings target.",
    ms: "Unjurkan baki KWSP anda pada persaraan dan bandingkan dengan sasaran Simpanan Asas.",
    id: "Proyeksikan saldo KWSP Anda pada pensiun dan bandingkan dengan target Basic Savings.",
  },
  "common.history": { en: "History", ms: "Sejarah", id: "Riwayat" },
  "history.open": { en: "Open", ms: "Buka", id: "Buka" },
  "common.noHistory": { en: "No history yet", ms: "Tiada sejarah", id: "Belum ada riwayat" },
  "common.historyHint": { en: "Your calculations will appear here", ms: "Pengiraan Anda akan muncul di sini", id: "Perhitungan Anda akan muncul di sini" },
  "common.clear": { en: "Clear", ms: "Padam", id: "Hapus" },
  "common.justNow": { en: "Just now", ms: "Baharu sahaja", id: "Baru saja" },
  "common.mAgo": { en: "m ago", ms: "m lalu", id: "m lalu" },
  "common.hAgo": { en: "h ago", ms: "j lalu", id: "j lalu" },
  "common.calculate": { en: "Calculate", ms: "Kira", id: "Hitung" },
  "common.downloadPdf": { en: "Download PDF", ms: "Muat turun PDF", id: "Unduh PDF" },
  "common.save": { en: "Save", ms: "Simpan", id: "Simpan" },
  "common.saved": { en: "Saved", ms: "Disimpan", id: "Tersimpan" },
  "common.reset": { en: "Reset", ms: "Tetapkan Semula", id: "Atur Ulang" },
  "common.error": { en: "Error", ms: "Ralat", id: "Kesalahan" },
  "lead.sending": { en: "Sending…", ms: "Menghantar…", id: "Mengirim…" },
  "lead.errorEmail": { en: "Please enter a valid email address.", ms: "Sila masukkan e-mel yang sah.", id: "Masukkan email yang valid." },
  "lead.errorGeneric": { en: "Something went wrong. Please try again.", ms: "Ralat berlaku. Sila cuba lagi.", id: "Terjadi kesalahan. Silakan coba lagi." },

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

  // ── Save scenarios ──
  "save.action": { en: "Save scenario", ms: "Simpan senario", id: "Simpan skenario" },
  "save.savedShort": { en: "Saved", ms: "Disimpan", id: "Tersimpan" },
  "save.saved": { en: "Scenario saved", ms: "Senario disimpan", id: "Skenario tersimpan" },
  "save.savedDesc": {
    en: "Find it under Saved in the history drawer.",
    ms: "Cari di bawah Disimpan dalam laci sejarah.",
    id: "Temukan di bawah Tersimpan pada laci riwayat.",
  },
  "save.dialogTitle": {
    en: "Name this scenario",
    ms: "Namakan senario ini",
    id: "Beri nama skenario ini",
  },
  "save.dialogDesc": {
    en: "Give it a label you'll recognise later — e.g. \"My 2026 salary\" or \"Mum's faraid\".",
    ms: "Beri label yang anda akan kenal nanti — cth. \"Gaji saya 2026\" atau \"Faraid mak\".",
    id: "Beri label yang Anda akan kenali nanti — cth. \"Gaji saya 2026\" atau \"Faraid ibu\".",
  },
  "save.namePlaceholder": {
    en: "Scenario name",
    ms: "Nama senario",
    id: "Nama skenario",
  },
  "save.cancel": { en: "Cancel", ms: "Batal", id: "Batal" },
  "save.confirm": { en: "Save", ms: "Simpan", id: "Simpan" },
  "save.sectionTitle": { en: "Saved", ms: "Disimpan", id: "Tersimpan" },
  "save.empty": {
    en: "No saved scenarios yet",
    ms: "Tiada senario disimpan",
    id: "Belum ada skenario tersimpan",
  },

  // ── Embed widget ──
  "embed.button": { en: "Embed", ms: "Benamkan", id: "Sematkan" },
  "embed.dialogTitle": {
    en: "Embed this calculator on your site",
    ms: "Benamkan kalkulator ini di laman anda",
    id: "Sematkan kalkulator ini di situs Anda",
  },
  "embed.dialogDesc": {
    en: "Paste this snippet anywhere on your page. The iframe auto-resizes as users interact.",
    ms: "Tampalkan keratan ini di mana-mana pada halaman anda. Iframe akan ubah saiz secara automatik semasa pengguna berinteraksi.",
    id: "Tempelkan cuplikan ini di mana saja pada halaman Anda. Iframe akan menyesuaikan ukuran secara otomatis saat pengguna berinteraksi.",
  },
  "embed.htmlSnippet": { en: "HTML snippet", ms: "Keratan HTML", id: "Cuplikan HTML" },
  "embed.urlOnly": { en: "Direct URL only", ms: "URL sahaja", id: "URL saja" },
  "embed.copy": { en: "Copy", ms: "Salin", id: "Salin" },
  "embed.copied": { en: "Copied!", ms: "Disalin!", id: "Tersalin!" },
  "embed.copyError": { en: "Could not copy", ms: "Tidak boleh disalin", id: "Tidak dapat menyalin" },
  "embed.snippetHint": {
    en: "Includes the auto-resize helper script. Drop the snippet into any HTML or CMS rich-text block.",
    ms: "Termasuk skrip pembantu ubah saiz automatik. Letakkan keratan dalam mana-mana HTML atau blok teks kaya CMS.",
    id: "Termasuk skrip bantu ubah ukuran otomatis. Tempel cuplikan ke dalam HTML atau blok teks kaya CMS apa pun.",
  },
  "embed.urlHint": {
    en: "Useful if you only want the URL — your own iframe wrapper, or a sandboxed preview.",
    ms: "Berguna jika anda mahu URL sahaja — pembalut iframe sendiri, atau pratonton sandboxed.",
    id: "Berguna jika Anda hanya ingin URL — pembungkus iframe sendiri, atau pratinjau ber-sandbox.",
  },

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
  "home.hero.subtitle": {
    en: "Free, private calculators and guides for Malaysia salary (EPF, SOCSO, PCB), zakat, faraid inheritance, and Islamic estate planning. Available in English, Bahasa Malaysia, and Bahasa Indonesia.",
    ms: "Kalkulator dan panduan percuma yang peribadi untuk gaji Malaysia (EPF, SOCSO, PCB), zakat, faraid, dan perancangan harta Islam. Tersedia dalam Bahasa Inggeris, Bahasa Malaysia, dan Bahasa Indonesia.",
    id: "Kalkulator dan panduan gratis yang privat untuk gaji Malaysia (EPF, SOCSO, PCB), zakat, faraid, dan perencanaan harta Islam. Tersedia dalam Bahasa Inggris, Bahasa Malaysia, dan Bahasa Indonesia.",
  },
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
  "tools.epf-calculator.badge": { en: "New", ms: "Baharu", id: "Baru" },
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
  "footer.partners": { en: "Partners", ms: "Rakan kongsi", id: "Mitra" },
  "home.hero.partnersLink": {
    en: "Trusted by writers, blogs, and platforms — see who embeds HelloKalku →",
    ms: "Dipercayai penulis, blog, dan platform — lihat siapa membenamkan HelloKalku →",
    id: "Dipercaya penulis, blog, dan platform — lihat siapa yang menyematkan HelloKalku →",
  },

  // ── Partners page ──
  "partners.stat.sites": {
    en: "Embedding sites",
    ms: "Laman membenamkan",
    id: "Situs menyematkan",
  },
  "partners.stat.views": {
    en: "Embed views",
    ms: "Tontonan benaman",
    id: "Tayangan sematan",
  },
  "partners.stat.windowNote": {
    en: "Last 6 months",
    ms: "6 bulan lepas",
    id: "6 bulan terakhir",
  },
  "partners.stat.calculators": {
    en: "Embeddable calculators",
    ms: "Kalkulator boleh dibenamkan",
    id: "Kalkulator dapat disematkan",
  },
  "partners.stat.calcList": {
    en: "Salary · Zakat · Faraid · Basic · Scientific",
    ms: "Gaji · Zakat · Faraid · Asas · Saintifik",
    id: "Gaji · Zakat · Faraid · Dasar · Ilmiah",
  },
  "partners.embedViews": { en: "embed views", ms: "tontonan", id: "tayangan" },
  "partners.pitch.title": {
    en: "Embed any HelloKalku calculator on your site",
    ms: "Benamkan mana-mana kalkulator HelloKalku di laman anda",
    id: "Sematkan kalkulator HelloKalku mana pun di situs Anda",
  },
  "partners.pitch.body": {
    en: "Drop a single iframe + script tag into your page and your readers get an interactive calculator that auto-resizes and stays up-to-date with the latest Malaysia tax, zakat, and inheritance rules. No maintenance, no fees, no signup.",
    ms: "Letakkan satu iframe + tag skrip ke halaman anda dan pembaca anda dapat kalkulator interaktif yang ubah saiz secara automatik serta sentiasa terkini dengan peraturan cukai, zakat, dan waris Malaysia terbaharu. Tiada penyelenggaraan, tiada bayaran, tiada pendaftaran.",
    id: "Tempelkan satu iframe + tag skrip ke halaman Anda dan pembaca Anda mendapat kalkulator interaktif yang menyesuaikan ukuran otomatis serta selalu terbaru dengan aturan pajak, zakat, dan waris Malaysia terkini. Tanpa pemeliharaan, tanpa biaya, tanpa pendaftaran.",
  },
  "partners.pitch.cta": {
    en: "Open any calculator and click the Embed button to copy the snippet.",
    ms: "Buka mana-mana kalkulator dan klik butang Benamkan untuk menyalin keratan.",
    id: "Buka kalkulator mana pun dan klik tombol Sematkan untuk menyalin cuplikan.",
  },
  "partners.list.title": {
    en: "Where HelloKalku is embedded",
    ms: "Di mana HelloKalku dibenamkan",
    id: "Di mana HelloKalku disematkan",
  },
  "partners.list.loading": {
    en: "Loading partner list…",
    ms: "Memuatkan senarai rakan kongsi…",
    id: "Memuat daftar mitra…",
  },
  "partners.list.error": {
    en: "Could not load the partner list right now. Please try again later.",
    ms: "Tidak dapat memuatkan senarai rakan kongsi sekarang. Cuba lagi nanti.",
    id: "Tidak dapat memuat daftar mitra sekarang. Silakan coba lagi nanti.",
  },
  "partners.list.empty": {
    en: "No partner sites have reached the listing threshold yet.",
    ms: "Belum ada laman rakan kongsi mencapai ambang penyenaraian.",
    id: "Belum ada situs mitra yang mencapai ambang pencatatan.",
  },
  "partners.list.emptyHint": {
    en: "Sites with at least 5 embed views in the last 6 months show up here.",
    ms: "Laman dengan sekurang-kurangnya 5 tontonan benaman dalam 6 bulan lepas akan muncul di sini.",
    id: "Situs dengan minimal 5 tayangan sematan dalam 6 bulan terakhir akan muncul di sini.",
  },
  "partners.list.disclosure": {
    en: "Domains are detected automatically from embed traffic. Hosts can opt out by emailing us — see Privacy.",
    ms: "Domain dikesan secara automatik daripada trafik benaman. Hos boleh menarik diri dengan menghantar e-mel kepada kami — lihat Privasi.",
    id: "Domain dideteksi secara otomatis dari lalu lintas sematan. Host dapat memilih keluar dengan mengirim email kepada kami — lihat Privasi.",
  },

  // ── Brand ──
  "brand.tagline": { en: "Smart calculators for everyday decisions", ms: "Kalkulator cerdas untuk keputusan harian", id: "Kalkulator cerdas untuk keputusan sehari-hari" },

  // ── Nav extras ──
  "nav.salary": { en: "Salary", ms: "Gaji", id: "Gaji" },
  "nav.zakat": { en: "Zakat", ms: "Zakat", id: "Zakat" },

  // ── Nav group labels ──
  "nav.groupFinance": { en: "Finance", ms: "Kewangan", id: "Keuangan" },
  "nav.groupMath": { en: "Math", ms: "Matematik", id: "Matematika" },
  "nav.groupIslamic": { en: "Islamic & Planning", ms: "Islam & Perancangan", id: "Islam & Perencanaan" },

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
  "privacy.p1": { en: "HelloKalku respects your privacy. Most calculator inputs are processed in your browser and are not sent to our servers.", ms: "HelloKalku menghormati privasi anda. Kebanyakan input kalkulator diproses dalam browser anda dan tidak dihantar ke pelayan kami.", id: "HelloKalku menghormati privasi Anda. Sebagian besar input kalkulator diproses di browser Anda dan tidak dikirim ke server kami." },
  "privacy.p2": { en: "We may use analytics and advertising partners (including Google AdSense) that use cookies or similar technologies to measure usage and serve relevant ads.", ms: "Kami boleh menggunakan mitra analitik dan iklan (termasuk Google AdSense) yang menggunakan cookie atau teknologi serupa untuk mengukur penggunaan dan menyajikan iklan yang relevan.", id: "Kami dapat menggunakan mitra analitik dan iklan (termasuk Google AdSense) yang menggunakan cookie atau teknologi serupa untuk mengukur penggunaan dan menyajikan iklan yang relevan." },
  "privacy.p3": { en: "You can control cookies in your browser settings. By using this site, you consent to data practices described in this policy.", ms: "Anda boleh mengontrol cookie di tetapan browser Anda. Dengan menggunakan situs ini, Anda menyetujui praktik data yang dijelaskan dalam dasar ini.", id: "Anda dapat mengontrol cookie di pengaturan browser Anda. Dengan menggunakan situs ini, Anda menyetujui praktik data yang dijelaskan dalam kebijakan ini." },
  "privacy.contact.title": { en: "Contact", ms: "Kontak", id: "Kontak" },
  "privacy.contact.text": { en: "For privacy questions, contact", ms: "Untuk soalan privasi, hubungi", id: "Untuk pertanyaan privasi, hubungi" },

  // ── Terms of Use ──
  "terms.title": { en: "Terms of Use", ms: "Syarat Penggunaan", id: "Syarat Penggunaan" },
  "terms.lastUpdated": { en: "Last updated: April 28, 2026", ms: "Terakhir dikemas kini: 28 April 2026", id: "Terakhir diperbarui: 28 April 2026" },
  "terms.p1": { en: "HelloKalku provides calculators and educational guides for informational purposes only. Results may not reflect legal, tax, or religious rulings for your specific case.", ms: "HelloKalku menyediakan kalkulator dan panduan pendidikan hanya untuk tujuan maklumat. Keputusan mungkin tidak mencerminkan peraturan undang-undang, cukai, atau agama untuk kes khusus anda.", id: "HelloKalku menyediakan kalkulator dan panduan edukasi hanya untuk tujuan informasi. Hasil mungkin tidak mencerminkan keputusan hukum, pajak, atau agama untuk kasus spesifik Anda." },
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

  // ── Salary percentile ──
  "salary.percentile.title": {
    en: "Where do you stand?",
    ms: "Di mana kedudukan anda?",
    id: "Di mana posisi Anda?",
  },
  "salary.percentile.subtitle": {
    en: "Compare your gross salary against Malaysian income brackets and other users on this site.",
    ms: "Bandingkan gaji kotor anda dengan jurang pendapatan Malaysia dan pengguna lain di laman ini.",
    id: "Bandingkan gaji kotor Anda dengan kisaran pendapatan Malaysia dan pengguna lain di situs ini.",
  },
  "salary.percentile.malaysiaBracket": {
    en: "Malaysia income bracket (DOSM HIES 2024)",
    ms: "Jurang pendapatan Malaysia (DOSM HIES 2024)",
    id: "Kisaran pendapatan Malaysia (DOSM HIES 2024)",
  },
  "salary.percentile.bracket.B40": {
    en: "Bottom 40% of households",
    ms: "40% isi rumah terbawah",
    id: "40% rumah tangga terbawah",
  },
  "salary.percentile.bracket.M40": {
    en: "Middle 40% of households",
    ms: "40% isi rumah pertengahan",
    id: "40% rumah tangga menengah",
  },
  "salary.percentile.bracket.T20": {
    en: "Top 20% of households",
    ms: "20% isi rumah teratas",
    id: "20% rumah tangga teratas",
  },
  "salary.percentile.bracket.T10": {
    en: "Top 10% of households",
    ms: "10% isi rumah teratas",
    id: "10% rumah tangga teratas",
  },
  "salary.percentile.bracket.T1": {
    en: "Top 1% of households",
    ms: "1% isi rumah teratas",
    id: "1% rumah tangga teratas",
  },
  "salary.percentile.amongUsers": {
    en: "You are in the top {percentile}% of {sampleSize} salary submissions on this site.",
    ms: "Anda berada dalam {percentile}% teratas daripada {sampleSize} penghantaran gaji di laman ini.",
    id: "Anda berada di {percentile}% teratas dari {sampleSize} pengiriman gaji di situs ini.",
  },
  "salary.percentile.windowNote": {
    en: "Based on submissions in the last 6 months. Anonymous and aggregate only.",
    ms: "Berdasarkan penghantaran dalam 6 bulan lepas. Anonim dan agregat sahaja.",
    id: "Berdasarkan pengiriman dalam 6 bulan terakhir. Anonim dan agregat saja.",
  },
  "salary.percentile.notEnoughData": {
    en: "Not enough submissions yet to show your rank among other users. Come back soon.",
    ms: "Belum cukup data untuk menunjukkan kedudukan anda berbanding pengguna lain. Kembali tidak lama lagi.",
    id: "Belum cukup data untuk menunjukkan posisi Anda dibanding pengguna lain. Kembali lagi nanti.",
  },
  "salary.percentile.householdNote": {
    en: "DOSM B40/M40/T20 brackets are measured at household income level. If this is your individual salary in a multi-earner household, your household bracket is likely higher.",
    ms: "Jurang B40/M40/T20 DOSM diukur pada tahap pendapatan isi rumah. Jika ini gaji individu anda dalam isi rumah dengan beberapa pencari nafkah, jurang isi rumah anda mungkin lebih tinggi.",
    id: "Kisaran B40/M40/T20 DOSM diukur pada tingkat pendapatan rumah tangga. Jika ini gaji individu Anda di rumah tangga dengan beberapa pencari nafkah, kisaran rumah tangga Anda kemungkinan lebih tinggi.",
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

  // ── Home page — stats bar ──
  "home.stats.tools": { en: "calculators", ms: "kalkulator", id: "kalkulator" },
  "home.stats.locales": { en: "languages", ms: "bahasa", id: "bahasa" },
  "home.stats.updated": { en: "rates updated", ms: "kadar dikemaskini", id: "rate diperbarui" },
  "home.stats.free": { en: "free to use", ms: "percuma digunakan", id: "gratis digunakan" },

  // ── Home page — all tools section ──
  "home.allTools.title": { en: "All calculators", ms: "Semua kalkulator", id: "Semua kalkulator" },
  "home.allTools.subtitle": {
    en: "Pick a tool to get started — free, no sign-up required.",
    ms: "Pilih alat untuk bermula — percuma, tiada pendaftaran diperlukan.",
    id: "Pilih alat untuk memulai — gratis, tanpa perlu daftar.",
  },

  // ── Home page — features / why section ──
  "home.features.title": { en: "Why HelloKalku?", ms: "Kenapa HelloKalku?", id: "Kenapa HelloKalku?" },
  "home.features.accurate.title": { en: "Accurate 2026 rates", ms: "Kadar 2026 yang tepat", id: "Rate 2026 yang akurat" },
  "home.features.accurate.body": {
    en: "EPF, SOCSO, EIS, PCB tax brackets, and zakat nisab are reviewed annually against the latest Malaysian government and KWSP guidelines so your estimates stay reliable.",
    ms: "Kadar EPF, SOCSO, EIS, PCB, dan nisab zakat disemak setiap tahun mengikut garis panduan terkini kerajaan Malaysia dan KWSP supaya anggaran anda sentiasa tepat.",
    id: "Rate EPF, SOCSO, EIS, PCB, dan nisab zakat ditinjau setiap tahun sesuai panduan terkini pemerintah Malaysia dan KWSP agar estimasi Anda tetap andal.",
  },
  "home.features.malaysia.title": { en: "Built for Malaysia", ms: "Dibina untuk Malaysia", id: "Dibangun untuk Malaysia" },
  "home.features.malaysia.body": {
    en: "Every tool is built around Malaysian-specific rules: PCB progressive brackets, KWSP restructured accounts (Akaun Persaraan + Akaun Sejahtera), SOCSO and EIS caps, and Shariah-compliant inheritance under civil and Islamic law.",
    ms: "Setiap alat dibina mengikut peraturan khusus Malaysia: jadual PCB progresif, akaun KWSP yang direstruktur (Akaun Persaraan + Akaun Sejahtera), had SOCSO dan EIS, serta warisan patuh syariah di bawah undang-undang sivil dan Islam.",
    id: "Setiap alat dibangun sesuai aturan khusus Malaysia: jadwal PCB progresif, akun KWSP yang direstruktur (Akaun Persaraan + Akaun Sejahtera), batas SOCSO dan EIS, serta warisan sesuai syariah di bawah hukum sipil dan Islam.",
  },
  "home.features.multilingual.title": { en: "English, Malay & Indonesian", ms: "Inggeris, Melayu & Indonesia", id: "Inggris, Melayu & Indonesia" },
  "home.features.multilingual.body": {
    en: "Switch between English, Bahasa Malaysia, and Bahasa Indonesia at any time without losing your inputs. Useful for international professionals, expats, and cross-border families across Southeast Asia.",
    ms: "Tukar antara Bahasa Inggeris, Bahasa Malaysia, dan Bahasa Indonesia pada bila-bila masa tanpa kehilangan input anda. Berguna untuk profesional antarabangsa, ekspatriat, dan keluarga merentas sempadan di seluruh Asia Tenggara.",
    id: "Beralih antara Bahasa Inggris, Bahasa Malaysia, dan Bahasa Indonesia kapan saja tanpa kehilangan input Anda. Berguna untuk profesional internasional, ekspatriat, dan keluarga lintas batas di seluruh Asia Tenggara.",
  },
  "home.features.private.title": { en: "Private — no sign-up needed", ms: "Sulit — tiada pendaftaran diperlukan", id: "Pribadi — tanpa perlu daftar" },
  "home.features.private.body": {
    en: "All calculations run in your browser. No account, no email address, no data sent to our servers. Your salary figures and financial inputs stay on your device.",
    ms: "Semua pengiraan dijalankan dalam browser anda. Tiada akaun, tiada e-mel, tiada data dihantar ke pelayan kami. Angka gaji dan input kewangan anda kekal di peranti anda.",
    id: "Semua perhitungan berjalan di browser Anda. Tanpa akun, tanpa email, tanpa data yang dikirim ke server kami. Angka gaji dan input keuangan Anda tetap di perangkat Anda.",
  },

  // ── Home page — FAQ ──
  "home.faq.title": { en: "Frequently asked questions", ms: "Soalan yang sering ditanya", id: "Pertanyaan yang sering diajukan" },
  "home.faq.q1": { en: "Are the calculations accurate for 2026?", ms: "Adakah pengiraan tepat untuk 2026?", id: "Apakah perhitungan akurat untuk 2026?" },
  "home.faq.a1": {
    en: "Yes. HelloKalku uses 2026 statutory rates for EPF (11% employee / 12–13% employer), SOCSO, EIS (0.2%), and the current Malaysia resident income tax brackets (0%–30%). The zakat nisab is derived from the prevailing silver price per gram multiplied by 595g. These are estimates — for official payslip figures your employer's payroll system is the authoritative source.",
    ms: "Ya. HelloKalku menggunakan kadar berkanun 2026 untuk EPF (11% pekerja / 12–13% majikan), SOCSO, EIS (0.2%), dan jadual cukai pendapatan pemastautin Malaysia terkini (0%–30%). Nisab zakat dikira berdasarkan harga perak semasa per gram darab 595g. Ini adalah anggaran — untuk angka gaji rasmi, sistem penggajian majikan anda adalah sumber yang muktamad.",
    id: "Ya. HelloKalku menggunakan tarif berdasarkan undang-undang 2026 untuk EPF (11% karyawan / 12–13% majikan), SOCSO, EIS (0,2%), dan jadwal pajak penghasilan penduduk Malaysia saat ini (0%–30%). Nisab zakat diturunkan dari harga perak berlaku per gram dikalikan 595g. Ini adalah estimasi — untuk angka gaji resmi, sistem penggajian majikan Anda adalah sumber yang otoritatif.",
  },
  "home.faq.q2": { en: "Is HelloKalku free to use?", ms: "Adakah HelloKalku percuma digunakan?", id: "Apakah HelloKalku gratis digunakan?" },
  "home.faq.a2": {
    en: "Completely free. There is no subscription, no account, and no paywall. HelloKalku is supported by Google AdSense advertisements shown alongside the calculators.",
    ms: "Sepenuhnya percuma. Tiada langganan, tiada akaun, dan tiada paywall. HelloKalku disokong oleh iklan Google AdSense yang ditunjukkan bersama kalkulator.",
    id: "Sepenuhnya gratis. Tidak ada langganan, tidak ada akun, dan tidak ada paywall. HelloKalku didukung oleh iklan Google AdSense yang ditampilkan bersama kalkulator.",
  },
  "home.faq.q3": { en: "Which deductions does the salary calculator cover?", ms: "Apakah potongan yang diliputi kalkulator gaji?", id: "Potongan apa saja yang dicakup kalkulator gaji?" },
  "home.faq.a3": {
    en: "The salary calculator covers EPF (Kumpulan Wang Simpanan Pekerja / KWSP), SOCSO (PERKESO), EIS (Employment Insurance System / SIP), and PCB (Potongan Cukai Bulanan — the monthly income tax withholding). You can adjust the EPF employee rate, enter an annual bonus, declare additional reliefs, and switch between resident / non-resident and Malaysian / foreign worker tax profiles.",
    ms: "Kalkulator gaji merangkumi EPF (Kumpulan Wang Simpanan Pekerja / KWSP), SOCSO (PERKESO), EIS (Sistem Insurans Pekerjaan / SIP), dan PCB (Potongan Cukai Bulanan). Anda boleh melaraskan kadar EPF pekerja, memasukkan bonus tahunan, mengisytiharkan pelepasan tambahan, dan bertukar antara profil cukai pemastautin / bukan pemastautin dan pekerja Malaysia / asing.",
    id: "Kalkulator gaji mencakup EPF (Kumpulan Wang Simpanan Pekerja / KWSP), SOCSO (PERKESO), EIS (Sistem Asuransi Ketenagakerjaan / SIP), dan PCB (Potongan Cukai Bulanan). Anda dapat menyesuaikan tarif EPF karyawan, memasukkan bonus tahunan, mendeklarasikan potongan tambahan, dan beralih antara profil pajak penduduk / bukan penduduk dan pekerja Malaysia / asing.",
  },
  "home.faq.q4": { en: "How does the Faraid calculator differ from a regular inheritance tool?", ms: "Bagaimana kalkulator Faraid berbeza daripada alat waris biasa?", id: "Bagaimana kalkulator Faraid berbeda dari alat waris biasa?" },
  "home.faq.a4": {
    en: "Faraid is Islamic inheritance law derived from the Quran and Sunnah. Unlike general inheritance calculators, the Faraid calculator applies fixed Quranic shares (fard), residual shares (asabah), and blocking rules (hajb) — for example, a living father blocks the paternal grandfather, and sons receive twice a daughter's share. It also handles awl (proportional reduction when fixed shares exceed 100%) and radd (surplus returned to eligible heirs). Results are always accompanied by Quranic verse references.",
    ms: "Faraid adalah hukum waris Islam yang diambil daripada Al-Quran dan Sunnah. Berbeza dengan kalkulator waris biasa, kalkulator Faraid menggunakan bahagian tetap Al-Quran (fard), bahagian sisa (asabah), dan peraturan penyekatan (hajb) — contohnya, bapa yang masih hidup menyekat datuk, dan anak lelaki mendapat dua kali bahagian anak perempuan. Ia juga mengendalikan awl (pengurangan berkadar jika bahagian melebihi 100%) dan radd (lebihan dikembalikan kepada ahli waris). Keputusan sentiasa disertai rujukan ayat Al-Quran.",
    id: "Faraid adalah hukum waris Islam yang diambil dari Al-Quran dan Sunnah. Berbeda dengan kalkulator waris biasa, kalkulator Faraid menerapkan bagian tetap Al-Quran (fard), bagian sisa (asabah), dan aturan pemblokiran (hajb) — misalnya, ayah yang masih hidup memblokir kakek, dan anak laki-laki mendapat dua kali bagian anak perempuan. Ia juga menangani awl (pengurangan proporsional ketika bagian melebihi 100%) dan radd (surplus dikembalikan ke ahli waris yang berhak). Hasil selalu disertai referensi ayat Al-Quran.",
  },
  "home.faq.q5": { en: "Can I use HelloKalku on my phone?", ms: "Bolehkah saya menggunakan HelloKalku di telefon?", id: "Bisakah saya menggunakan HelloKalku di ponsel?" },
  "home.faq.a5": {
    en: "Yes. HelloKalku is designed mobile-first. All calculators resize automatically to any screen width and are tested on iOS and Android browsers. The layout adapts from a single column on phones to a multi-column layout on tablets and desktops. Results, charts, and PDF exports work on mobile too.",
    ms: "Ya. HelloKalku direka mengutamakan mudah alih. Semua kalkulator ubah saiz secara automatik mengikut mana-mana lebar skrin dan diuji pada pelayar iOS dan Android. Susun atur berubah daripada satu lajur pada telefon kepada susun atur berbilang lajur pada tablet dan komputer riba. Keputusan, carta, dan eksport PDF juga berfungsi pada mudah alih.",
    id: "Ya. HelloKalku dirancang mengutamakan mobile. Semua kalkulator menyesuaikan ukuran secara otomatis ke lebar layar apa pun dan diuji pada browser iOS dan Android. Tata letak beradaptasi dari satu kolom di ponsel ke tata letak multi-kolom di tablet dan desktop. Hasil, grafik, dan ekspor PDF juga berfungsi di mobile.",
  },
  "home.search.placeholder": { en: "Search calculators…", ms: "Cari kalkulator…", id: "Cari kalkulator…" },
  "home.search.noResults": { en: "No calculators match your search.", ms: "Tiada kalkulator sepadan dengan carian anda.", id: "Tidak ada kalkulator yang cocok dengan pencarian Anda." },
  "home.search.clear": { en: "Clear search", ms: "Kosongkan carian", id: "Kosongkan pencarian" },
  "home.recentlyUsed.title": { en: "Recently used", ms: "Baru digunakan", id: "Baru digunakan" },

  // ── Common (shared) ──────────────────────────────────────────────
  "common.yes": { en: "Yes", ms: "Ya", id: "Ya" },
  "common.no": { en: "No", ms: "Tidak", id: "Tidak" },

  // ── Tool catalogue + nav group (Home & nav) ──────────────────────
  "nav.groupHealth": { en: "Health", ms: "Kesihatan", id: "Kesehatan" },
  "nav.housing": { en: "Housing Loan", ms: "Pinjaman Perumahan", id: "Pinjaman Rumah" },
  "nav.tax": { en: "Income Tax", ms: "Cukai Pendapatan", id: "Pajak Penghasilan" },
  "nav.bmi": { en: "BMI", ms: "BMI", id: "BMI" },
  "home.category.Health.desc": {
    en: "Everyday body and fitness calculators.",
    ms: "Kalkulator badan dan kecergasan harian.",
    id: "Kalkulator tubuh dan kebugaran harian.",
  },
  "tools.housing-loan-calculator.name": {
    en: "Housing Loan Calculator (Malaysia)",
    ms: "Kalkulator Pinjaman Perumahan (Malaysia)",
    id: "Kalkulator KPR (Malaysia)",
  },
  "tools.housing-loan-calculator.desc": {
    en: "Monthly home loan repayment plus stamp duty, legal fees, and total upfront cash needed.",
    ms: "Ansuran bulanan pinjaman rumah berserta duti setem, yuran guaman, dan jumlah tunai pendahuluan.",
    id: "Cicilan bulanan pinjaman rumah plus bea meterai, biaya hukum, dan total uang muka.",
  },
  "tools.housing-loan-calculator.badge": { en: "New", ms: "Baharu", id: "Baru" },
  "tools.income-tax-calculator.name": {
    en: "Income Tax Calculator 2026",
    ms: "Kalkulator Cukai Pendapatan 2026",
    id: "Kalkulator Pajak Penghasilan 2026",
  },
  "tools.income-tax-calculator.desc": {
    en: "Estimate your Malaysia income tax with reliefs, rebates, and effective rate for YA 2026.",
    ms: "Anggarkan cukai pendapatan Malaysia anda dengan pelepasan, rebat, dan kadar berkesan untuk TT 2026.",
    id: "Perkirakan pajak penghasilan Malaysia Anda dengan keringanan, rebat, dan tarif efektif untuk TP 2026.",
  },
  "tools.income-tax-calculator.badge": { en: "New", ms: "Baharu", id: "Baru" },
  "tools.bmi-calculator.name": {
    en: "BMI Calculator (with BMR & Calories)",
    ms: "Kalkulator BMI (dengan BMR & Kalori)",
    id: "Kalkulator BMI (dengan BMR & Kalori)",
  },
  "tools.bmi-calculator.desc": {
    en: "Check your BMI, healthy weight range, BMR, and daily calorie needs (TDEE).",
    ms: "Semak BMI anda, julat berat sihat, BMR, dan keperluan kalori harian (TDEE).",
    id: "Periksa BMI Anda, rentang berat sehat, BMR, dan kebutuhan kalori harian (TDEE).",
  },

  // ── Housing loan calculator ──────────────────────────────────────
  "housing.title": {
    en: "Malaysia Housing Loan Calculator",
    ms: "Kalkulator Pinjaman Perumahan Malaysia",
    id: "Kalkulator Pinjaman Rumah Malaysia",
  },
  "housing.subtitle": {
    en: "Work out your monthly home loan repayment plus the stamp duty, legal fees, and total cash you need upfront.",
    ms: "Kira ansuran bulanan pinjaman rumah anda berserta duti setem, yuran guaman, dan jumlah tunai pendahuluan yang diperlukan.",
    id: "Hitung cicilan bulanan pinjaman rumah Anda plus bea meterai, biaya hukum, dan total uang muka yang dibutuhkan.",
  },
  "housing.badge": { en: "2026 stamp duty", ms: "Duti setem 2026", id: "Bea meterai 2026" },
  "housing.badge.private": { en: "Runs in your browser", ms: "Berjalan dalam pelayar anda", id: "Berjalan di browser Anda" },
  "housing.monthlyInstallment": { en: "Monthly installment", ms: "Ansuran bulanan", id: "Cicilan bulanan" },
  "housing.over": { en: "over", ms: "selama", id: "selama" },
  "housing.years": { en: "years", ms: "tahun", id: "tahun" },
  "housing.cta.tapToReveal": { en: "Enter details and calculate", ms: "Masukkan butiran dan kira", id: "Masukkan detail dan hitung" },
  "housing.cta.calculate": { en: "Calculate", ms: "Kira", id: "Hitung" },
  "housing.cta.recalculate": { en: "Recalculate", ms: "Kira Semula", id: "Hitung Ulang" },
  "housing.inputs.title": { en: "Loan details", ms: "Butiran pinjaman", id: "Detail pinjaman" },
  "housing.inputs.subtitle": { en: "Adjust the figures to match your purchase.", ms: "Laraskan angka mengikut pembelian anda.", id: "Sesuaikan angka dengan pembelian Anda." },
  "housing.inputs.price": { en: "Property price (RM)", ms: "Harga hartanah (RM)", id: "Harga properti (RM)" },
  "housing.inputs.downPct": { en: "Down payment", ms: "Bayaran pendahuluan", id: "Uang muka" },
  "housing.inputs.downPct.hint": { en: "Usually 10% for a sub-sale or completed home.", ms: "Biasanya 10% untuk rumah sub-jual atau siap.", id: "Biasanya 10% untuk rumah jadi." },
  "housing.inputs.tenure": { en: "Loan tenure", ms: "Tempoh pinjaman", id: "Tenor pinjaman" },
  "housing.inputs.rate": { en: "Interest rate (p.a.)", ms: "Kadar faedah (setahun)", id: "Suku bunga (per tahun)" },
  "housing.inputs.rate.hint": { en: "Typical Malaysian home loan rate is 3.8%–4.5%.", ms: "Kadar pinjaman rumah Malaysia biasanya 3.8%–4.5%.", id: "Suku bunga KPR Malaysia umumnya 3,8%–4,5%." },
  "housing.inputs.firstHome": { en: "First-home buyer?", ms: "Pembeli rumah pertama?", id: "Pembeli rumah pertama?" },
  "housing.inputs.firstHome.hint": {
    en: "First-home buyers get full stamp duty exemption when the price is RM500,000 or below.",
    ms: "Pembeli rumah pertama mendapat pengecualian penuh duti setem apabila harga RM500,000 atau ke bawah.",
    id: "Pembeli rumah pertama mendapat pembebasan penuh bea meterai jika harga RM500.000 atau di bawahnya.",
  },
  "housing.disclaimer": {
    en: "Estimates only. Stamp duty and legal fee scales follow 2026 published rates; valuation and disbursements are typical figures, and banks may quote different interest and insurance costs. Confirm with your lawyer and bank.",
    ms: "Anggaran sahaja. Skala duti setem dan yuran guaman mengikut kadar 2026 yang diterbitkan; penilaian dan wang panjar adalah angka biasa, dan bank mungkin menyebut kos faedah dan insurans berbeza. Sahkan dengan peguam dan bank anda.",
    id: "Hanya perkiraan. Skala bea meterai dan biaya hukum mengikuti tarif 2026; penilaian dan biaya pencairan adalah angka umum, dan bank mungkin mengutip bunga dan biaya asuransi berbeda. Konfirmasikan dengan pengacara dan bank Anda.",
  },
  "housing.breakdown.ready": { en: "Your repayment breakdown", ms: "Pecahan bayaran balik anda", id: "Rincian pembayaran Anda" },
  "housing.breakdown.hint": { en: "Enter your property price and tap Calculate to see the full cost.", ms: "Masukkan harga hartanah dan tekan Kira untuk melihat kos penuh.", id: "Masukkan harga properti dan tekan Hitung untuk melihat biaya penuh." },
  "housing.loanAmount": { en: "Loan amount", ms: "Jumlah pinjaman", id: "Jumlah pinjaman" },
  "housing.totalInterest": { en: "Total interest", ms: "Jumlah faedah", id: "Total bunga" },
  "housing.upfront.title": { en: "Upfront cost breakdown", ms: "Pecahan kos pendahuluan", id: "Rincian biaya di muka" },
  "housing.upfront.subtitle": { en: "Cash you need before keys are handed over.", ms: "Tunai yang diperlukan sebelum kunci diserahkan.", id: "Uang tunai yang dibutuhkan sebelum serah terima kunci." },
  "housing.downPayment": { en: "Down payment", ms: "Bayaran pendahuluan", id: "Uang muka" },
  "housing.ofPrice": { en: "of property price", ms: "daripada harga hartanah", id: "dari harga properti" },
  "housing.motStampDuty": { en: "Stamp duty (transfer / MOT)", ms: "Duti setem (pindah milik / MOT)", id: "Bea meterai (pengalihan / MOT)" },
  "housing.motStampDuty.hint": { en: "Tiered 1%–4% on the property price.", ms: "Berperingkat 1%–4% atas harga hartanah.", id: "Bertingkat 1%–4% atas harga properti." },
  "housing.loanStampDuty": { en: "Stamp duty (loan agreement)", ms: "Duti setem (perjanjian pinjaman)", id: "Bea meterai (perjanjian pinjaman)" },
  "housing.loanStampDuty.hint": { en: "0.5% of the loan amount.", ms: "0.5% daripada jumlah pinjaman.", id: "0,5% dari jumlah pinjaman." },
  "housing.legalFees": { en: "Legal fees (SPA + loan)", ms: "Yuran guaman (SPA + pinjaman)", id: "Biaya hukum (SPA + pinjaman)" },
  "housing.legalFees.hint": { en: "Scale fees on the SPA and loan agreement.", ms: "Yuran berskala atas SPA dan perjanjian pinjaman.", id: "Biaya skala atas SPA dan perjanjian pinjaman." },
  "housing.exempt": { en: "Exempted (first-home buyer)", ms: "Dikecualikan (rumah pertama)", id: "Dibebaskan (rumah pertama)" },
  "housing.totalUpfront": { en: "Total upfront cash", ms: "Jumlah tunai pendahuluan", id: "Total uang muka" },
  "housing.totalUpfront.hint": { en: "Down payment + stamp duty + legal fees.", ms: "Bayaran pendahuluan + duti setem + yuran guaman.", id: "Uang muka + bea meterai + biaya hukum." },
  "housing.inputs.buyerType": { en: "Buyer type", ms: "Jenis pembeli", id: "Tipe pembeli" },
  "housing.buyerType.citizen": { en: "Malaysian citizen", ms: "Warganegara Malaysia", id: "Warga negara Malaysia" },
  "housing.buyerType.pr": { en: "Permanent resident", ms: "Penduduk tetap", id: "Penduduk tetap" },
  "housing.buyerType.foreigner": { en: "Non-citizen / foreign company", ms: "Bukan warganegara / syarikat asing", id: "Non-warga negara / perusahaan asing" },
  "housing.buyerType.hint": {
    en: "Non-citizens pay a flat 8% transfer stamp duty from 1 Jan 2026. Permanent residents pay the normal tiers.",
    ms: "Bukan warganegara membayar duti setem pindah milik rata 8% mulai 1 Jan 2026. Penduduk tetap membayar kadar berperingkat biasa.",
    id: "Non-warga negara membayar bea meterai pengalihan flat 8% mulai 1 Jan 2026. Penduduk tetap membayar tarif bertingkat biasa.",
  },
  "housing.foreignRate": { en: "Flat 8% (non-citizen rate)", ms: "Rata 8% (kadar bukan warganegara)", id: "Flat 8% (tarif non-warga negara)" },
  "housing.firstHome.eligibility": {
    en: "Full exemption up to RM500,000, extended to 31 Dec 2027. Malaysian citizens only, and you must never have owned a residential property.",
    ms: "Pengecualian penuh sehingga RM500,000, dilanjutkan hingga 31 Dis 2027. Warganegara Malaysia sahaja, dan anda tidak pernah memiliki hartanah kediaman.",
    id: "Pembebasan penuh hingga RM500.000, diperpanjang sampai 31 Des 2027. Hanya warga negara Malaysia, dan Anda belum pernah memiliki properti hunian.",
  },
  "housing.developerPackage": { en: "Developer package", ms: "Pakej pemaju", id: "Paket pengembang" },
  "housing.developerPackage.hint": { en: "Common on new launches. Leave off for a sub-sale.", ms: "Biasa untuk pelancaran baharu. Biarkan mati untuk sub-jual.", id: "Umum pada peluncuran baru. Biarkan mati untuk rumah second." },
  "housing.inputs.rebate": { en: "Developer rebate", ms: "Rebat pemaju", id: "Rabat pengembang" },
  "housing.inputs.rebate.hint": { en: "Offsets your cash. The bank still finances against the full price.", ms: "Mengurangkan tunai anda. Bank tetap membiayai atas harga penuh.", id: "Mengurangi uang tunai Anda. Bank tetap membiayai atas harga penuh." },
  "housing.inputs.absorbLegal": { en: "Developer pays legal fees", ms: "Pemaju bayar yuran guaman", id: "Pengembang bayar biaya hukum" },
  "housing.inputs.absorbMot": { en: "Developer pays MOT stamp duty", ms: "Pemaju bayar duti setem MOT", id: "Pengembang bayar bea meterai MOT" },
  "housing.inputs.mrta": { en: "MRTA / MLTA premium (RM)", ms: "Premium MRTA / MLTA (RM)", id: "Premi MRTA / MLTA (RM)" },
  "housing.inputs.mrta.hint": { en: "Leave at 0 if you are not taking mortgage insurance.", ms: "Biarkan 0 jika anda tidak mengambil insurans pinjaman.", id: "Biarkan 0 jika Anda tidak mengambil asuransi KPR." },
  "housing.inputs.financeMrta": { en: "Add the premium into the loan", ms: "Masukkan premium ke dalam pinjaman", id: "Masukkan premi ke dalam pinjaman" },
  "housing.inputs.extraMonthly": { en: "Extra payment per month (RM)", ms: "Bayaran tambahan sebulan (RM)", id: "Pembayaran ekstra per bulan (RM)" },
  "housing.inputs.extraMonthly.hint": { en: "Paid straight to principal on top of your instalment.", ms: "Dibayar terus kepada pokok selain ansuran anda.", id: "Dibayar langsung ke pokok di luar cicilan Anda." },
  "housing.coveredByDeveloper": { en: "Covered by developer", ms: "Ditanggung pemaju", id: "Ditanggung pengembang" },
  "housing.valuationFee": { en: "Valuation fee", ms: "Yuran penilaian", id: "Biaya penilaian" },
  "housing.valuationFee.hint": { en: "Scale fee on the property price.", ms: "Yuran berskala atas harga hartanah.", id: "Biaya skala atas harga properti." },
  "housing.disbursements": { en: "Legal disbursements", ms: "Wang panjar guaman", id: "Biaya pencairan hukum" },
  "housing.disbursements.hint": { en: "Estimate — searches, registration and travelling.", ms: "Anggaran — carian, pendaftaran dan perjalanan.", id: "Perkiraan — pencarian, pendaftaran dan perjalanan." },
  "housing.mrtaUpfront": { en: "MRTA / MLTA premium", ms: "Premium MRTA / MLTA", id: "Premi MRTA / MLTA" },
  "housing.mrtaFinanced": { en: "Financed into the loan", ms: "Dibiayai dalam pinjaman", id: "Dibiayai dalam pinjaman" },
  "housing.rebateApplied": { en: "Less developer rebate", ms: "Tolak rebat pemaju", id: "Dikurangi rabat pengembang" },
  "housing.netCash": { en: "Net cash required", ms: "Tunai bersih diperlukan", id: "Uang tunai bersih dibutuhkan" },
  "housing.netCash.hint": { en: "What you actually need before keys are handed over.", ms: "Apa yang anda benar-benar perlukan sebelum kunci diserahkan.", id: "Yang benar-benar Anda butuhkan sebelum serah terima kunci." },
  "housing.rebateSurplus": { en: "Rebate left over", ms: "Baki rebat", id: "Sisa rabat" },
  "housing.rebateSurplus.hint": { en: "Your rebate covers every upfront cost, with this much to spare.", ms: "Rebat anda menampung semua kos pendahuluan, dengan lebihan sebanyak ini.", id: "Rabat Anda menutup semua biaya di muka, dengan sisa sebanyak ini." },
  "housing.savings.title": { en: "Extra repayment savings", ms: "Penjimatan bayaran tambahan", id: "Penghematan pembayaran ekstra" },
  "housing.savings.interest": { en: "Interest saved", ms: "Faedah dijimatkan", id: "Bunga dihemat" },
  "housing.savings.time": { en: "Loan paid off earlier by", ms: "Pinjaman selesai lebih awal", id: "Pinjaman lunas lebih cepat" },
  "housing.savings.yearsMonths": { en: "{years}y {months}m", ms: "{years}t {months}b", id: "{years}t {months}b" },
  "housing.schedule.title": { en: "Yearly repayment schedule", ms: "Jadual bayaran balik tahunan", id: "Jadwal pembayaran tahunan" },
  "housing.schedule.show": { en: "Show schedule", ms: "Tunjuk jadual", id: "Tampilkan jadwal" },
  "housing.schedule.hide": { en: "Hide schedule", ms: "Sembunyi jadual", id: "Sembunyikan jadwal" },
  "housing.schedule.year": { en: "Year", ms: "Tahun", id: "Tahun" },
  "housing.schedule.principal": { en: "Principal", ms: "Pokok", id: "Pokok" },
  "housing.schedule.interest": { en: "Interest", ms: "Faedah", id: "Bunga" },
  "housing.schedule.balance": { en: "Balance", ms: "Baki", id: "Saldo" },

  // ── Income tax calculator ────────────────────────────────────────
  "tax.title": { en: "Malaysia Income Tax Calculator 2026", ms: "Kalkulator Cukai Pendapatan Malaysia 2026", id: "Kalkulator Pajak Penghasilan Malaysia 2026" },
  "tax.subtitle": {
    en: "Estimate your YA 2026 income tax after reliefs and rebates, and see your effective rate and monthly PCB.",
    ms: "Anggarkan cukai pendapatan TT 2026 anda selepas pelepasan dan rebat, serta lihat kadar berkesan dan PCB bulanan.",
    id: "Perkirakan pajak penghasilan TP 2026 Anda setelah keringanan dan rebat, serta lihat tarif efektif dan PCB bulanan.",
  },
  "tax.badge": { en: "YA 2026 rates", ms: "Kadar TT 2026", id: "Tarif TP 2026" },
  "tax.badge.private": { en: "Runs in your browser", ms: "Berjalan dalam pelayar anda", id: "Berjalan di browser Anda" },
  "tax.taxPayable": { en: "Tax payable", ms: "Cukai kena dibayar", id: "Pajak terutang" },
  "tax.effectiveRate": { en: "Effective rate", ms: "Kadar berkesan", id: "Tarif efektif" },
  "tax.effectiveRateLabel": { en: "Effective tax rate", ms: "Kadar cukai berkesan", id: "Tarif pajak efektif" },
  "tax.cta.tapToReveal": { en: "Enter income and calculate", ms: "Masukkan pendapatan dan kira", id: "Masukkan penghasilan dan hitung" },
  "tax.cta.calculate": { en: "Calculate", ms: "Kira", id: "Hitung" },
  "tax.cta.recalculate": { en: "Recalculate", ms: "Kira Semula", id: "Hitung Ulang" },
  "tax.inputs.title": { en: "Your income & reliefs", ms: "Pendapatan & pelepasan anda", id: "Penghasilan & keringanan Anda" },
  "tax.inputs.subtitle": { en: "Personal relief of RM9,000 is applied automatically.", ms: "Pelepasan diri RM9,000 dikira secara automatik.", id: "Keringanan pribadi RM9.000 diterapkan otomatis." },
  "tax.inputs.income": { en: "Annual chargeable income (RM)", ms: "Pendapatan tahunan (RM)", id: "Penghasilan tahunan (RM)" },
  "tax.inputs.income.hint": { en: "Total annual employment / business income before reliefs.", ms: "Jumlah pendapatan pekerjaan / perniagaan tahunan sebelum pelepasan.", id: "Total penghasilan kerja / usaha tahunan sebelum keringanan." },
  "tax.reliefs.title": { en: "Tax reliefs", ms: "Pelepasan cukai", id: "Keringanan pajak" },
  "tax.reliefs.subtitle": { en: "Enter the amounts you can claim — caps are applied for you.", ms: "Masukkan jumlah yang boleh dituntut — had dikira untuk anda.", id: "Masukkan jumlah yang dapat diklaim — batas diterapkan untuk Anda." },
  "tax.inputs.epfLife": { en: "EPF + life insurance (RM)", ms: "EPF + insurans hayat (RM)", id: "EPF + asuransi jiwa (RM)" },
  "tax.inputs.epfLife.hint": { en: "Capped at RM7,000.", ms: "Had RM7,000.", id: "Batas RM7.000." },
  "tax.inputs.lifestyle": { en: "Lifestyle (RM)", ms: "Gaya hidup (RM)", id: "Gaya hidup (RM)" },
  "tax.inputs.lifestyle.hint": { en: "Books, devices, internet — capped at RM2,500.", ms: "Buku, peranti, internet — had RM2,500.", id: "Buku, perangkat, internet — batas RM2.500." },
  "tax.inputs.medical": { en: "Medical (RM)", ms: "Perubatan (RM)", id: "Medis (RM)" },
  "tax.inputs.medical.hint": { en: "Self, parents, serious illness — capped at RM10,000.", ms: "Diri, ibu bapa, penyakit serius — had RM10,000.", id: "Diri, orang tua, penyakit serius — batas RM10.000." },
  "tax.inputs.education": { en: "Education / SSPN (RM)", ms: "Pendidikan / SSPN (RM)", id: "Pendidikan / SSPN (RM)" },
  "tax.inputs.education.hint": { en: "Self-education or SSPN net deposit — capped at RM8,000.", ms: "Pendidikan sendiri atau deposit bersih SSPN — had RM8,000.", id: "Pendidikan sendiri atau setoran bersih SSPN — batas RM8.000." },
  "tax.inputs.children": { en: "Number of children", ms: "Bilangan anak", id: "Jumlah anak" },
  "tax.inputs.children.hint": { en: "RM2,000 relief per child.", ms: "Pelepasan RM2,000 setiap anak.", id: "Keringanan RM2.000 per anak." },
  "tax.inputs.spouse": { en: "Spouse relief?", ms: "Pelepasan pasangan?", id: "Keringanan pasangan?" },
  "tax.inputs.spouse.hint": { en: "RM4,000 if your spouse has no income.", ms: "RM4,000 jika pasangan tiada pendapatan.", id: "RM4.000 jika pasangan tanpa penghasilan." },
  "tax.disclaimer": {
    en: "Estimates only, based on resident individual rates for YA 2026. Actual tax depends on all eligible reliefs and LHDN assessment. Not tax advice.",
    ms: "Anggaran sahaja, berdasarkan kadar individu pemastautin TT 2026. Cukai sebenar bergantung pada semua pelepasan layak dan taksiran LHDN. Bukan nasihat cukai.",
    id: "Hanya perkiraan, berdasarkan tarif individu penduduk TP 2026. Pajak sebenarnya bergantung pada semua keringanan yang memenuhi syarat dan penilaian LHDN. Bukan nasihat pajak.",
  },
  "tax.breakdown.ready": { en: "Your tax breakdown", ms: "Pecahan cukai anda", id: "Rincian pajak Anda" },
  "tax.breakdown.hint": { en: "Enter your annual income and tap Calculate.", ms: "Masukkan pendapatan tahunan dan tekan Kira.", id: "Masukkan penghasilan tahunan dan tekan Hitung." },
  "tax.monthlyPcb": { en: "Approx. monthly PCB", ms: "Anggaran PCB bulanan", id: "Perkiraan PCB bulanan" },
  "tax.breakdown.title": { en: "How your tax is worked out", ms: "Cara cukai anda dikira", id: "Cara pajak Anda dihitung" },
  "tax.breakdown.subtitle": { en: "From gross income down to tax payable.", ms: "Daripada pendapatan kasar hingga cukai kena dibayar.", id: "Dari penghasilan bruto hingga pajak terutang." },
  "tax.totalReliefs": { en: "Total reliefs", ms: "Jumlah pelepasan", id: "Total keringanan" },
  "tax.totalReliefs.hint": { en: "Includes RM9,000 personal relief.", ms: "Termasuk pelepasan diri RM9,000.", id: "Termasuk keringanan pribadi RM9.000." },
  "tax.chargeableIncome": { en: "Chargeable income", ms: "Pendapatan bercukai", id: "Penghasilan kena pajak" },
  "tax.chargeableIncome.hint": { en: "Income after all reliefs.", ms: "Pendapatan selepas semua pelepasan.", id: "Penghasilan setelah semua keringanan." },
  "tax.taxBeforeRebate": { en: "Tax before rebate", ms: "Cukai sebelum rebat", id: "Pajak sebelum rebat" },
  "tax.taxBeforeRebate.hint": { en: "Progressive bands applied.", ms: "Kadar berperingkat dikira.", id: "Tarif progresif diterapkan." },
  "tax.rebate": { en: "Rebate", ms: "Rebat", id: "Rebat" },
  "tax.rebate.hint": { en: "RM400 when chargeable income ≤ RM35,000.", ms: "RM400 apabila pendapatan bercukai ≤ RM35,000.", id: "RM400 jika penghasilan kena pajak ≤ RM35.000." },

  // ── BMI calculator ───────────────────────────────────────────────
  "bmi.title": { en: "BMI Calculator (with BMR & Calories)", ms: "Kalkulator BMI (dengan BMR & Kalori)", id: "Kalkulator BMI (dengan BMR & Kalori)" },
  "bmi.subtitle": {
    en: "Find your Body Mass Index, healthy weight range, and the daily calories you need to maintain your weight.",
    ms: "Cari Indeks Jisim Badan, julat berat sihat, dan kalori harian yang diperlukan untuk mengekalkan berat anda.",
    id: "Temukan Indeks Massa Tubuh, rentang berat sehat, dan kalori harian yang dibutuhkan untuk menjaga berat Anda.",
  },
  "bmi.badge": { en: "WHO categories", ms: "Kategori WHO", id: "Kategori WHO" },
  "bmi.badge.private": { en: "Runs in your browser", ms: "Berjalan dalam pelayar anda", id: "Berjalan di browser Anda" },
  "bmi.yourBmi": { en: "Your BMI", ms: "BMI anda", id: "BMI Anda" },
  "bmi.cta.tapToReveal": { en: "Enter details and calculate", ms: "Masukkan butiran dan kira", id: "Masukkan detail dan hitung" },
  "bmi.cta.calculate": { en: "Calculate", ms: "Kira", id: "Hitung" },
  "bmi.cta.recalculate": { en: "Recalculate", ms: "Kira Semula", id: "Hitung Ulang" },
  "bmi.inputs.title": { en: "Your measurements", ms: "Ukuran anda", id: "Pengukuran Anda" },
  "bmi.inputs.subtitle": { en: "Used to compute BMI, BMR, and calorie needs.", ms: "Digunakan untuk mengira BMI, BMR, dan keperluan kalori.", id: "Digunakan untuk menghitung BMI, BMR, dan kebutuhan kalori." },
  "bmi.inputs.height": { en: "Height", ms: "Tinggi", id: "Tinggi" },
  "bmi.inputs.weight": { en: "Weight", ms: "Berat", id: "Berat" },
  "bmi.inputs.age": { en: "Age", ms: "Umur", id: "Usia" },
  "bmi.years": { en: "yrs", ms: "thn", id: "thn" },
  "bmi.inputs.sex": { en: "Sex", ms: "Jantina", id: "Jenis kelamin" },
  "bmi.sex.male": { en: "Male", ms: "Lelaki", id: "Pria" },
  "bmi.sex.female": { en: "Female", ms: "Perempuan", id: "Wanita" },
  "bmi.inputs.activity": { en: "Activity level", ms: "Tahap aktiviti", id: "Tingkat aktivitas" },
  "bmi.inputs.activity.hint": { en: "Used to estimate your daily calorie needs (TDEE).", ms: "Digunakan untuk menganggar keperluan kalori harian (TDEE).", id: "Digunakan untuk memperkirakan kebutuhan kalori harian (TDEE)." },
  "bmi.activity.sedentary": { en: "Sedentary (little/no exercise)", ms: "Tidak aktif (sedikit/tiada senaman)", id: "Tidak aktif (sedikit/tanpa olahraga)" },
  "bmi.activity.light": { en: "Light (1–3 days/week)", ms: "Ringan (1–3 hari/minggu)", id: "Ringan (1–3 hari/minggu)" },
  "bmi.activity.moderate": { en: "Moderate (3–5 days/week)", ms: "Sederhana (3–5 hari/minggu)", id: "Sedang (3–5 hari/minggu)" },
  "bmi.activity.active": { en: "Active (6–7 days/week)", ms: "Aktif (6–7 hari/minggu)", id: "Aktif (6–7 hari/minggu)" },
  "bmi.activity.very": { en: "Very active (physical job/training)", ms: "Sangat aktif (kerja fizikal/latihan)", id: "Sangat aktif (kerja fisik/latihan)" },
  "bmi.disclaimer": {
    en: "BMI is a general screening tool and does not account for muscle mass, body composition, or ethnicity. Consult a healthcare professional for medical advice.",
    ms: "BMI ialah alat saringan umum dan tidak mengambil kira jisim otot, komposisi badan, atau etnik. Rujuk profesional kesihatan untuk nasihat perubatan.",
    id: "BMI adalah alat skrining umum dan tidak memperhitungkan massa otot, komposisi tubuh, atau etnis. Konsultasikan dengan tenaga kesehatan untuk nasihat medis.",
  },
  "bmi.breakdown.ready": { en: "Your health snapshot", ms: "Ringkasan kesihatan anda", id: "Ringkasan kesehatan Anda" },
  "bmi.breakdown.hint": { en: "Enter your height and weight, then tap Calculate.", ms: "Masukkan tinggi dan berat anda, kemudian tekan Kira.", id: "Masukkan tinggi dan berat Anda, lalu tekan Hitung." },
  "bmi.category": { en: "Category", ms: "Kategori", id: "Kategori" },
  "bmi.category.underweight": { en: "Underweight", ms: "Kurang berat", id: "Berat kurang" },
  "bmi.category.normal": { en: "Normal weight", ms: "Berat normal", id: "Berat normal" },
  "bmi.category.overweight": { en: "Overweight", ms: "Berlebihan berat", id: "Kelebihan berat" },
  "bmi.category.obese": { en: "Obese", ms: "Obes", id: "Obesitas" },
  "bmi.healthyRange": { en: "Healthy weight range for your height", ms: "Julat berat sihat untuk tinggi anda", id: "Rentang berat sehat untuk tinggi Anda" },
  "bmi.bmr": { en: "BMR", ms: "BMR", id: "BMR" },
  "bmi.bmr.hint": { en: "Calories burned at complete rest.", ms: "Kalori dibakar semasa rehat sepenuhnya.", id: "Kalori yang terbakar saat istirahat total." },
  "bmi.tdee": { en: "Daily calories (TDEE)", ms: "Kalori harian (TDEE)", id: "Kalori harian (TDEE)" },
  "bmi.tdee.hint": { en: "To maintain your current weight.", ms: "Untuk mengekalkan berat semasa anda.", id: "Untuk mempertahankan berat Anda saat ini." },

  // ── Car loan + Fixed deposit nav & catalogue ─────────────────────
  "nav.carloan": { en: "Car Loan", ms: "Pinjaman Kereta", id: "Kredit Mobil" },
  "nav.fd": { en: "Fixed Deposit", ms: "Simpanan Tetap", id: "Deposito" },
  "tools.car-loan-calculator.name": {
    en: "Car Loan Calculator (Malaysia)",
    ms: "Kalkulator Pinjaman Kereta (Malaysia)",
    id: "Kalkulator Kredit Mobil (Malaysia)",
  },
  "tools.car-loan-calculator.desc": {
    en: "Monthly hire purchase instalment from the flat rate, plus the true effective interest cost.",
    ms: "Ansuran sewa beli bulanan daripada kadar rata, berserta kos faedah berkesan sebenar.",
    id: "Cicilan sewa beli bulanan dari suku bunga flat, plus biaya bunga efektif sebenarnya.",
  },
  "tools.car-loan-calculator.badge": { en: "New", ms: "Baharu", id: "Baru" },
  "tools.fixed-deposit-calculator.name": {
    en: "Fixed Deposit Calculator (Malaysia)",
    ms: "Kalkulator Simpanan Tetap (Malaysia)",
    id: "Kalkulator Deposito (Malaysia)",
  },
  "tools.fixed-deposit-calculator.desc": {
    en: "Maturity value and interest earned on a fixed deposit, with auto-renewal compounding.",
    ms: "Nilai matang dan faedah diperoleh atas simpanan tetap, dengan pengkompaunan pembaharuan automatik.",
    id: "Nilai jatuh tempo dan bunga deposito, dengan bunga majemuk perpanjangan otomatis.",
  },
  "tools.fixed-deposit-calculator.badge": { en: "New", ms: "Baharu", id: "Baru" },

  // ── Car loan calculator ──────────────────────────────────────────
  "carloan.title": { en: "Malaysia Car Loan Calculator", ms: "Kalkulator Pinjaman Kereta Malaysia", id: "Kalkulator Kredit Mobil Malaysia" },
  "carloan.subtitle": {
    en: "Work out your monthly hire purchase instalment from the flat rate — and see the true effective interest you actually pay.",
    ms: "Kira ansuran sewa beli bulanan anda daripada kadar rata — dan lihat faedah berkesan sebenar yang anda bayar.",
    id: "Hitung cicilan sewa beli bulanan Anda dari suku bunga flat — dan lihat bunga efektif sebenarnya yang Anda bayar.",
  },
  "carloan.badge": { en: "Flat-rate HP", ms: "Sewa beli kadar rata", id: "Sewa beli flat" },
  "carloan.badge.private": { en: "Runs in your browser", ms: "Berjalan dalam pelayar anda", id: "Berjalan di browser Anda" },
  "carloan.monthlyInstalment": { en: "Monthly instalment", ms: "Ansuran bulanan", id: "Cicilan bulanan" },
  "carloan.over": { en: "over", ms: "selama", id: "selama" },
  "carloan.years": { en: "years", ms: "tahun", id: "tahun" },
  "carloan.cta.tapToReveal": { en: "Enter details and calculate", ms: "Masukkan butiran dan kira", id: "Masukkan detail dan hitung" },
  "carloan.cta.calculate": { en: "Calculate", ms: "Kira", id: "Hitung" },
  "carloan.cta.recalculate": { en: "Recalculate", ms: "Kira Semula", id: "Hitung Ulang" },
  "carloan.inputs.title": { en: "Loan details", ms: "Butiran pinjaman", id: "Detail pinjaman" },
  "carloan.inputs.subtitle": { en: "Adjust the figures to match your purchase.", ms: "Laraskan angka mengikut pembelian anda.", id: "Sesuaikan angka dengan pembelian Anda." },
  "carloan.inputs.price": { en: "Vehicle price (RM)", ms: "Harga kenderaan (RM)", id: "Harga kendaraan (RM)" },
  "carloan.inputs.downPct": { en: "Down payment", ms: "Bayaran pendahuluan", id: "Uang muka" },
  "carloan.inputs.downPct.hint": { en: "Minimum is usually 10% of the price.", ms: "Minimum biasanya 10% daripada harga.", id: "Minimum biasanya 10% dari harga." },
  "carloan.inputs.rate": { en: "Flat interest rate (p.a.)", ms: "Kadar faedah rata (setahun)", id: "Suku bunga flat (per tahun)" },
  "carloan.inputs.rate.hint": { en: "New cars are typically 2.5%–3.5% flat.", ms: "Kereta baharu biasanya 2.5%–3.5% rata.", id: "Mobil baru umumnya 2,5%–3,5% flat." },
  "carloan.inputs.tenure": { en: "Loan tenure", ms: "Tempoh pinjaman", id: "Tenor pinjaman" },
  "carloan.disclaimer": {
    en: "Estimates only. Malaysian car loans use a flat rate, so the effective rate shown is an approximation. Banks may quote different rates and charges. Confirm with your bank.",
    ms: "Anggaran sahaja. Pinjaman kereta Malaysia menggunakan kadar rata, jadi kadar berkesan yang ditunjukkan adalah anggaran. Bank mungkin menyebut kadar dan caj berbeza. Sahkan dengan bank anda.",
    id: "Hanya perkiraan. Kredit mobil Malaysia memakai suku bunga flat, jadi tarif efektif yang ditampilkan adalah perkiraan. Bank mungkin mengutip tarif dan biaya berbeda. Konfirmasikan dengan bank Anda.",
  },
  "carloan.breakdown.ready": { en: "Your loan breakdown", ms: "Pecahan pinjaman anda", id: "Rincian pinjaman Anda" },
  "carloan.breakdown.hint": { en: "Enter the vehicle price and tap Calculate to see the full cost.", ms: "Masukkan harga kenderaan dan tekan Kira untuk melihat kos penuh.", id: "Masukkan harga kendaraan dan tekan Hitung untuk melihat biaya penuh." },
  "carloan.downPayment": { en: "Down payment", ms: "Bayaran pendahuluan", id: "Uang muka" },
  "carloan.loanAmount": { en: "Amount financed", ms: "Jumlah dibiayai", id: "Jumlah dibiayai" },
  "carloan.totalInterest": { en: "Total interest", ms: "Jumlah faedah", id: "Total bunga" },
  "carloan.summary.title": { en: "Cost summary", ms: "Ringkasan kos", id: "Ringkasan biaya" },
  "carloan.summary.subtitle": { en: "What the loan costs over the full tenure.", ms: "Kos pinjaman sepanjang tempoh penuh.", id: "Biaya pinjaman selama tenor penuh." },
  "carloan.totalPayable": { en: "Total payable", ms: "Jumlah perlu dibayar", id: "Total yang dibayar" },
  "carloan.totalPayable.hint": { en: "Amount financed + total interest.", ms: "Jumlah dibiayai + jumlah faedah.", id: "Jumlah dibiayai + total bunga." },
  "carloan.effectiveRate": { en: "Effective rate (est.)", ms: "Kadar berkesan (anggaran)", id: "Tarif efektif (perk.)" },
  "carloan.effectiveRate.hint": { en: "Reducing-balance equivalent of the flat rate — roughly double.", ms: "Setara baki berkurangan kadar rata — lebih kurang dua kali ganda.", id: "Setara saldo menurun dari suku bunga flat — kira-kira dua kali lipat." },

  // ── Fixed deposit calculator ─────────────────────────────────────
  "fd.title": { en: "Malaysia Fixed Deposit Calculator", ms: "Kalkulator Simpanan Tetap Malaysia", id: "Kalkulator Deposito Malaysia" },
  "fd.subtitle": {
    en: "See how much interest your fixed deposit earns and its maturity value — plus what you gain by letting it auto-renew.",
    ms: "Lihat berapa banyak faedah simpanan tetap anda peroleh dan nilai matangnya — serta keuntungan jika dibaharui automatik.",
    id: "Lihat berapa bunga deposito Anda dan nilai jatuh temponya — plus keuntungan jika diperpanjang otomatis.",
  },
  "fd.badge": { en: "Tax-exempt", ms: "Dikecualikan cukai", id: "Bebas pajak" },
  "fd.badge.private": { en: "Runs in your browser", ms: "Berjalan dalam pelayar anda", id: "Berjalan di browser Anda" },
  "fd.maturityValue": { en: "Maturity value", ms: "Nilai matang", id: "Nilai jatuh tempo" },
  "fd.atMaturity": { en: "at maturity", ms: "pada matang", id: "saat jatuh tempo" },
  "fd.cta.tapToReveal": { en: "Enter details and calculate", ms: "Masukkan butiran dan kira", id: "Masukkan detail dan hitung" },
  "fd.cta.calculate": { en: "Calculate", ms: "Kira", id: "Hitung" },
  "fd.cta.recalculate": { en: "Recalculate", ms: "Kira Semula", id: "Hitung Ulang" },
  "fd.inputs.title": { en: "Deposit details", ms: "Butiran simpanan", id: "Detail deposito" },
  "fd.inputs.subtitle": { en: "Adjust the figures to match your placement.", ms: "Laraskan angka mengikut simpanan anda.", id: "Sesuaikan angka dengan deposito Anda." },
  "fd.inputs.principal": { en: "Deposit amount (RM)", ms: "Jumlah simpanan (RM)", id: "Jumlah deposito (RM)" },
  "fd.inputs.rate": { en: "Interest rate (p.a.)", ms: "Kadar faedah (setahun)", id: "Suku bunga (per tahun)" },
  "fd.inputs.rate.hint": { en: "Promo FD rates are often 3.5%–4.0% p.a.", ms: "Kadar FD promosi selalunya 3.5%–4.0% setahun.", id: "Tarif deposito promo sering 3,5%–4,0% per tahun." },
  "fd.inputs.tenure": { en: "Tenure", ms: "Tempoh", id: "Tenor" },
  "fd.inputs.tenure.hint": { en: "Common tenures are 1, 3, 6, or 12 months.", ms: "Tempoh biasa ialah 1, 3, 6, atau 12 bulan.", id: "Tenor umum adalah 1, 3, 6, atau 12 bulan." },
  "fd.months": { en: "months", ms: "bulan", id: "bulan" },
  "fd.disclaimer": {
    en: "Estimates only. FD interest from licensed Malaysian banks is tax-exempt for individuals. Rates and minimum placements vary by bank. Confirm before placing.",
    ms: "Anggaran sahaja. Faedah FD daripada bank berlesen Malaysia dikecualikan cukai untuk individu. Kadar dan simpanan minimum berbeza mengikut bank. Sahkan sebelum menyimpan.",
    id: "Hanya perkiraan. Bunga deposito dari bank berlisensi Malaysia bebas pajak untuk individu. Tarif dan setoran minimum bervariasi per bank. Konfirmasikan sebelum menempatkan.",
  },
  "fd.breakdown.ready": { en: "Your deposit breakdown", ms: "Pecahan simpanan anda", id: "Rincian deposito Anda" },
  "fd.breakdown.hint": { en: "Enter your deposit amount and tap Calculate.", ms: "Masukkan jumlah simpanan dan tekan Kira.", id: "Masukkan jumlah deposito dan tekan Hitung." },
  "fd.principalLabel": { en: "Principal", ms: "Pokok", id: "Pokok" },
  "fd.interest": { en: "Interest earned", ms: "Faedah diperoleh", id: "Bunga diperoleh" },
  "fd.monthlyInterest": { en: "Avg. monthly interest", ms: "Purata faedah bulanan", id: "Rata-rata bunga bulanan" },
  "fd.summary.title": { en: "Maturity breakdown", ms: "Pecahan matang", id: "Rincian jatuh tempo" },
  "fd.summary.subtitle": { en: "Simple interest at maturity vs. monthly auto-renewal.", ms: "Faedah mudah pada matang berbanding pembaharuan automatik bulanan.", id: "Bunga sederhana saat jatuh tempo vs. perpanjangan otomatis bulanan." },
  "fd.simpleMaturity": { en: "Maturity (simple interest)", ms: "Matang (faedah mudah)", id: "Jatuh tempo (bunga sederhana)" },
  "fd.simpleMaturity.hint": { en: "Principal + interest, paid at maturity.", ms: "Pokok + faedah, dibayar pada matang.", id: "Pokok + bunga, dibayar saat jatuh tempo." },
  "fd.compounded": { en: "If auto-renewed (compounded)", ms: "Jika dibaharui automatik (kompaun)", id: "Jika diperpanjang otomatis (majemuk)" },
  "fd.compounded.hint": { en: "Maturity value if interest rolls over monthly.", ms: "Nilai matang jika faedah digulung setiap bulan.", id: "Nilai jatuh tempo jika bunga digulung setiap bulan." },
  "fd.compoundingBonus": { en: "Compounding bonus", ms: "Bonus pengkompaunan", id: "Bonus bunga majemuk" },
  "fd.compoundingBonus.hint": { en: "Extra return from auto-renewal vs. simple interest.", ms: "Pulangan tambahan daripada pembaharuan automatik berbanding faedah mudah.", id: "Imbal hasil tambahan dari perpanjangan otomatis vs. bunga sederhana." },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[locale] || entry.en;
}
