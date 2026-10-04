// SEO config + long-form copy for the currency converter and its per-pair
// landing pages (e.g. /en/currency-converter/usd-to-myr).
//
// Every pair is a real, prerendered, indexable page targeting the long-tail
// query people actually type ("usd to myr", "convert 100 sgd to ringgit").
// Copy is generated from FX_SNAPSHOT so every page carries real, dated
// numbers rather than boilerplate. Plain data + pure functions only — this
// module is consumed by both the React app and the Node build step.

import {
  CURRENCIES,
  FX_SNAPSHOT,
  QUICK_AMOUNTS,
  formatMoney,
  formatRate,
  getCurrency,
  getRate,
  localeTag,
  type Locale,
} from "../lib/currency";
import type { CalculatorContent } from "./content";
import type { RouteSeoEntry } from "./seo";

export const CURRENCY_HUB_PATH = "/currency-converter";

type Pair = readonly [from: string, to: string];

/** Hub currency: every other currency gets a pair in both directions. */
const HUB = "MYR";
const HUB_PARTNERS = ["USD", "SGD", "IDR", "EUR", "GBP", "JPY", "AUD", "CNY", "THB", "INR", "KRW", "HKD", "CAD", "NZD", "PHP", "CHF"];

/** High-volume cross pairs that don't involve the ringgit. */
const CROSS_PAIRS: Pair[] = [
  ["USD", "SGD"], ["SGD", "USD"],
  ["USD", "IDR"], ["IDR", "USD"],
  ["SGD", "IDR"], ["IDR", "SGD"],
  ["EUR", "USD"], ["USD", "EUR"],
  ["GBP", "USD"], ["USD", "GBP"],
  ["USD", "JPY"], ["JPY", "USD"],
  ["EUR", "GBP"], ["GBP", "EUR"],
];

export const CURRENCY_PAIRS: Pair[] = [
  ...HUB_PARTNERS.flatMap((c): Pair[] => [[c, HUB], [HUB, c]]),
  ...CROSS_PAIRS,
];

export function pairParam(from: string, to: string): string {
  return `${from.toLowerCase()}-to-${to.toLowerCase()}`;
}

export function pairPath(from: string, to: string): string {
  return `${CURRENCY_HUB_PATH}/${pairParam(from, to)}`;
}

export function pairSlug(from: string, to: string): `fx-${string}` {
  return `fx-${from.toLowerCase()}-${to.toLowerCase()}`;
}

/** Resolve a URL param like "usd-to-myr" to a supported pair. */
export function parsePairParam(param: string | undefined): Pair | undefined {
  if (!param) return undefined;
  const m = /^([a-z]{3})-to-([a-z]{3})$/.exec(param.toLowerCase());
  if (!m) return undefined;
  const from = m[1].toUpperCase();
  const to = m[2].toUpperCase();
  return CURRENCY_PAIRS.find(([f, t]) => f === from && t === to);
}

export function hasPair(from: string, to: string): boolean {
  return CURRENCY_PAIRS.some(([f, t]) => f === from && t === to);
}

// ─── Copy ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

function fmtNum(n: number, locale: Locale, max = 2): string {
  return new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: max }).format(n);
}

interface PairCopy {
  title: (a: string, b: string, an: string, bn: string) => string;
  description: (a: string, b: string, an: string, bn: string) => string;
  keywords: (a: string, b: string, an: string, bn: string) => string;
  heading: (a: string, b: string) => string;
  tagline: (an: string, bn: string) => string;
  intro: (a: string, b: string, an: string, bn: string, rate: string, date: string, sample: string) => string;
  howHeading: (a: string, b: string) => string;
  how: (a: string, b: string, rate: string, inv: string, sample: string) => string[];
  myrNote: string;
  formulaHeading: (a: string, b: string) => string;
  formula: (a: string, b: string, rate: string) => string[];
  tableHeading: (a: string, b: string) => string;
  tableCaption: (a: string, b: string, rate: string, date: string) => string;
  tableNote: string;
  exampleTitle: (amt: string, a: string, b: string) => string;
  exampleGiven: (amt: string, a: string, rate: string, date: string) => string[];
  exampleResult: (amt: string, a: string, out: string, b: string) => string;
  faq: (a: string, b: string, rate: string, date: string, amt100: string, out100: string) => { question: string; answer: string }[];
}

const PAIR_COPY: Record<Locale, PairCopy> = {
  en: {
    title: (a, b, an, bn) => `${a} to ${b} Converter – ${an} to ${bn} | HelloKalku`,
    description: (a, b, an, bn) =>
      `Convert ${an} (${a}) to ${bn} (${b}) with the latest exchange rate. Free ${a} to ${b} currency converter with a quick conversion table for common amounts.`,
    keywords: (a, b, an, bn) =>
      `${a.toLowerCase()} to ${b.toLowerCase()}, ${an.toLowerCase()} to ${bn.toLowerCase()}, convert ${a.toLowerCase()} to ${b.toLowerCase()}, ${a.toLowerCase()} ${b.toLowerCase()} exchange rate, ${a.toLowerCase()} to ${b.toLowerCase()} calculator, currency converter`,
    heading: (a, b) => `${a} to ${b} converter`,
    tagline: (an, bn) => `Convert ${an} to ${bn} at the latest exchange rate.`,
    intro: (a, b, an, bn, rate, date, sample) =>
      `Convert ${an} (${a}) to ${bn} (${b}) instantly. At the ${date} reference rate, 1 ${a} equals ${rate} ${b}, so ${sample}. Type any amount above for a live conversion — the converter pulls fresh European Central Bank reference rates each time you open the page.`,
    howHeading: (a, b) => `How to convert ${a} to ${b}`,
    how: (a, b, rate, inv, sample) => [
      `Multiply the amount in ${a} by the ${a} to ${b} exchange rate. At ${rate}, ${sample}.`,
      `To go the other way, divide by the same rate: 1 ${b} equals ${inv} ${a}. The calculator does both directions — use the swap button to flip the currencies.`,
      `The rate shown is a mid-market reference rate, the midpoint between buying and selling prices. Banks, money changers and card networks add a margin, so the rate you actually receive is usually a little worse. Compare the total ${b} you end up with, not just the headline rate, and check for fixed fees.`,
    ],
    myrNote:
      "In Malaysia, banks and licensed money changers each quote their own buy and sell rates for the ringgit and these can differ noticeably from the mid-market rate, so it pays to compare a few before you exchange.",
    formulaHeading: (a, b) => `${a} to ${b} formula`,
    formula: (a, b, rate) => [
      `${b} amount = ${a} amount × ${rate}.`,
      `${a} amount = ${b} amount ÷ ${rate}.`,
      "Rates are cross-calculated through the US dollar from European Central Bank reference rates, so the result is consistent in both directions.",
    ],
    tableHeading: (a, b) => `${a} to ${b} conversion table`,
    tableCaption: (a, b, rate, date) => `Based on 1 ${a} = ${rate} ${b} (reference rate, ${date}).`,
    tableNote: "Indicative reference rates, not a quote. Check your bank or money changer for the rate you will actually pay.",
    exampleTitle: (amt, a, b) => `${amt} ${a} in ${b}`,
    exampleGiven: (amt, a, rate, date) => [`Amount: ${amt} ${a}`, `Rate: ${rate} (${date})`],
    exampleResult: (amt, a, out, b) => `${amt} ${a} × the rate = ${out}.`,
    faq: (a, b, rate, date, amt100, out100) => [
      {
        question: `What is the ${a} to ${b} exchange rate today?`,
        answer: `The latest reference rate is 1 ${a} = ${rate} ${b} (${date}). The converter above fetches the newest rate whenever you open the page, so use it for the current figure.`,
      },
      {
        question: `How much is ${amt100} ${a} in ${b}?`,
        answer: `${amt100} ${a} is about ${out100} at the ${date} reference rate. Enter your own amount in the converter for an exact figure.`,
      },
      {
        question: `Why is the bank or money changer rate different from this rate?`,
        answer: `This is the mid-market reference rate. Providers add a spread (a worse buy or sell rate) and sometimes a fixed fee, so you normally receive less ${b} per ${a} than the headline rate. Always compare the final amount you receive.`,
      },
      {
        question: "How often are the rates updated?",
        answer:
          "The European Central Bank publishes reference rates once each working day, around 16:00 CET. Weekends and holidays show the previous working day's rates. These are reference rates, not live trading quotes, so they are not suitable for trading or for locking in a large transfer.",
      },
    ],
  },
  ms: {
    title: (a, b, an, bn) => `Tukar ${a} ke ${b} – ${an} ke ${bn} | HelloKalku`,
    description: (a, b, an, bn) =>
      `Tukar ${an} (${a}) kepada ${bn} (${b}) dengan kadar pertukaran terkini. Penukar mata wang ${a} ke ${b} percuma dengan jadual penukaran pantas untuk jumlah biasa.`,
    keywords: (a, b, an, bn) =>
      `${a.toLowerCase()} ke ${b.toLowerCase()}, ${an.toLowerCase()} ke ${bn.toLowerCase()}, tukar ${a.toLowerCase()} ke ${b.toLowerCase()}, kadar tukaran ${a.toLowerCase()} ${b.toLowerCase()}, kalkulator ${a.toLowerCase()} ke ${b.toLowerCase()}, penukar mata wang`,
    heading: (a, b) => `Penukar ${a} ke ${b}`,
    tagline: (an, bn) => `Tukar ${an} kepada ${bn} pada kadar pertukaran terkini.`,
    intro: (a, b, an, bn, rate, date, sample) =>
      `Tukar ${an} (${a}) kepada ${bn} (${b}) dengan segera. Pada kadar rujukan ${date}, 1 ${a} bersamaan ${rate} ${b}, jadi ${sample}. Taip mana-mana jumlah di atas untuk penukaran terkini — penukar ini mengambil kadar rujukan Bank Pusat Eropah yang baharu setiap kali anda membuka halaman.`,
    howHeading: (a, b) => `Cara menukar ${a} kepada ${b}`,
    how: (a, b, rate, inv, sample) => [
      `Darabkan jumlah dalam ${a} dengan kadar pertukaran ${a} ke ${b}. Pada ${rate}, ${sample}.`,
      `Untuk arah sebaliknya, bahagikan dengan kadar yang sama: 1 ${b} bersamaan ${inv} ${a}. Kalkulator ini menyokong kedua-dua arah — guna butang tukar untuk membalikkan mata wang.`,
      `Kadar yang dipaparkan ialah kadar rujukan pasaran pertengahan, iaitu titik tengah antara harga beli dan jual. Bank, pengurup wang dan rangkaian kad menambah margin, jadi kadar yang anda terima biasanya lebih rendah sedikit. Bandingkan jumlah ${b} akhir yang anda terima, bukan sekadar kadar utama, dan semak yuran tetap.`,
    ],
    myrNote:
      "Di Malaysia, bank dan pengurup wang berlesen menetapkan kadar beli dan jual ringgit masing-masing, dan ia boleh berbeza ketara daripada kadar pasaran pertengahan, jadi eloklah bandingkan beberapa sebelum menukar.",
    formulaHeading: (a, b) => `Formula ${a} ke ${b}`,
    formula: (a, b, rate) => [
      `Jumlah ${b} = jumlah ${a} × ${rate}.`,
      `Jumlah ${a} = jumlah ${b} ÷ ${rate}.`,
      "Kadar dikira silang melalui dolar AS daripada kadar rujukan Bank Pusat Eropah, jadi hasilnya konsisten dalam kedua-dua arah.",
    ],
    tableHeading: (a, b) => `Jadual penukaran ${a} ke ${b}`,
    tableCaption: (a, b, rate, date) => `Berdasarkan 1 ${a} = ${rate} ${b} (kadar rujukan, ${date}).`,
    tableNote: "Kadar rujukan sebagai panduan, bukan sebut harga. Semak dengan bank atau pengurup wang anda untuk kadar sebenar yang akan anda bayar.",
    exampleTitle: (amt, a, b) => `${amt} ${a} dalam ${b}`,
    exampleGiven: (amt, a, rate, date) => [`Jumlah: ${amt} ${a}`, `Kadar: ${rate} (${date})`],
    exampleResult: (amt, a, out, b) => `${amt} ${a} × kadar = ${out}.`,
    faq: (a, b, rate, date, amt100, out100) => [
      {
        question: `Berapakah kadar pertukaran ${a} ke ${b} hari ini?`,
        answer: `Kadar rujukan terkini ialah 1 ${a} = ${rate} ${b} (${date}). Penukar di atas mengambil kadar terbaharu setiap kali anda membuka halaman, jadi gunakannya untuk angka semasa.`,
      },
      {
        question: `Berapakah ${amt100} ${a} dalam ${b}?`,
        answer: `${amt100} ${a} ialah kira-kira ${out100} pada kadar rujukan ${date}. Masukkan jumlah anda sendiri dalam penukar untuk angka tepat.`,
      },
      {
        question: "Mengapa kadar bank atau pengurup wang berbeza daripada kadar ini?",
        answer: `Ini ialah kadar rujukan pasaran pertengahan. Penyedia menambah spread (kadar beli atau jual yang lebih rendah) dan kadangkala yuran tetap, jadi anda lazimnya menerima kurang ${b} bagi setiap ${a} berbanding kadar utama. Sentiasa bandingkan jumlah akhir yang anda terima.`,
      },
      {
        question: "Berapa kerap kadar dikemas kini?",
        answer:
          "Bank Pusat Eropah menerbitkan kadar rujukan sekali setiap hari bekerja, sekitar 16:00 CET. Hujung minggu dan cuti awam menunjukkan kadar hari bekerja sebelumnya. Ini kadar rujukan, bukan sebut harga dagangan langsung, jadi tidak sesuai untuk berdagang atau mengunci pemindahan besar.",
      },
    ],
  },
  id: {
    title: (a, b, an, bn) => `Konversi ${a} ke ${b} – ${an} ke ${bn} | HelloKalku`,
    description: (a, b, an, bn) =>
      `Konversi ${an} (${a}) ke ${bn} (${b}) dengan kurs terbaru. Konverter mata uang ${a} ke ${b} gratis dengan tabel konversi cepat untuk jumlah umum.`,
    keywords: (a, b, an, bn) =>
      `${a.toLowerCase()} ke ${b.toLowerCase()}, ${an.toLowerCase()} ke ${bn.toLowerCase()}, konversi ${a.toLowerCase()} ke ${b.toLowerCase()}, kurs ${a.toLowerCase()} ${b.toLowerCase()}, kalkulator ${a.toLowerCase()} ke ${b.toLowerCase()}, konverter mata uang`,
    heading: (a, b) => `Konverter ${a} ke ${b}`,
    tagline: (an, bn) => `Konversi ${an} ke ${bn} dengan kurs terbaru.`,
    intro: (a, b, an, bn, rate, date, sample) =>
      `Konversi ${an} (${a}) ke ${bn} (${b}) seketika. Pada kurs referensi ${date}, 1 ${a} sama dengan ${rate} ${b}, jadi ${sample}. Ketik jumlah apa pun di atas untuk konversi langsung — konverter ini mengambil kurs referensi Bank Sentral Eropa terbaru setiap kali Anda membuka halaman.`,
    howHeading: (a, b) => `Cara mengonversi ${a} ke ${b}`,
    how: (a, b, rate, inv, sample) => [
      `Kalikan jumlah dalam ${a} dengan kurs ${a} ke ${b}. Pada ${rate}, ${sample}.`,
      `Untuk arah sebaliknya, bagi dengan kurs yang sama: 1 ${b} sama dengan ${inv} ${a}. Kalkulator ini mendukung kedua arah — gunakan tombol tukar untuk membalik mata uang.`,
      `Kurs yang ditampilkan adalah kurs referensi pasar tengah, yaitu titik tengah antara harga beli dan jual. Bank, pedagang valuta asing, dan jaringan kartu menambahkan margin, jadi kurs yang sebenarnya Anda terima biasanya sedikit lebih buruk. Bandingkan total ${b} akhir yang Anda terima, bukan hanya kurs utamanya, dan periksa biaya tetap.`,
    ],
    myrNote:
      "Di Malaysia, bank dan pedagang valuta asing berlisensi menetapkan kurs beli dan jual ringgit masing-masing, dan bisa berbeda cukup jauh dari kurs pasar tengah, jadi sebaiknya bandingkan beberapa sebelum menukar.",
    formulaHeading: (a, b) => `Rumus ${a} ke ${b}`,
    formula: (a, b, rate) => [
      `Jumlah ${b} = jumlah ${a} × ${rate}.`,
      `Jumlah ${a} = jumlah ${b} ÷ ${rate}.`,
      "Kurs dihitung silang melalui dolar AS dari kurs referensi Bank Sentral Eropa, sehingga hasilnya konsisten di kedua arah.",
    ],
    tableHeading: (a, b) => `Tabel konversi ${a} ke ${b}`,
    tableCaption: (a, b, rate, date) => `Berdasarkan 1 ${a} = ${rate} ${b} (kurs referensi, ${date}).`,
    tableNote: "Kurs referensi sebagai acuan, bukan penawaran. Periksa bank atau pedagang valuta asing Anda untuk kurs yang benar-benar Anda bayar.",
    exampleTitle: (amt, a, b) => `${amt} ${a} dalam ${b}`,
    exampleGiven: (amt, a, rate, date) => [`Jumlah: ${amt} ${a}`, `Kurs: ${rate} (${date})`],
    exampleResult: (amt, a, out, b) => `${amt} ${a} × kurs = ${out}.`,
    faq: (a, b, rate, date, amt100, out100) => [
      {
        question: `Berapa kurs ${a} ke ${b} hari ini?`,
        answer: `Kurs referensi terbaru adalah 1 ${a} = ${rate} ${b} (${date}). Konverter di atas mengambil kurs terbaru setiap kali Anda membuka halaman, jadi gunakan untuk angka saat ini.`,
      },
      {
        question: `Berapa ${amt100} ${a} dalam ${b}?`,
        answer: `${amt100} ${a} sekitar ${out100} pada kurs referensi ${date}. Masukkan jumlah Anda sendiri di konverter untuk angka pasti.`,
      },
      {
        question: "Mengapa kurs bank atau pedagang valuta asing berbeda dari kurs ini?",
        answer: `Ini adalah kurs referensi pasar tengah. Penyedia menambahkan spread (kurs beli atau jual yang lebih buruk) dan kadang biaya tetap, sehingga Anda biasanya menerima ${b} lebih sedikit per ${a} dibanding kurs utama. Selalu bandingkan jumlah akhir yang Anda terima.`,
      },
      {
        question: "Seberapa sering kurs diperbarui?",
        answer:
          "Bank Sentral Eropa menerbitkan kurs referensi sekali setiap hari kerja, sekitar pukul 16:00 CET. Akhir pekan dan hari libur menampilkan kurs hari kerja sebelumnya. Ini kurs referensi, bukan kutipan perdagangan langsung, sehingga tidak cocok untuk trading atau mengunci transfer besar.",
      },
    ],
  },
};

// ─── Route + content builders ───────────────────────────────────────────────

const LOCALES: Locale[] = ["en", "ms", "id"];

export function buildPairRoute(from: string, to: string): RouteSeoEntry {
  const a = from.toUpperCase();
  const b = to.toUpperCase();
  const copy = {} as RouteSeoEntry["copy"];
  for (const locale of LOCALES) {
    const c = PAIR_COPY[locale];
    const an = getCurrency(a)!.name[locale];
    const bn = getCurrency(b)!.name[locale];
    copy[locale] = {
      title: c.title(a, b, an, bn),
      description: c.description(a, b, an, bn),
      keywords: c.keywords(a, b, an, bn),
      heading: c.heading(a, b),
      tagline: c.tagline(an, bn),
    };
  }
  const involvesMyr = a === "MYR" || b === "MYR";
  return {
    slug: pairSlug(a, b),
    path: pairPath(a, b),
    prerender: true,
    sitemap: { priority: involvesMyr ? 0.8 : 0.6, changefreq: "daily" },
    copy,
  };
}

export function buildPairContent(from: string, to: string, locale: Locale): CalculatorContent {
  const a = from.toUpperCase();
  const b = to.toUpperCase();
  const c = PAIR_COPY[locale];
  const an = getCurrency(a)!.name[locale];
  const bn = getCurrency(b)!.name[locale];
  const rates = FX_SNAPSHOT.rates;
  const rate = getRate(rates, a, b);
  const inv = getRate(rates, b, a);
  const rateStr = formatRate(rate, locale);
  const invStr = formatRate(inv, locale);
  const date = fmtDate(FX_SNAPSHOT.date, locale);

  const sampleAmt = rate < 0.1 ? 10000 : rate > 500 ? 1 : 100;
  const sampleOut = formatMoney(sampleAmt * rate, b, locale);
  const sampleLine = `${fmtNum(sampleAmt, locale)} ${a} ≈ ${sampleOut}`;
  const howSample = `${fmtNum(sampleAmt, locale)} ${a} × ${rateStr} = ${sampleOut}`;

  const exAmt = rate < 0.1 ? 100000 : 1000;
  const exOut = formatMoney(exAmt * rate, b, locale);
  const faqAmt = rate < 0.1 ? 10000 : 100;
  const faqOut = formatMoney(faqAmt * rate, b, locale);

  const how = c.how(a, b, rateStr, invStr, howSample);
  if (a === "MYR" || b === "MYR") how.push(c.myrNote);

  return {
    intro: c.intro(a, b, an, bn, rateStr, date, sampleLine),
    howItWorks: { heading: c.howHeading(a, b), paragraphs: how },
    formula: { heading: c.formulaHeading(a, b), paragraphs: c.formula(a, b, rateStr) },
    rateTable: {
      heading: c.tableHeading(a, b),
      caption: c.tableCaption(a, b, rateStr, date),
      columns: [a, b],
      rows: QUICK_AMOUNTS.map((amt) => [`${fmtNum(amt, locale)} ${a}`, formatMoney(amt * rate, b, locale)]),
      note: c.tableNote,
    },
    examples: [
      {
        title: c.exampleTitle(fmtNum(exAmt, locale), a, b),
        given: c.exampleGiven(fmtNum(exAmt, locale), a, rateStr, date),
        result: c.exampleResult(fmtNum(exAmt, locale), a, exOut, b),
      },
    ],
    faq: c.faq(a, b, rateStr, date, fmtNum(faqAmt, locale), faqOut),
    related: ["currency", "salary", "fd"],
    lastReviewed: FX_SNAPSHOT.date,
  };
}

// ─── Hub page ───────────────────────────────────────────────────────────────

const HUB_COPY: Record<Locale, {
  title: string;
  description: string;
  keywords: string;
  heading: string;
  tagline: string;
  intro: string;
  howHeading: string;
  how: string[];
  formulaHeading: string;
  formula: string[];
  tableHeading: string;
  tableCaption: (date: string) => string;
  columns: [string, string, string];
  tableNote: string;
  faq: { question: string; answer: string }[];
}> = {
  en: {
    title: "Currency Converter – Ringgit (MYR), USD, SGD & 15 More | HelloKalku",
    description:
      "Free currency converter with the latest exchange rates for Malaysian Ringgit (MYR), US Dollar, Singapore Dollar, Rupiah, Euro, Pound and more. Convert any amount instantly.",
    keywords:
      "currency converter, currency converter malaysia, ringgit converter, myr exchange rate, usd to myr, sgd to myr, convert currency, exchange rate calculator, money converter",
    heading: "Currency converter",
    tagline: "Convert ringgit, US dollars, Singapore dollars and 14 more currencies at the latest rates.",
    intro:
      "Convert between 17 major currencies, with the Malaysian ringgit (MYR) at the centre: US dollar, Singapore dollar, Indonesian rupiah, euro, pound, yen, yuan, baht and more. Rates come from European Central Bank reference data and refresh every time you open the page, with a built-in fallback if you are offline. Everything runs in your browser — nothing you type is sent anywhere.",
    howHeading: "How the currency converter works",
    how: [
      "Choose the currency you have and the one you want, then enter an amount. The result updates instantly as you type, and the swap button flips the two currencies.",
      "Each rate is quoted against the US dollar and cross-calculated, so converting RM to SGD, for example, is the SGD rate divided by the MYR rate. That keeps results consistent in both directions.",
      "The rates are mid-market reference rates, the midpoint between buying and selling prices. Banks, licensed money changers, remittance services and card networks add a margin or fee, so the amount you receive is usually a little lower. Always compare the final amount, not just the headline rate.",
      "Reference rates are published once per working day. They are accurate enough to budget for a trip, price an overseas purchase or check a quote, but they are not live trading prices.",
    ],
    formulaHeading: "Currency conversion formula",
    formula: [
      "Converted amount = amount × (rate of target currency ÷ rate of source currency), with both rates quoted per 1 US dollar.",
      "Example: 1,000 SGD → MYR = 1,000 × ({MYR} ÷ {SGD}) ≈ {OUT}.",
    ],
    tableHeading: "Ringgit exchange rates",
    tableCaption: (date) => `Reference rates against the Malaysian ringgit, ${date}.`,
    columns: ["Currency", "1 MYR =", "1 unit = MYR"],
    tableNote: "Indicative reference rates, not a quote. Check your bank or money changer for the rate you will actually pay.",
    faq: [
      {
        question: "What currencies can I convert?",
        answer:
          "Seventeen major currencies: Malaysian ringgit, US dollar, Singapore dollar, Indonesian rupiah, euro, British pound, Japanese yen, Australian dollar, Chinese yuan, Thai baht, Indian rupee, South Korean won, Hong Kong dollar, Canadian dollar, New Zealand dollar, Philippine peso and Swiss franc.",
      },
      {
        question: "Are these the same rates my bank or money changer uses?",
        answer:
          "No. These are mid-market reference rates. Banks and money changers quote separate buy and sell rates with a margin built in, and may add fees, so expect to receive somewhat less than the converter shows.",
      },
      {
        question: "Where do the exchange rates come from?",
        answer:
          "European Central Bank reference rates, served through the free Frankfurter API and refreshed each working day. If the live request fails, the converter falls back to the last rates saved in the app and tells you the date.",
      },
      {
        question: "Is the currency converter free and private?",
        answer: "Yes. It is free, needs no sign-up and runs in your browser. The amounts you type are never sent to a server.",
      },
    ],
  },
  ms: {
    title: "Penukar Mata Wang – Ringgit (MYR), USD, SGD & 15 Lagi | HelloKalku",
    description:
      "Penukar mata wang percuma dengan kadar pertukaran terkini untuk Ringgit Malaysia (MYR), Dolar AS, Dolar Singapura, Rupiah, Euro, Pound dan lagi. Tukar sebarang jumlah dengan segera.",
    keywords:
      "penukar mata wang, kalkulator mata wang, penukar ringgit, kadar tukaran myr, usd ke myr, sgd ke myr, tukar mata wang, kadar pertukaran",
    heading: "Penukar mata wang",
    tagline: "Tukar ringgit, dolar AS, dolar Singapura dan 14 mata wang lain pada kadar terkini.",
    intro:
      "Tukar antara 17 mata wang utama, dengan ringgit Malaysia (MYR) sebagai pusat: dolar AS, dolar Singapura, rupiah Indonesia, euro, pound, yen, yuan, baht dan lagi. Kadar datang daripada data rujukan Bank Pusat Eropah dan dikemas kini setiap kali anda membuka halaman, dengan sandaran terbina dalam jika anda di luar talian. Semuanya berjalan dalam pelayar anda — tiada apa yang anda taip dihantar ke mana-mana.",
    howHeading: "Cara penukar mata wang berfungsi",
    how: [
      "Pilih mata wang yang anda ada dan yang anda mahu, kemudian masukkan jumlah. Hasil dikemas kini serta-merta semasa anda menaip, dan butang tukar membalikkan kedua-dua mata wang.",
      "Setiap kadar disebut berbanding dolar AS dan dikira silang, jadi menukar RM kepada SGD, contohnya, ialah kadar SGD dibahagi kadar MYR. Ini memastikan hasil konsisten dalam kedua-dua arah.",
      "Kadar ini ialah kadar rujukan pasaran pertengahan, titik tengah antara harga beli dan jual. Bank, pengurup wang berlesen, perkhidmatan alir wang dan rangkaian kad menambah margin atau yuran, jadi jumlah yang anda terima biasanya lebih rendah sedikit. Sentiasa bandingkan jumlah akhir, bukan sekadar kadar utama.",
      "Kadar rujukan diterbitkan sekali setiap hari bekerja. Ia cukup tepat untuk membuat bajet percutian, menilai pembelian luar negara atau menyemak sebut harga, tetapi bukan harga dagangan langsung.",
    ],
    formulaHeading: "Formula penukaran mata wang",
    formula: [
      "Jumlah ditukar = jumlah × (kadar mata wang sasaran ÷ kadar mata wang asal), dengan kedua-dua kadar disebut bagi 1 dolar AS.",
      "Contoh: 1,000 SGD → MYR = 1,000 × ({MYR} ÷ {SGD}) ≈ {OUT}.",
    ],
    tableHeading: "Kadar pertukaran ringgit",
    tableCaption: (date) => `Kadar rujukan berbanding ringgit Malaysia, ${date}.`,
    columns: ["Mata wang", "1 MYR =", "1 unit = MYR"],
    tableNote: "Kadar rujukan sebagai panduan, bukan sebut harga. Semak dengan bank atau pengurup wang anda untuk kadar sebenar yang akan anda bayar.",
    faq: [
      {
        question: "Mata wang apa yang boleh saya tukar?",
        answer:
          "Tujuh belas mata wang utama: ringgit Malaysia, dolar AS, dolar Singapura, rupiah Indonesia, euro, paun sterling British, yen Jepun, dolar Australia, yuan China, baht Thailand, rupee India, won Korea Selatan, dolar Hong Kong, dolar Kanada, dolar New Zealand, peso Filipina dan franc Switzerland.",
      },
      {
        question: "Adakah ini kadar yang sama digunakan oleh bank atau pengurup wang saya?",
        answer:
          "Tidak. Ini kadar rujukan pasaran pertengahan. Bank dan pengurup wang menyebut kadar beli dan jual berasingan dengan margin terbina dalam, dan mungkin menambah yuran, jadi jangkakan menerima agak kurang daripada yang ditunjukkan penukar.",
      },
      {
        question: "Dari mana kadar pertukaran datang?",
        answer:
          "Kadar rujukan Bank Pusat Eropah, disalurkan melalui API Frankfurter percuma dan dikemas kini setiap hari bekerja. Jika permintaan langsung gagal, penukar kembali kepada kadar terakhir yang disimpan dalam aplikasi dan memberitahu anda tarikhnya.",
      },
      {
        question: "Adakah penukar mata wang ini percuma dan peribadi?",
        answer: "Ya. Ia percuma, tanpa pendaftaran dan berjalan dalam pelayar anda. Jumlah yang anda taip tidak pernah dihantar ke pelayan.",
      },
    ],
  },
  id: {
    title: "Konverter Mata Uang – Ringgit (MYR), USD, SGD & 15 Lainnya | HelloKalku",
    description:
      "Konverter mata uang gratis dengan kurs terbaru untuk Ringgit Malaysia (MYR), Dolar AS, Dolar Singapura, Rupiah, Euro, Pound, dan lainnya. Konversi jumlah apa pun seketika.",
    keywords:
      "konverter mata uang, kalkulator kurs, konversi ringgit, kurs myr, usd ke myr, sgd ke myr, konversi mata uang, kurs hari ini",
    heading: "Konverter mata uang",
    tagline: "Konversi ringgit, dolar AS, dolar Singapura, dan 14 mata uang lain dengan kurs terbaru.",
    intro:
      "Konversi antara 17 mata uang utama, dengan ringgit Malaysia (MYR) sebagai pusat: dolar AS, dolar Singapura, rupiah Indonesia, euro, pound, yen, yuan, baht, dan lainnya. Kurs berasal dari data referensi Bank Sentral Eropa dan diperbarui setiap kali Anda membuka halaman, dengan cadangan bawaan jika Anda offline. Semuanya berjalan di browser Anda — tidak ada yang Anda ketik dikirim ke mana pun.",
    howHeading: "Cara kerja konverter mata uang",
    how: [
      "Pilih mata uang yang Anda miliki dan yang Anda inginkan, lalu masukkan jumlah. Hasil diperbarui seketika saat Anda mengetik, dan tombol tukar membalik kedua mata uang.",
      "Setiap kurs dikutip terhadap dolar AS dan dihitung silang, jadi mengonversi RM ke SGD, misalnya, adalah kurs SGD dibagi kurs MYR. Ini menjaga hasil tetap konsisten di kedua arah.",
      "Kurs ini adalah kurs referensi pasar tengah, titik tengah antara harga beli dan jual. Bank, pedagang valuta asing berlisensi, layanan remitansi, dan jaringan kartu menambahkan margin atau biaya, jadi jumlah yang Anda terima biasanya sedikit lebih rendah. Selalu bandingkan jumlah akhir, bukan hanya kurs utamanya.",
      "Kurs referensi diterbitkan sekali setiap hari kerja. Cukup akurat untuk menganggarkan perjalanan, menilai pembelian luar negeri, atau memeriksa penawaran, tetapi bukan harga perdagangan langsung.",
    ],
    formulaHeading: "Rumus konversi mata uang",
    formula: [
      "Jumlah terkonversi = jumlah × (kurs mata uang tujuan ÷ kurs mata uang asal), dengan kedua kurs dikutip per 1 dolar AS.",
      "Contoh: 1.000 SGD → MYR = 1.000 × ({MYR} ÷ {SGD}) ≈ {OUT}.",
    ],
    tableHeading: "Kurs ringgit",
    tableCaption: (date) => `Kurs referensi terhadap ringgit Malaysia, ${date}.`,
    columns: ["Mata uang", "1 MYR =", "1 unit = MYR"],
    tableNote: "Kurs referensi sebagai acuan, bukan penawaran. Periksa bank atau pedagang valuta asing Anda untuk kurs yang benar-benar Anda bayar.",
    faq: [
      {
        question: "Mata uang apa yang bisa saya konversi?",
        answer:
          "Tujuh belas mata uang utama: ringgit Malaysia, dolar AS, dolar Singapura, rupiah Indonesia, euro, poundsterling Inggris, yen Jepang, dolar Australia, yuan Tiongkok, baht Thailand, rupee India, won Korea Selatan, dolar Hong Kong, dolar Kanada, dolar Selandia Baru, peso Filipina, dan franc Swiss.",
      },
      {
        question: "Apakah ini kurs yang sama dengan yang dipakai bank atau pedagang valuta asing saya?",
        answer:
          "Tidak. Ini kurs referensi pasar tengah. Bank dan pedagang valuta asing mengutip kurs beli dan jual terpisah dengan margin di dalamnya, dan mungkin menambah biaya, jadi harapkan menerima agak lebih sedikit dari yang ditunjukkan konverter.",
      },
      {
        question: "Dari mana kurs pertukaran berasal?",
        answer:
          "Kurs referensi Bank Sentral Eropa, disajikan melalui API Frankfurter gratis dan diperbarui setiap hari kerja. Jika permintaan langsung gagal, konverter kembali ke kurs terakhir yang tersimpan di aplikasi dan memberi tahu Anda tanggalnya.",
      },
      {
        question: "Apakah konverter mata uang ini gratis dan privat?",
        answer: "Ya. Gratis, tanpa pendaftaran, dan berjalan di browser Anda. Jumlah yang Anda ketik tidak pernah dikirim ke server.",
      },
    ],
  },
};

export function buildHubRoute(): RouteSeoEntry {
  const copy = {} as RouteSeoEntry["copy"];
  for (const locale of LOCALES) {
    const h = HUB_COPY[locale];
    copy[locale] = { title: h.title, description: h.description, keywords: h.keywords, heading: h.heading, tagline: h.tagline };
  }
  return { slug: "currency", path: CURRENCY_HUB_PATH, prerender: true, sitemap: { priority: 0.95, changefreq: "daily" }, copy };
}

export function buildHubContent(locale: Locale): CalculatorContent {
  const h = HUB_COPY[locale];
  const rates = FX_SNAPSHOT.rates;
  const rows = CURRENCIES.filter((c) => c.code !== HUB).map((c) => [
    `${c.name[locale]} (${c.code})`,
    formatMoney(getRate(rates, HUB, c.code), c.code, locale),
    formatMoney(getRate(rates, c.code, HUB), HUB, locale),
  ]);
  return {
    intro: h.intro,
    howItWorks: { heading: h.howHeading, paragraphs: h.how },
    formula: {
      heading: h.formulaHeading,
      paragraphs: h.formula.map((p) =>
        p
          .replace("{MYR}", formatRate(rates.MYR, locale))
          .replace("{SGD}", formatRate(rates.SGD, locale))
          .replace("{OUT}", formatMoney(1000 * (rates.MYR / rates.SGD), "MYR", locale)),
      ),
    },
    rateTable: {
      heading: h.tableHeading,
      caption: h.tableCaption(fmtDate(FX_SNAPSHOT.date, locale)),
      columns: [...h.columns],
      rows,
      note: h.tableNote,
    },
    faq: h.faq,
    related: ["salary", "fd", "normal"],
    lastReviewed: FX_SNAPSHOT.date,
  };
}

export function buildCurrencyRoutes(): RouteSeoEntry[] {
  return [buildHubRoute(), ...CURRENCY_PAIRS.map(([f, t]) => buildPairRoute(f, t))];
}

export function buildCurrencyContent(): Record<string, Record<Locale, CalculatorContent>> {
  const out: Record<string, Record<Locale, CalculatorContent>> = {
    currency: { en: buildHubContent("en"), ms: buildHubContent("ms"), id: buildHubContent("id") },
  };
  for (const [f, t] of CURRENCY_PAIRS) {
    out[pairSlug(f, t)] = {
      en: buildPairContent(f, t, "en"),
      ms: buildPairContent(f, t, "ms"),
      id: buildPairContent(f, t, "id"),
    };
  }
  return out;
}
