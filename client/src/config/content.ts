// Long-form content shown beneath each calculator. Rendered by
// CalculatorContent in the client AND serialized by the prerender script so
// crawlers see the prose even before JavaScript hydrates.
//
// Keep this file plain data — no imports beyond types — so it can be consumed
// by the Node build step as well as the React app.

import type { Locale } from "@/lib/i18n";
import type { RouteSlug } from "@/config/seo";

export interface ContentSection {
  heading: string;
  /** Plain text or simple HTML strings. Each entry renders as a <p>. */
  paragraphs: string[];
}

export interface ContentExample {
  title: string;
  given: string[];
  result: string;
}

export interface ContentFaqItem {
  question: string;
  answer: string;
}

export interface CalculatorContent {
  intro: string;
  howItWorks: ContentSection;
  formula?: ContentSection;
  examples?: ContentExample[];
  faq: ContentFaqItem[];
  /** Slugs of related calculators (linked at the bottom of each page). */
  related: RouteSlug[];
  /** Last reviewed date (ISO) — surfaced as "Updated …" for trust. */
  lastReviewed?: string;
}

type ContentMap = Partial<Record<RouteSlug, Record<Locale, CalculatorContent>>>;

export const calculatorContent: ContentMap = {
  salary: {
    en: {
      intro:
        "Estimate your Malaysia monthly take-home pay after statutory deductions. This calculator applies EPF, SOCSO, EIS, and PCB (monthly income tax) using 2026 rates.",
      howItWorks: {
        heading: "How the Malaysia salary calculator works",
        paragraphs: [
          "Your gross monthly salary is the starting point. From it, statutory contributions are deducted: EPF (Employees Provident Fund), SOCSO (Social Security Organisation), EIS (Employment Insurance System), and PCB (Potongan Cukai Bulanan — monthly tax deduction).",
          "Employees aged below 60 contribute 11% to EPF by default; you can adjust to 7% or higher voluntary rates. SOCSO and EIS are split between employer and employee at small fixed-rate tiers.",
          "PCB is calculated by annualising your gross income, applying tax reliefs you qualify for, looking up the resident progressive bracket, then dividing by 12 to estimate the monthly withheld amount. Non-residents are taxed at a flat 30%.",
        ],
      },
      formula: {
        heading: "Salary deduction formulas",
        paragraphs: [
          "Take-home = Gross salary − EPF − SOCSO − EIS − PCB.",
          "EPF (employee, default) = 11% × gross monthly wage.",
          "PCB (resident, annualised) = lookup(taxable annual income, progressive brackets) ÷ 12. The 2026 resident brackets range from 0% up to RM5,000 to 30% above RM2,000,000.",
        ],
      },
      examples: [
        {
          title: "Example 1 — RM 6,000 salary, Malaysian resident",
          given: [
            "Monthly gross: RM 6,000",
            "EPF rate: 11%",
            "Annual bonus: RM 0",
            "Other relief: RM 0",
          ],
          result:
            "Monthly EPF RM 660, SOCSO ~RM 24.75, EIS ~RM 9.90, PCB ~RM 100. Estimated take-home: roughly RM 5,205.",
        },
        {
          title: "Example 2 — RM 12,000 salary, Malaysian resident",
          given: [
            "Monthly gross: RM 12,000",
            "EPF rate: 11%",
            "Annual bonus: RM 12,000",
          ],
          result:
            "Higher PCB due to a tax bracket of 19–25%. Take-home typically lands around RM 9,300–9,500 depending on reliefs claimed.",
        },
      ],
      faq: [
        {
          question: "Is the take-home pay shown my final salary?",
          answer:
            "It is an estimate. PCB is reconciled annually when you file taxes (Form BE/B/M). Reliefs, rebates, and zakat payments can lower your final tax bill, increasing your effective take-home over the year.",
        },
        {
          question: "What is the difference between PCB and income tax?",
          answer:
            "PCB is the monthly amount your employer withholds and remits to LHDN on your behalf. Your final income tax is calculated when you file your tax return; PCB is a pre-payment toward that.",
        },
        {
          question: "Do foreign workers contribute to EPF?",
          answer:
            "Foreign workers can contribute to EPF, but it is not mandatory unless they opt in. SOCSO and EIS coverage rules also differ — switch the worker-type setting in the calculator to see the relevant deductions.",
        },
        {
          question: "How are bonuses taxed in Malaysia?",
          answer:
            "Bonuses are added to your annual taxable income and taxed at your marginal rate. PCB rules apply a special withholding formula in the month the bonus is paid, but the net annual tax is unchanged.",
        },
        {
          question: "What if I am a non-resident for tax purposes?",
          answer:
            "Non-residents (fewer than 182 days in Malaysia in a calendar year) are taxed at a flat 30% on Malaysian-sourced employment income, with no access to most reliefs.",
        },
      ],
      related: ["zakat", "scientific", "faraid"],
      lastReviewed: "2026-01-01",
    },
    id: {
      intro:
        "Estimasi gaji bersih bulanan Malaysia setelah potongan wajib. Kalkulator ini menerapkan EPF, SOCSO, EIS, dan PCB (pemotongan pajak bulanan) berdasarkan tarif 2026.",
      howItWorks: {
        heading: "Cara kerja kalkulator gaji Malaysia",
        paragraphs: [
          "Gaji kotor bulanan adalah titik awal. Dari sana, kontribusi wajib dipotong: EPF, SOCSO, EIS, dan PCB.",
          "Karyawan di bawah 60 tahun secara default berkontribusi 11% ke EPF; Anda dapat menyesuaikan ke 7% atau tingkat sukarela lebih tinggi.",
          "PCB dihitung dengan menyetahunkan pendapatan kotor, menerapkan keringanan pajak yang berlaku, mencari kurung pajak progresif untuk penduduk, lalu membaginya 12.",
        ],
      },
      formula: {
        heading: "Rumus potongan gaji",
        paragraphs: [
          "Gaji bersih = Gaji kotor − EPF − SOCSO − EIS − PCB.",
          "EPF (karyawan, default) = 11% × gaji kotor bulanan.",
          "PCB (penduduk) = lookup(pendapatan tahunan kena pajak, kurung progresif) ÷ 12.",
        ],
      },
      faq: [
        {
          question: "Apakah hasilnya adalah gaji final saya?",
          answer:
            "Ini perkiraan. PCB direkonsiliasi saat Anda mengisi SPT tahunan; keringanan, rabat, dan pembayaran zakat dapat menurunkan pajak akhir Anda.",
        },
        {
          question: "Apa beda PCB dan pajak penghasilan?",
          answer:
            "PCB adalah jumlah bulanan yang dipotong majikan dan disetor ke LHDN; pajak final dihitung saat pelaporan tahunan, dan PCB adalah pembayaran di muka untuk itu.",
        },
      ],
      related: ["zakat", "scientific", "faraid"],
      lastReviewed: "2026-01-01",
    },
  },

  zakat: {
    en: {
      intro:
        "Calculate your annual zakat harta (wealth zakat) across cash, savings, gold, silver, investments, and business assets. Uses the latest nisab guidance for Malaysia.",
      howItWorks: {
        heading: "How zakat is calculated",
        paragraphs: [
          "Zakat is due on wealth that has been held for one Islamic year (hawl) and exceeds the nisab threshold. The standard rate is 2.5%.",
          "The nisab is typically pegged to the value of 85 grams of pure gold (or 595 grams of silver, depending on the muzakki's situation). Different Malaysian states publish their nisab figures annually.",
          "From the total zakatable assets, you deduct allowable liabilities — short-term debts due within the hawl period — to arrive at net zakatable wealth.",
        ],
      },
      formula: {
        heading: "Zakat formula",
        paragraphs: [
          "Zakat = 2.5% × (Zakatable assets − Allowable liabilities), if the result ≥ nisab.",
          "Zakatable assets include cash on hand, bank balances, gold and silver above personal-use thresholds, business inventory, and certain investments (ASB, unit trusts).",
        ],
      },
      examples: [
        {
          title: "Example — Mid-career professional",
          given: [
            "Cash & savings: RM 80,000",
            "ASB / unit trusts: RM 30,000",
            "Gold (investment): RM 10,000",
            "Short-term debts: RM 5,000",
            "Nisab (assumed): RM 24,000",
          ],
          result:
            "Net wealth = RM 115,000. Above nisab. Zakat due = 2.5% × RM 115,000 = RM 2,875.",
        },
      ],
      faq: [
        {
          question: "What is nisab?",
          answer:
            "Nisab is the minimum threshold of wealth above which zakat becomes obligatory. It is most commonly tied to the value of 85 grams of pure gold.",
        },
        {
          question: "Is my house or car included in zakatable assets?",
          answer:
            "No. Personal-use assets such as your primary residence, daily-use vehicle, and personal jewellery (within customary limits) are excluded.",
        },
        {
          question: "When do I pay zakat?",
          answer:
            "Once your zakatable wealth has remained above the nisab for one full Islamic year (hawl). Many muzakki pay at a fixed date each year for convenience.",
        },
        {
          question: "Can I pay zakat to multiple recipients?",
          answer:
            "Yes — the Qur'an specifies eight asnaf categories. In Malaysia, most zakat is paid through state authorities such as PPZ, LZS, MAIWP, and others which distribute on your behalf.",
        },
      ],
      related: ["salary", "faraid", "wasiat"],
      lastReviewed: "2026-01-01",
    },
    id: {
      intro:
        "Hitung zakat harta tahunan untuk tabungan, emas, perak, investasi, dan aset usaha berdasarkan panduan nisab Malaysia terkini.",
      howItWorks: {
        heading: "Cara zakat dihitung",
        paragraphs: [
          "Zakat wajib atas harta yang telah dimiliki selama satu tahun hijriah (haul) dan melebihi nisab. Tarif standar adalah 2,5%.",
          "Nisab biasanya dikaitkan dengan nilai 85 gram emas murni.",
          "Dari total aset wajib zakat, kurangi kewajiban jangka pendek untuk memperoleh kekayaan bersih wajib zakat.",
        ],
      },
      faq: [
        {
          question: "Apa itu nisab?",
          answer:
            "Nisab adalah batas minimum kekayaan yang membuat zakat wajib. Umumnya dipatok pada nilai 85 gram emas murni.",
        },
      ],
      related: ["salary", "faraid", "wasiat"],
      lastReviewed: "2026-01-01",
    },
  },

  faraid: {
    en: {
      intro:
        "Faraid is the Islamic system for distributing a deceased Muslim's estate among heirs. This calculator applies simplified Sunni jurisprudence to common family configurations.",
      howItWorks: {
        heading: "How faraid distribution works",
        paragraphs: [
          "After funeral expenses, debts, and any valid wasiat (up to one-third of the estate to non-heirs) are settled, the remainder is divided among Quranic and residuary heirs.",
          "Each heir's share is fixed by the Qur'an or determined as a residual after fixed shares are allocated. Common Quranic heirs include the spouse, parents, daughters, and sisters.",
          "When fixed shares sum to less than the whole estate, the surplus goes to male agnatic relatives (asabah) — typically sons, then brothers, then paternal uncles.",
        ],
      },
      formula: {
        heading: "Common fixed shares",
        paragraphs: [
          "Husband: 1/4 (with children) or 1/2 (without children).",
          "Wife / wives: 1/8 (with children) or 1/4 (without children), divided equally if multiple.",
          "Daughter (one, no son): 1/2. Two or more daughters (no son): 2/3 combined. With sons, daughters take half a son's share.",
          "Mother: 1/6 (with children or two+ siblings) or 1/3 otherwise.",
          "Father: 1/6 as a fixed share, plus any residual if no son exists.",
        ],
      },
      faq: [
        {
          question: "Does faraid override a will (wasiat)?",
          answer:
            "Yes for the bulk of the estate. A Muslim may only bequeath up to one-third of the estate by wasiat, and that one-third cannot go to existing Quranic heirs unless other heirs consent.",
        },
        {
          question: "What about jointly-owned property?",
          answer:
            "Jointly-owned assets are first divided to determine the deceased's share, which then enters the faraid estate. Harta sepencarian (jointly-acquired marital property) is settled separately in Malaysian Syariah courts.",
        },
        {
          question: "Is this calculator a legal opinion?",
          answer:
            "No. It is a planning aid based on standard Sunni rules. Complex family situations should be confirmed with a Syariah lawyer or the relevant religious authority.",
        },
      ],
      related: ["wasiat", "zakat", "salary"],
      lastReviewed: "2026-01-01",
    },
    id: {
      intro:
        "Faraid adalah sistem Islam untuk membagi harta peninggalan seorang Muslim kepada ahli waris. Kalkulator ini menerapkan kaidah Sunni yang umum.",
      howItWorks: {
        heading: "Cara pembagian faraid",
        paragraphs: [
          "Setelah biaya pemakaman, utang, dan wasiat sah (maksimum sepertiga untuk non-ahli waris) diselesaikan, sisanya dibagi kepada ahli waris.",
          "Bagian setiap ahli waris ditetapkan oleh Al-Qur'an atau menjadi sisa (asabah) bagi kerabat laki-laki tertentu.",
        ],
      },
      faq: [
        {
          question: "Apakah faraid mengabaikan wasiat?",
          answer:
            "Wasiat hanya berlaku untuk maksimum sepertiga harta dan tidak boleh kepada ahli waris kecuali ahli waris lain setuju. Sisa harta dibagi menurut faraid.",
        },
      ],
      related: ["wasiat", "zakat", "salary"],
      lastReviewed: "2026-01-01",
    },
  },

  wasiat: {
    en: {
      intro:
        "Wasiat is an Islamic will. In Malaysia, a Muslim can bequeath up to one-third of their estate to non-heirs; the rest is distributed by faraid. This guide walks you through the practical workflow.",
      howItWorks: {
        heading: "Building your wasiat",
        paragraphs: [
          "List your assets — property, EPF, bank accounts, investments, business interests — and any debts that will need to be settled from the estate.",
          "Identify your executors (wasi). Two or more is recommended for redundancy. Choose people who understand Shariah and your wishes.",
          "Specify any one-third wasiat bequests — to non-heirs, charity (waqf), or specific causes. Document the reasoning clearly.",
          "Lodge the wasiat with a registered amanah/trust corporation or a Syariah-qualified lawyer for safekeeping and probate.",
        ],
      },
      faq: [
        {
          question: "Can I bequeath more than one-third to non-heirs?",
          answer:
            "Only if all adult Quranic heirs consent after your death. Otherwise the cap is one-third.",
        },
        {
          question: "Is EPF distributed via faraid or my nominee?",
          answer:
            "An EPF nominee in Malaysia is treated as a trustee (wasi), not the absolute owner. The EPF balance ultimately enters the faraid pool, although the nominee facilitates distribution.",
        },
      ],
      related: ["faraid", "zakat", "salary"],
      lastReviewed: "2026-01-01",
    },
    id: {
      intro:
        "Wasiat adalah wasiat Islam. Di Malaysia, seorang Muslim dapat mewasiatkan maksimum sepertiga hartanya kepada non-ahli waris; sisanya dibagi dengan faraid.",
      howItWorks: {
        heading: "Menyusun wasiat",
        paragraphs: [
          "Daftarkan aset Anda dan utang yang harus diselesaikan.",
          "Tetapkan wasi (pelaksana wasiat) — disarankan dua orang atau lebih.",
          "Tentukan wasiat hingga sepertiga untuk non-ahli waris, sedekah, atau wakaf.",
          "Simpan wasiat di perusahaan amanah atau pengacara syariah.",
        ],
      },
      faq: [
        {
          question: "Bisakah saya mewasiatkan lebih dari sepertiga?",
          answer: "Hanya jika seluruh ahli waris dewasa setuju setelah Anda wafat.",
        },
      ],
      related: ["faraid", "zakat", "salary"],
      lastReviewed: "2026-01-01",
    },
  },

  normal: {
    en: {
      intro:
        "A basic arithmetic calculator for everyday use — addition, subtraction, multiplication, and division — with full keyboard support and a running history.",
      howItWorks: {
        heading: "Tips for using the basic calculator",
        paragraphs: [
          "Use your keyboard: number keys, +, −, *, /, Enter (=), and Backspace are all wired up.",
          "Click any past entry in the history panel to recall it. History is stored locally in your browser and never leaves your device.",
        ],
      },
      faq: [
        {
          question: "Does my history sync across devices?",
          answer:
            "No. History is stored only in your browser's local storage on this device.",
        },
        {
          question: "How accurate is the arithmetic?",
          answer:
            "Calculations use JavaScript's IEEE-754 double-precision floats. For most everyday use this is exact; for high-precision financial work consider a dedicated tool.",
        },
      ],
      related: ["scientific", "salary", "zakat"],
    },
    id: {
      intro:
        "Kalkulator aritmatika dasar — tambah, kurang, kali, bagi — dengan dukungan keyboard penuh dan riwayat lokal.",
      howItWorks: {
        heading: "Tips menggunakan kalkulator dasar",
        paragraphs: [
          "Gunakan keyboard: angka, +, −, *, /, Enter (=), dan Backspace.",
          "Klik entri di panel riwayat untuk memanggilnya kembali.",
        ],
      },
      faq: [
        {
          question: "Apakah riwayat tersinkron lintas perangkat?",
          answer: "Tidak. Riwayat hanya disimpan di penyimpanan lokal browser ini.",
        },
      ],
      related: ["scientific", "salary", "zakat"],
    },
  },

  scientific: {
    en: {
      intro:
        "A scientific calculator with trigonometry (sin, cos, tan and inverses), logarithms (log, ln), exponents, factorials, and mathematical constants (π, e).",
      howItWorks: {
        heading: "Function reference",
        paragraphs: [
          "Trigonometric functions accept either degrees or radians — toggle the mode before entering values.",
          "log uses base 10; ln is the natural logarithm. For other bases, use the change-of-base formula: log_b(x) = ln(x) / ln(b).",
          "Operator precedence follows standard math: parentheses → exponents → multiply/divide → add/subtract.",
        ],
      },
      faq: [
        {
          question: "Why do I get a different result for sin(30)?",
          answer:
            "Check the angle mode. sin(30°) = 0.5, but sin(30 rad) ≈ −0.988.",
        },
        {
          question: "Does the calculator handle complex numbers?",
          answer:
            "No — only real-valued arithmetic. Square roots of negative numbers return an error.",
        },
      ],
      related: ["normal", "salary", "zakat"],
    },
    id: {
      intro:
        "Kalkulator saintifik dengan trigonometri, logaritma, eksponen, faktorial, dan konstanta matematika.",
      howItWorks: {
        heading: "Referensi fungsi",
        paragraphs: [
          "Fungsi trigonometri menerima derajat atau radian — pilih mode terlebih dahulu.",
          "log adalah basis 10; ln adalah logaritma natural.",
        ],
      },
      faq: [
        {
          question: "Mengapa sin(30) berbeda?",
          answer: "Periksa mode sudut. sin(30°) = 0,5; sin(30 rad) ≈ −0,988.",
        },
      ],
      related: ["normal", "salary", "zakat"],
    },
  },
};

export function getCalculatorContent(
  slug: RouteSlug,
  locale: Locale,
): CalculatorContent | undefined {
  return calculatorContent[slug]?.[locale];
}
