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

export interface ContentRateTable {
  heading: string;
  columns: string[];
  rows: string[][];
  /** Optional caption shown above the table. */
  caption?: string;
  /** Optional footnote shown below the table. */
  note?: string;
}

export interface CalculatorContent {
  intro: string;
  howItWorks: ContentSection;
  formula?: ContentSection;
  rateTable?: ContentRateTable;
  examples?: ContentExample[];
  faq: ContentFaqItem[];
  /** Slugs of related calculators (linked at the bottom of each page). */
  related: RouteSlug[];
  /** Last reviewed date (ISO) — surfaced as "Updated …" for trust. */
  lastReviewed?: string;
}

type ContentMap = Partial<Record<RouteSlug, Record<Locale, CalculatorContent>>>;

export const calculatorContent: ContentMap = {
  carloan: {
    en: {
      intro:
        "Estimate the monthly instalment on a Malaysian car loan and the true cost of borrowing. Car loans here are hire purchase agreements, and the rules changed on 1 June 2026: the Hire-Purchase (Amendment) Act abolished the flat rate and the Rule of 78 for new agreements, which now price on a reducing balance and must disclose an effective interest rate and a repayment schedule. Agreements signed before that date keep their original flat-rate terms, so this calculator models both.",
      howItWorks: {
        heading: "How the car loan calculator works",
        paragraphs: [
          "The amount financed is the vehicle price minus your down payment (usually at least 10%).",
          "For a new agreement, interest is charged only on what you still owe. The balance falls every month, so the interest portion of each instalment falls with it and the effective rate stays close to the headline rate.",
          "For an agreement signed before 1 June 2026, the flat rate applies: interest is charged on the full amount financed for every year of the tenure, regardless of how much you have repaid. That is why the effective cost works out at roughly double the headline flat rate.",
          "Choose which agreement you have. The calculator labels the rate accordingly, because the same number means very different money under the two bases.",
        ],
      },
      formula: {
        heading: "How each basis is calculated",
        paragraphs: [
          "Reducing balance (new agreements): instalment = P · r · (1 + r)^N / ((1 + r)^N − 1), where P = amount financed, r = monthly rate, N = total months.",
          "Flat rate (pre-June-2026 agreements): total interest = P · f · Y, and instalment = (P + total interest) ÷ (Y × 12).",
          "Rule of 78 rebate on early settlement of a flat-rate agreement = total interest · n(n + 1) ÷ N(N + 1), where n = complete months still to run.",
        ],
      },
      examples: [
        {
          title: "RM90,000 car, 10% down, 9 years — what a flat quote really cost",
          given: ["Amount financed: RM81,000", "Quoted: 3% flat p.a.", "Tenure: 9 years (108 months)"],
          result: "RM952.50/month and RM21,870 of interest, at an effective rate of about 5.9% — nearly double the 3% headline. A 3% flat quote was never a 3% loan, which is the practice the 2026 amendment ended.",
        },
      ],
      faq: [
        {
          question: "Why is the effective rate higher than the advertised flat rate?",
          answer: "Because a flat rate charges interest on the full original loan for the whole tenure, even though your outstanding balance falls each month. The effective (reducing-balance) rate reflects what you truly pay and is usually close to double the flat rate.",
        },
        {
          question: "How much down payment do I need for a car in Malaysia?",
          answer: "Banks typically finance up to 90% of the price, so you generally need at least a 10% down payment. A larger down payment lowers the amount financed and the total interest.",
        },
        {
          question: "Can I save money by paying off a hire purchase early?",
          answer: "On a new agreement, yes — interest stops accruing on principal you have repaid, so you only pay for the time you borrowed. On a pre-June-2026 agreement the Rule of 78 still applies, and because it front-loads interest the rebate is smaller than a reducing balance would have given. Banks have voluntarily agreed to offer goodwill discounts on early settlement of those older loans to close that gap, so it is worth asking. Switch the calculator to your agreement type to see both figures.",
        },
      ],
      related: ["housing", "salary", "tax"],
      lastReviewed: "2026-06-23",
    },
    ms: {
      intro:
        "Anggarkan ansuran bulanan pinjaman kereta di Malaysia dan kos sebenar pinjaman. Pinjaman kereta di sini ialah perjanjian sewa beli, dan peraturannya berubah pada 1 Jun 2026: Akta Sewa Beli (Pindaan) memansuhkan kadar rata dan Rule of 78 bagi perjanjian baharu, yang kini dikira atas baki berkurangan serta wajib mendedahkan kadar faedah berkesan dan jadual bayaran balik. Perjanjian sebelum tarikh itu kekal pada terma kadar rata asal, jadi kalkulator ini memodelkan kedua-duanya.",
      howItWorks: {
        heading: "Cara kalkulator pinjaman kereta berfungsi",
        paragraphs: [
          "Jumlah dibiayai ialah harga kenderaan tolak bayaran pendahuluan (biasanya sekurang-kurangnya 10%).",
          "Jumlah faedah ialah kadar rata atas jumlah penuh dibiayai bagi setiap tahun tempoh: jumlah × kadar rata × tahun. Ia tidak berkurangan apabila baki dibayar.",
          "Ansuran bulanan ialah jumlah perlu dibayar (jumlah dibiayai + faedah) dibahagi sama rata sepanjang tempoh.",
        ],
      },
      faq: [
        {
          question: "Mengapa kadar berkesan lebih tinggi daripada kadar rata yang diiklankan?",
          answer: "Kerana kadar rata mengenakan faedah atas pinjaman asal penuh sepanjang tempoh walaupun baki anda berkurangan setiap bulan. Kadar berkesan mencerminkan bayaran sebenar dan biasanya hampir dua kali ganda kadar rata.",
        },
        {
          question: "Berapa bayaran pendahuluan diperlukan untuk kereta di Malaysia?",
          answer: "Bank biasanya membiayai sehingga 90% harga, jadi anda biasanya perlu sekurang-kurangnya 10% bayaran pendahuluan. Bayaran pendahuluan lebih besar mengurangkan jumlah dibiayai dan faedah.",
        },
      ],
      related: ["housing", "salary", "tax"],
      lastReviewed: "2026-06-23",
    },
    id: {
      intro:
        "Perkirakan cicilan bulanan kredit mobil di Malaysia dan biaya pinjaman sebenarnya. Kredit mobil di sini adalah perjanjian sewa beli, dan aturannya berubah pada 1 Juni 2026: UU Sewa Beli (Amandemen) menghapus tarif flat dan Rule of 78 untuk perjanjian baru, yang kini dihitung atas saldo menurun serta wajib mengungkapkan suku bunga efektif dan jadwal pembayaran. Perjanjian sebelum tanggal itu tetap pada ketentuan tarif flat aslinya, jadi kalkulator ini memodelkan keduanya.",
      howItWorks: {
        heading: "Cara kalkulator kredit mobil bekerja",
        paragraphs: [
          "Jumlah dibiayai adalah harga kendaraan dikurangi uang muka (biasanya minimal 10%).",
          "Total bunga adalah suku bunga flat atas jumlah penuh dibiayai untuk setiap tahun tenor: jumlah × suku bunga flat × tahun. Tidak berkurang saat saldo dibayar.",
          "Cicilan bulanan adalah total yang harus dibayar (jumlah dibiayai + bunga) dibagi rata selama tenor.",
        ],
      },
      faq: [
        {
          question: "Mengapa tarif efektif lebih tinggi dari suku bunga flat yang diiklankan?",
          answer: "Karena suku bunga flat mengenakan bunga atas pinjaman awal penuh selama tenor meskipun saldo Anda turun setiap bulan. Tarif efektif mencerminkan pembayaran sebenarnya dan biasanya hampir dua kali lipat suku bunga flat.",
        },
        {
          question: "Berapa uang muka yang dibutuhkan untuk mobil di Malaysia?",
          answer: "Bank biasanya membiayai hingga 90% harga, jadi Anda umumnya butuh minimal 10% uang muka. Uang muka lebih besar menurunkan jumlah dibiayai dan total bunga.",
        },
      ],
      related: ["housing", "salary", "tax"],
      lastReviewed: "2026-06-23",
    },
  },
  fd: {
    en: {
      intro:
        "Work out the interest and maturity value of a Malaysian fixed deposit (FD). Banks pay simple interest pro-rated to the tenure, paid at maturity — nothing compounds inside a tenure. Compounding happens only when you renew and roll the interest into the new placement, once per tenure. The calculator also models breaking the deposit early and checks the maturity value against the PIDM protection limit. FD interest from licensed banks is tax-exempt for individuals.",
      howItWorks: {
        heading: "How the fixed deposit calculator works",
        paragraphs: [
          "Simple interest is your principal multiplied by the annual rate and the fraction of a year you hold the deposit: principal × rate × (months ÷ 12).",
          "The maturity value is principal plus that interest, paid out when the FD matures.",
          "Nothing compounds during a tenure. If you renew the deposit, the interest earned is rolled into the new principal and earns interest in the next cycle — so compounding happens once per completed tenure, not monthly. A single placement earns no compounding bonus at all.",
          "Because of that, a shorter tenure rolled over repeatedly compounds more often than a long one, which is why the calculator reports an effective annual return alongside the headline rate.",
          "Breaking the deposit early is costly. Common bank practice pays nothing at all before three completed months, and about half the contracted rate after that, on completed months only. Terms vary between banks.",
          "PIDM protects RM250,000 per depositor per member bank, and the limit counts principal and interest together — so a placement that starts under the cap can mature above it. Conventional and Islamic deposits are protected separately.",
        ],
      },
      formula: {
        heading: "Fixed deposit formulas",
        paragraphs: [
          "Simple maturity = P × (1 + r × months ÷ 12).",
          "Value after n renewals = P × (1 + r × months ÷ 12)^n, where P = principal, r = annual rate (÷100) and months is the tenure of one placement.",
          "Early withdrawal interest = P × (r ÷ 2) × completed months ÷ 12, and zero before three completed months.",
        ],
      },
      examples: [
        {
          title: "RM10,000 at 3.5% p.a. for 12 months",
          given: ["Principal: RM10,000", "Rate: 3.5% p.a.", "Tenure: 12 months"],
          result: "Simple interest of RM350 → RM10,350 at maturity, and no compounding bonus, because a single placement does not compound. Renew it for a second 12-month term and the interest rolls in: RM10,712.25, or RM12.25 more than simple interest over the same two years. Break it at month 6 instead and you would receive RM10,087.50 — half the rate on completed months only, giving up RM262.50.",
        },
      ],
      faq: [
        {
          question: "Is fixed deposit interest taxable in Malaysia?",
          answer: "Interest earned on deposits with licensed banks and finance companies is tax-exempt for resident individuals, so you keep the full amount shown.",
        },
        {
          question: "Should I pick a long or short tenure?",
          answer: "Longer tenures often carry slightly higher rates but lock up your money for longer. Many savers ladder several FDs across different tenures so some matures regularly while still earning competitive rates.",
        },
        {
          question: "What happens if I withdraw before maturity?",
          answer: "Early withdrawal usually means you forfeit some or all of the interest for that placement, depending on the bank's terms. The principal is protected and insured by PIDM up to RM250,000 per depositor per bank.",
        },
      ],
      related: ["epf", "salary", "tax"],
      lastReviewed: "2026-06-23",
    },
    ms: {
      intro:
        "Kira faedah dan nilai matang simpanan tetap (FD) Malaysia. Bank membayar faedah mudah berkadar dengan tempoh, dibayar pada tarikh matang — tiada apa berkompaun dalam satu tempoh. Kompaun hanya berlaku apabila anda membaharui dan menggulung faedah ke dalam penempatan baharu, sekali setiap tempoh. Kalkulator ini juga memodelkan pemecahan awal dan menyemak nilai matang terhadap had perlindungan PIDM. Faedah FD daripada bank berlesen dikecualikan cukai untuk individu.",
      howItWorks: {
        heading: "Cara kalkulator simpanan tetap berfungsi",
        paragraphs: [
          "Faedah mudah ialah pokok didarab kadar tahunan dan pecahan tahun anda menyimpan: pokok × kadar × (bulan ÷ 12).",
          "Nilai matang ialah pokok campur faedah, dibayar apabila FD matang.",
          "Tiada apa berkompaun dalam satu tempoh. Jika anda membaharui, faedah digulung ke dalam pokok baharu dan memperoleh faedah pada kitaran seterusnya — jadi kompaun berlaku sekali setiap tempoh, bukan setiap bulan. Satu penempatan tunggal tidak memperoleh bonus kompaun langsung.",
        ],
      },
      faq: [
        {
          question: "Adakah faedah simpanan tetap dikenakan cukai di Malaysia?",
          answer: "Faedah daripada simpanan di bank dan syarikat kewangan berlesen dikecualikan cukai untuk individu pemastautin, jadi anda menyimpan jumlah penuh yang ditunjukkan.",
        },
        {
          question: "Patutkah saya pilih tempoh panjang atau pendek?",
          answer: "Tempoh lebih panjang selalunya memberi kadar lebih tinggi tetapi mengunci wang anda lebih lama. Ramai penyimpan membuat 'ladder' beberapa FD pada tempoh berbeza supaya ada yang matang secara berkala.",
        },
      ],
      related: ["epf", "salary", "tax"],
      lastReviewed: "2026-06-23",
    },
    id: {
      intro:
        "Hitung bunga dan nilai jatuh tempo deposito (FD) Malaysia. Bank membayar bunga sederhana sesuai proporsi tenor, dibayar saat jatuh tempo — tidak ada yang berbunga majemuk di dalam satu tenor. Bunga majemuk hanya terjadi saat Anda memperpanjang dan menggulung bunga ke penempatan baru, sekali per tenor. Kalkulator ini juga memodelkan pencairan dini dan memeriksa nilai jatuh tempo terhadap batas perlindungan PIDM. Bunga deposito dari bank berlisensi bebas pajak untuk individu.",
      howItWorks: {
        heading: "Cara kalkulator deposito bekerja",
        paragraphs: [
          "Bunga sederhana adalah pokok dikali tarif tahunan dan fraksi tahun Anda menyimpan: pokok × tarif × (bulan ÷ 12).",
          "Nilai jatuh tempo adalah pokok ditambah bunga itu, dibayar saat deposito jatuh tempo.",
          "Tidak ada yang berbunga majemuk di dalam satu tenor. Jika Anda memperpanjang, bunga digulung ke pokok baru dan memperoleh bunga pada siklus berikutnya — jadi bunga majemuk terjadi sekali per tenor, bukan tiap bulan. Satu penempatan tunggal tidak memperoleh bonus majemuk sama sekali.",
        ],
      },
      faq: [
        {
          question: "Apakah bunga deposito kena pajak di Malaysia?",
          answer: "Bunga dari simpanan di bank dan perusahaan keuangan berlisensi bebas pajak untuk individu penduduk, jadi Anda menyimpan jumlah penuh yang ditampilkan.",
        },
        {
          question: "Sebaiknya pilih tenor panjang atau pendek?",
          answer: "Tenor lebih panjang sering memberi tarif sedikit lebih tinggi tetapi mengunci dana Anda lebih lama. Banyak penabung membuat 'ladder' beberapa deposito pada tenor berbeda agar ada yang jatuh tempo secara berkala.",
        },
      ],
      related: ["epf", "salary", "tax"],
      lastReviewed: "2026-06-23",
    },
  },
  salary: {
    en: {
      intro:
        "Estimate your Malaysia monthly take-home pay after EPF, SOCSO, EIS, and PCB. This calculator uses 2026 statutory rates for residents, non-residents, Malaysian citizens, and foreign workers, and accounts for annual bonuses when computing the monthly PCB withholding.",
      howItWorks: {
        heading: "How the Malaysia salary calculator works",
        paragraphs: [
          "Your gross monthly salary is the starting point. From that figure, four statutory deductions are taken before you receive your net pay: EPF (Employees Provident Fund / KWSP), SOCSO (Social Security Organisation / PERKESO), EIS (Employment Insurance System), and PCB (Potongan Cukai Bulanan, the monthly income tax withholding).",
          "EPF is split between you and your employer. For employees aged below 60, the standard employee rate is 11% of monthly wages while employers contribute 12% (or 13% for wages of RM5,000 and below). The employee rate dropped temporarily during COVID-era policies but has now returned to 11% as the default; you can choose to contribute more on a voluntary basis.",
          "SOCSO and EIS are tiered contributions capped at a wage ceiling. SOCSO covers occupational injury and invalidity (Schemes I and II), while EIS provides income replacement for retrenched workers for up to six months. The combined employee share is typically below 1% of monthly wages, but the employer share is meaningful and shown separately in your payslip.",
          "PCB is the trickiest line. Each month, your employer estimates how much income tax you will owe for the full calendar year — based on your year-to-date gross income, EPF, and any reliefs you have declared on Form TP1 — then divides that estimate so it is spread evenly across the remaining months. When you file your return in April–May, the actual tax is reconciled against the PCB already paid; over-withholding is refunded.",
          "Residents (in Malaysia for at least 182 days in a calendar year) are taxed on a progressive scale from 0% to 30%. Non-residents and short-term visitors are taxed at a flat 30% on Malaysian-sourced employment income, with no access to most reliefs and rebates.",
        ],
      },
      formula: {
        heading: "Salary deduction formulas",
        paragraphs: [
          "Net monthly take-home = Gross salary − EPF − SOCSO − EIS − PCB.",
          "EPF (employee, default) = 11% × gross monthly wage, rounded up to the nearest ringgit. Since the restructure of 11 May 2024, the combined employer and employee contribution feeds three accounts: Akaun Persaraan (75%), Akaun Sejahtera (15%) and Akaun Fleksibel (10%).",
          "SOCSO (employee) is calculated from a tiered table where the maximum employee contribution is RM 24.75 per month for wages of RM 4,000 and above. The employer share for the same band is RM 86.65.",
          "EIS (employee) = 0.2% of monthly wages, capped at RM 9.90 per month (wage ceiling RM 5,000). Employer contributes a matching 0.2%.",
          "PCB (resident) = MAX(0, lookup(annualised taxable income − reliefs, progressive brackets) − previously-paid PCB − zakat paid through payroll) ÷ months remaining in the year. Non-resident PCB = 30% × monthly chargeable income.",
        ],
      },
      rateTable: {
        heading: "Malaysia resident income tax brackets (2026)",
        columns: ["Chargeable income (RM)", "Marginal rate", "Tax on band (RM)"],
        rows: [
          ["0 – 5,000", "0%", "0"],
          ["5,001 – 20,000", "1%", "150"],
          ["20,001 – 35,000", "3%", "450"],
          ["35,001 – 50,000", "6%", "900"],
          ["50,001 – 70,000", "11%", "2,200"],
          ["70,001 – 100,000", "19%", "5,700"],
          ["100,001 – 400,000", "25%", "75,000"],
          ["400,001 – 600,000", "26%", "52,000"],
          ["600,001 – 2,000,000", "28%", "392,000"],
          ["Above 2,000,000", "30%", "—"],
        ],
        note: "Tax is computed cumulatively across all bands. Reliefs (EPF, life insurance, lifestyle, SSPN, medical, etc.) reduce chargeable income before this table is applied.",
      },
      examples: [
        {
          title: "Example 1 — RM 6,000 salary, Malaysian resident, no dependants",
          given: [
            "Monthly gross: RM 6,000",
            "EPF rate: 11%",
            "Annual bonus: RM 0",
            "Other declared relief beyond EPF: RM 0",
          ],
          result:
            "EPF RM 660/month, SOCSO RM 24.75, EIS RM 9.90, PCB roughly RM 95–110 depending on reliefs claimed. Estimated monthly take-home: ~RM 5,200.",
        },
        {
          title: "Example 2 — RM 12,000 salary + RM 12,000 annual bonus",
          given: [
            "Monthly gross: RM 12,000",
            "EPF rate: 11%",
            "Annual bonus paid in December: RM 12,000",
          ],
          result:
            "Annualised income RM 156,000 lands in the 25% marginal bracket. Monthly take-home settles around RM 9,300–9,500; the December bonus month has a higher PCB because the entire bonus is taxed at the marginal rate in that period.",
        },
        {
          title: "Example 3 — RM 8,000 salary, non-resident",
          given: ["Monthly gross: RM 8,000", "Resident status: Non-resident", "EPF: not contributing"],
          result:
            "PCB = 30% × RM 8,000 = RM 2,400. SOCSO/EIS may still apply depending on the work permit. Estimated take-home ~RM 5,600 before any employer-side deductions.",
        },
      ],
      faq: [
        {
          question: "Is the take-home pay shown my final salary?",
          answer:
            "No — it is an estimate. PCB is reconciled annually when you file taxes (Form BE for employees with employment income only, Form B for those with business income). Reliefs, rebates, and zakat payments can lower your final tax bill, often resulting in a small refund.",
        },
        {
          question: "What is the difference between PCB and income tax?",
          answer:
            "PCB is the monthly amount your employer withholds and remits to LHDN on your behalf. Your final income tax is what the law actually requires you to pay, calculated when you file your annual tax return. PCB is a pre-payment toward that final amount.",
        },
        {
          question: "Do foreign workers contribute to EPF?",
          answer:
            "EPF contribution is voluntary for foreign workers (those holding a work pass other than permanent residence). If they opt in, the employee rate is 11% and the employer rate is a fixed RM 5 per month per worker. SOCSO is mandatory for foreign workers under the Employees' Social Security Act since 1 January 2019.",
        },
        {
          question: "How are bonuses taxed in Malaysia?",
          answer:
            "Bonuses are added to your annual taxable income and taxed at your marginal rate. In the month a bonus is paid, your employer applies a specific PCB formula that may make that month's deduction look unusually large, but the annual total is unchanged. A larger bonus simply pushes part of your annual income into the next higher bracket.",
        },
        {
          question: "What if I am a non-resident for tax purposes?",
          answer:
            "Non-residents (in Malaysia for fewer than 182 days in a calendar year) are taxed at a flat 30% on Malaysian-sourced employment income, with no access to most reliefs and rebates. Tax treaties may offer relief if you are taxed in your home country on the same income.",
        },
        {
          question: "Can I lower my PCB by submitting reliefs to my employer?",
          answer:
            "Yes — fill out Form TP1 to declare reliefs (life insurance, medical, lifestyle, SSPN, EPF beyond the default, etc.) and Form TP3 to declare zakat paid. Your employer will reduce subsequent PCB withholdings accordingly, improving your monthly cash flow.",
        },
        {
          question: "Does this calculator include the EPF i-Saraan / voluntary contribution?",
          answer:
            "No. The calculator uses the statutory employee rate (default 11%). Voluntary contributions through i-Saraan or self-top-ups are separate and may qualify for additional tax relief up to the applicable cap.",
        },
        {
          question: "What about SOCSO and EIS for company directors?",
          answer:
            "Owners and directors who draw a salary through PAYE are typically subject to SOCSO and EIS like other employees. Sole-proprietors and partners are not — but they can opt in via the Self-Employment Social Security Scheme (SKSPS).",
        },
      ],
      related: ["zakat", "faraid", "wasiat"],
      lastReviewed: "2026-01-01",
    },
    
    ms: {
      intro:
        "Anggaran gaji bersih bulanan Malaysia selepas potongan wajib. Kalkulator ini menerapkan EPF, SOCSO, EIS, dan PCB (pemotongan cukai bulanan) berdasarkan kadar 2026.",
      howItWorks: {
        heading: "Cara kerja kalkulator gaji Malaysia",
        paragraphs: [
          "Gaji kotor bulanan adalah titik awal. Daripada sana, kontribusi wajib dipotong: EPF, SOCSO, EIS, dan PCB.",
          "Karyawan di bawah 60 tahun secara default berkontribusi 11% ke EPF; Anda boleh menyesuaikan ke 7% atau tahap sukarela lebih tinggi.",
          "PCB dikira dengan menyetahunkan pendapatan kotor, menerapkan keringanan cukai yang berlaku, mencari kurung cukai progresif untuk pemastautin, lalu membaginya 12.",
        ],
      },
      formula: {
        heading: "Rumus potongan gaji",
        paragraphs: [
          "Gaji bersih = Gaji kotor − EPF − SOCSO − EIS − PCB.",
          "EPF (karyawan, default) = 11% × gaji kotor bulanan.",
          "PCB (pemastautin) = lookup(pendapatan tahunan kena cukai, kurung progresif) ÷ 12.",
        ],
      },
      faq: [
        {
          question: "Apakah hasilnya adalah gaji final saya?",
          answer:
            "Ini perkiraan. PCB direkonsiliasi saat Anda mengisi SPT tahunan; keringanan, rabat, dan pembayaran zakat boleh menurunkan cukai akhir Anda.",
        },
        {
          question: "Apa beda PCB dan cukai pendapatan?",
          answer:
            "PCB adalah jumlah bulanan yang dipotong majikan dan disetor ke LHDN; cukai final dikira saat pelaporan tahunan, dan PCB adalah pembayaran di muka untuk itu.",
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

  epf: {
    en: {
      intro:
        "Project your KWSP (Kumpulan Wang Simpanan Pekerja) balance at retirement using your current savings, monthly salary, expected annual salary growth, and EPF dividend history. Compare your projected balance against the EPF Basic Savings target and estimate a monthly retirement income using the 4% safe-withdrawal rate.",
      howItWorks: {
        heading: "How the EPF retirement projection works",
        paragraphs: [
          "The projection starts from your current EPF balance and simulates each remaining year until your chosen retirement age. Each year it adds your employee contribution (default 11% of gross salary), your employer contribution (12% for salaries above RM 5,000; 13% for RM 5,000 and below), any voluntary top-ups (e.g. i-Saraan), and any bonus-month contributions, then credits dividends on the end-of-year balance.",
          "EPF dividends compound annually. The calculator defaults to 6.0%, just under the 6.30% declared for 2024 and the 6.15% for 2025. Because dividends are declared on the total balance rather than new contributions alone, even a half-percentage-point change meaningfully shifts the 20- or 30-year projection.",
          "Your salary is assumed to grow by the percentage you enter each year. A 3%–5% annual growth rate is typical for most Malaysian employees; adjust downward if you are near the peak of your earning years or upward if you expect rapid career progression.",
          "Since 11 May 2024, new contributions are split across three accounts: Akaun Persaraan (75%), locked until 55; Akaun Sejahtera (15%), for housing, education and health; and Akaun Fleksibel (10%), withdrawable at any time. The calculator projects all three, so you can see how much of the total is genuinely locked away for retirement rather than reachable before then. The three accounts consolidate into Akaun 55 once you reach 55.",
          "The Basic Savings target is the KWSP benchmark designed to fund 20 years of retirement at the poverty line — RM 270,000 at age 55 (early withdrawal) and RM 390,000 at age 60 (full withdrawal) by 2028. The gap analysis shows whether your projected balance is on track to meet this target.",
        ],
      },
      formula: {
        heading: "Projection formula",
        paragraphs: [
          "End balance (year n) = Begin balance + Contributions + Voluntary + Bonus contributions + Dividends.",
          "Contributions = Salary × (employee rate + employer rate) × 12.",
          "Bonus contributions = (Salary × bonus months) × (employee rate + employer rate).",
          "Dividends = End balance (before dividends) × dividend rate.",
          "Monthly retirement income (4% rule) = Projected balance × 4% ÷ 12.",
        ],
      },
      rateTable: {
        heading: "KWSP employer contribution rates (2026)",
        caption:
          "Employer rates depend on the employee's monthly salary and whether the employee is below or above 60 years old.",
        columns: ["Monthly salary", "Age below 60 — employer rate", "Age 60 & above — employer rate"],
        rows: [
          ["RM 5,000 and below", "13%", "4%"],
          ["Above RM 5,000", "12%", "4%"],
        ],
        note: "The employer rate for employees aged 60 to 75 was cut to a flat 4% with effect from the January 2019 wage, and the employee side became voluntary (0% by default). Contributions stop entirely at 75. Members below 60 may voluntarily contribute more than 11%. Since 1 October 2025, EPF is mandatory for non-citizens under 75 at 2% from the employer and 2% from the employee.",
      },
      examples: [
        {
          title: "Example 1 — 30-year-old, RM 5,000/month, RM 30,000 current balance",
          given: [
            "Current age: 30, retirement age: 60 (30-year horizon)",
            "Monthly salary: RM 5,000, salary growth: 3% per year",
            "Current EPF balance: RM 30,000",
            "Dividend rate: 5.5%, employee rate: 11%, employer rate: 13%",
            "No bonus, no voluntary contributions",
          ],
          result:
            "Projected balance at 60: approximately RM 728,000 — well above the RM 390,000 Basic Savings target. Estimated monthly retirement income at 4% SWR: ~RM 2,430.",
        },
        {
          title: "Example 2 — 45-year-old, RM 8,000/month, RM 120,000 current balance",
          given: [
            "Current age: 45, retirement age: 60 (15-year horizon)",
            "Monthly salary: RM 8,000, salary growth: 2% per year",
            "Current EPF balance: RM 120,000",
            "Dividend rate: 5.5%, employee rate: 11%, employer rate: 12%",
            "Annual bonus: 1 month",
          ],
          result:
            "Projected balance at 60: approximately RM 560,000 — above the RM 390,000 target. Estimated monthly retirement income at 4% SWR: ~RM 1,867.",
        },
      ],
      faq: [
        {
          question: "What is the EPF Basic Savings target?",
          answer:
            "The Basic Savings target is KWSP's minimum recommended balance tied to retirement age: RM 270,000 at age 55 and RM 390,000 at age 60 (updated targets for 2028 under KWSP's Retirement Income Adequacy framework). It is designed to cover approximately 20 years of minimum living expenses. Falling short does not mean you cannot retire — it is a benchmark, not a hard cutoff.",
        },
        {
          question: "What is the 4% safe-withdrawal rate?",
          answer:
            "The 4% rule is a guideline from retirement research (the Trinity Study) suggesting that withdrawing 4% of your portfolio annually has historically allowed the balance to last 30 years. Applied to an EPF balance: RM 400,000 × 4% = RM 16,000 per year, or RM 1,333 per month. This is a rough estimate — the EPF pays dividends rather than market returns, so actual sustainability depends on payout rates.",
        },
        {
          question: "Should I use 55 or 60 as my retirement age?",
          answer:
            "Age 55 unlocks partial EPF withdrawals, and the three accounts consolidate into Akaun 55 at that point. Full flexible withdrawal is available at age 60. If you plan to work until 60, use 60 for a more accurate projection. The Basic Savings target for age 55 is lower than the age-60 figure because the remaining five years of contributions are counted separately.",
        },
        {
          question: "How accurate is the dividend rate assumption?",
          answer:
            "KWSP declared 6.30% for 2024 and 6.15% for 2025, for both Simpanan Konvensional and Simpanan Shariah. The 6.0% default is slightly below both, which keeps the projection on the conservative side. Small differences compound heavily over a 20-30 year horizon, so it is worth modelling a pessimistic (5%) and an optimistic (6.5%) scenario as well.",
        },
        {
          question: "Are voluntary contributions (i-Saraan) worth it?",
          answer:
            "Voluntary top-ups via i-Saraan earn the same EPF dividend rate and are tax-deductible under Malaysian income tax. For self-employed individuals or those wanting to accelerate savings, i-Saraan contributions can significantly boost the projected balance, especially when started early. The annual tax relief limit for EPF (including voluntary) is RM 4,000.",
        },
      ],
      related: ["salary", "zakat", "normal"],
      lastReviewed: "2026-01-01",
    },

    ms: {
      intro:
        "Unjurkan baki KWSP anda pada umur persaraan menggunakan simpanan semasa, gaji bulanan, pertumbuhan gaji tahunan, dan kadar dividen EPF. Bandingkan baki yang diunjurkan dengan sasaran Simpanan Asas EPF dan anggarkan pendapatan persaraan bulanan.",
      howItWorks: {
        heading: "Cara unjuran persaraan EPF berfungsi",
        paragraphs: [
          "Unjuran bermula dari baki EPF semasa anda dan mensimulasi setiap tahun yang tinggal sehingga umur persaraan yang anda pilih. Setiap tahun, sumbangan pekerja, majikan, sukarela, dan bonus ditambah, kemudian dividen dikreditkan pada baki akhir tahun.",
          "Gaji anda diasumsikan tumbuh mengikut peratusan yang anda masukkan setiap tahun. Kadar pertumbuhan 3%–5% setahun adalah lazim untuk kebanyakan pekerja Malaysia.",
          "Sasaran Simpanan Asas adalah penanda aras KWSP: RM 270,000 pada umur 55 dan RM 390,000 pada umur 60 menjelang 2028.",
        ],
      },
      formula: {
        heading: "Formula unjuran",
        paragraphs: [
          "Baki akhir (tahun n) = Baki mula + Sumbangan + Sukarela + Sumbangan bonus + Dividen.",
          "Pendapatan persaraan bulanan (kadar 4%) = Baki yang diunjurkan × 4% ÷ 12.",
        ],
      },
      faq: [
        {
          question: "Apakah Sasaran Simpanan Asas EPF?",
          answer:
            "Sasaran Simpanan Asas ialah baki minimum yang disyorkan KWSP: RM 270,000 pada umur 55 dan RM 390,000 pada umur 60. Ia direka untuk menampung kira-kira 20 tahun sara hidup minimum.",
        },
        {
          question: "Adakah sumbangan sukarela (i-Saraan) berbaloi?",
          answer:
            "Ya. Tambahan i-Saraan mendapat kadar dividen EPF yang sama dan layak untuk pelepasan cukai sehingga RM 4,000 setahun (termasuk caruman biasa EPF).",
        },
      ],
      related: ["salary", "zakat", "normal"],
      lastReviewed: "2026-01-01",
    },

    id: {
      intro:
        "Proyeksikan saldo KWSP Anda pada usia pensiun menggunakan tabungan saat ini, gaji bulanan, pertumbuhan gaji tahunan, dan riwayat dividen EPF. Bandingkan saldo yang diproyeksikan dengan target Basic Savings EPF dan estimasikan pendapatan pensiun bulanan.",
      howItWorks: {
        heading: "Cara proyeksi pensiun EPF bekerja",
        paragraphs: [
          "Proyeksi dimulai dari saldo EPF Anda saat ini dan mensimulasikan setiap tahun yang tersisa hingga usia pensiun yang Anda pilih. Setiap tahun, kontribusi karyawan, majikan, sukarela, dan bonus ditambahkan, lalu dividen dikreditkan pada saldo akhir tahun.",
          "Gaji Anda diasumsikan tumbuh sesuai persentase yang Anda masukkan setiap tahun. Tingkat pertumbuhan 3%–5% per tahun adalah tipikal untuk kebanyakan karyawan Malaysia.",
          "Target Basic Savings adalah tolok ukur KWSP: RM 270.000 pada usia 55 dan RM 390.000 pada usia 60 menjelang 2028.",
        ],
      },
      formula: {
        heading: "Rumus proyeksi",
        paragraphs: [
          "Saldo akhir (tahun n) = Saldo awal + Kontribusi + Sukarela + Kontribusi bonus + Dividen.",
          "Pendapatan pensiun bulanan (aturan 4%) = Saldo yang diproyeksikan × 4% ÷ 12.",
        ],
      },
      faq: [
        {
          question: "Apa itu target Basic Savings EPF?",
          answer:
            "Target Basic Savings adalah saldo minimum yang direkomendasikan KWSP: RM 270.000 pada usia 55 dan RM 390.000 pada usia 60. Dirancang untuk menanggung sekitar 20 tahun biaya hidup minimum.",
        },
        {
          question: "Apakah kontribusi sukarela (i-Saraan) layak dilakukan?",
          answer:
            "Ya. Tambahan i-Saraan mendapat tarif dividen EPF yang sama dan memenuhi syarat untuk potongan pajak hingga RM 4.000 per tahun (termasuk kontribusi EPF biasa).",
        },
      ],
      related: ["salary", "zakat", "normal"],
      lastReviewed: "2026-01-01",
    },
  },

  zakat: {
    en: {
      intro:
        "Calculate your annual zakat harta (wealth zakat) across cash, savings, gold, silver, investment portfolios, and business assets. The calculator applies the standard 2.5% rate against your net zakatable wealth and compares the total against the prevailing nisab so you instantly see whether zakat is due.",
      howItWorks: {
        heading: "How zakat is calculated",
        paragraphs: [
          "Zakat al-mal (wealth zakat) is obligatory on wealth that has been held for at least one full Islamic (lunar) year — called the hawl — and that exceeds the nisab threshold. The rate that applies to most asset classes is 2.5%.",
          "The nisab is typically pegged to the market value of 85 grams of pure gold (and, alternatively, 595 grams of silver — whichever is lower is sometimes used to protect lower-income Muslims). Malaysian state zakat authorities such as PPZ, LZS-MAIWP, MAIWP, and others publish the current nisab in ringgit each year, updated as gold prices move.",
          "From the total of your zakatable assets, you may deduct allowable liabilities. These are typically short-term debts due within the hawl: an outstanding credit-card balance, a personal loan instalment, family maintenance arrears, and similar. Long-term liabilities such as a 20-year housing loan are usually deducted only by the instalment due within the year, not the full principal.",
          "Once the net zakatable wealth is computed, compare it against the nisab. If it is below the nisab, no zakat is due for that hawl. If it equals or exceeds the nisab, the entire net amount (not just the portion above the threshold) is multiplied by 2.5%.",
          "Some specific asset classes have their own rules. Zakat on agricultural produce uses 5% or 10% depending on irrigation. Zakat on business inventory follows the standard 2.5% but is computed on net working capital. EPF balances become zakatable upon withdrawal, with state authorities differing slightly on the exact mechanism (paying once upfront vs. annually after withdrawal).",
        ],
      },
      formula: {
        heading: "Zakat formula",
        paragraphs: [
          "Zakat due = 2.5% × (Zakatable assets − Allowable liabilities), if (Zakatable assets − Allowable liabilities) ≥ Nisab.",
          "Zakatable assets include: cash on hand, current and savings account balances, fixed deposits, gold and silver above personal-use thresholds, business inventory and receivables, investment-grade unit trusts, shares held for trading, ASB / ASM units, and similar.",
          "Excluded (not zakatable): primary residence, the vehicle you use daily, personal jewellery within customary limits (4-9 mayam in many Malaysian states), tools of your trade, and household furnishings.",
          "Net wealth that falls below nisab is exempt — even by a single ringgit. Wealth slightly above nisab is fully zakatable.",
        ],
      },
      rateTable: {
        heading: "Zakat rates by asset class",
        columns: ["Asset class", "Rate", "Notes"],
        rows: [
          ["Cash, savings, fixed deposit", "2.5%", "On the lowest balance held for one full hawl, or the balance at year-end (state-dependent)."],
          ["Gold (investment)", "2.5%", "On value once total weight exceeds the personal-use threshold."],
          ["Silver", "2.5%", "Same principle as gold; nisab is 595g of silver."],
          ["Business inventory & receivables", "2.5%", "Net of trade payables. Computed at year-end stocktake."],
          ["ASB / ASM / unit trusts", "2.5%", "On market value; some state councils accept a simplified method."],
          ["Agricultural produce", "5% – 10%", "10% rain-fed; 5% irrigated. Only certain staples (e.g. rice)."],
          ["Livestock", "Tiered", "Camel, cattle, sheep — fixed-quantity rules from classical fiqh."],
          ["EPF / pension lump sums", "2.5%", "Typically zakatable upon withdrawal; rules vary by state."],
        ],
        note: "Always confirm with your state zakat authority for the exact computation and nisab in any given year.",
      },
      examples: [
        {
          title: "Example 1 — Mid-career professional",
          given: [
            "Cash & savings: RM 80,000",
            "ASB / unit trusts: RM 30,000",
            "Gold (investment): RM 10,000",
            "Short-term debts: RM 5,000",
            "Nisab (assumed): RM 24,000",
          ],
          result:
            "Net zakatable wealth = RM 115,000, which is above the nisab. Zakat due = 2.5% × RM 115,000 = RM 2,875.",
        },
        {
          title: "Example 2 — Young saver below nisab",
          given: [
            "Cash & savings: RM 18,000",
            "Gold: RM 2,000",
            "Nisab (assumed): RM 24,000",
          ],
          result:
            "Net wealth = RM 20,000, below the RM 24,000 nisab. No zakat is due this hawl; the wealth is tracked again next year.",
        },
        {
          title: "Example 3 — Business owner",
          given: [
            "Inventory at year-end: RM 250,000",
            "Trade receivables: RM 40,000",
            "Trade payables: RM 60,000",
            "Cash (business): RM 30,000",
          ],
          result:
            "Net zakatable working capital = 250,000 + 40,000 + 30,000 − 60,000 = RM 260,000. Zakat = 2.5% × RM 260,000 = RM 6,500.",
        },
      ],
      faq: [
        {
          question: "What is nisab?",
          answer:
            "Nisab is the minimum threshold of wealth above which zakat becomes obligatory. It is most commonly tied to the market value of 85 grams of pure gold. Malaysian state zakat authorities publish the prevailing nisab each year.",
        },
        {
          question: "Is my house or car included in zakatable assets?",
          answer:
            "No. Personal-use assets such as your primary residence, daily-use vehicle, household furnishings, and personal jewellery within customary limits are excluded. A second house held for rental income is treated differently — the rental cash flow is zakatable, but the property itself usually is not.",
        },
        {
          question: "When do I pay zakat?",
          answer:
            "Once your zakatable wealth has remained above the nisab for one full Islamic (hijri) year (the hawl). Most muzakki choose a fixed anniversary date — for example, the start of Ramadan or a calendar date — and reconcile annually.",
        },
        {
          question: "Can I pay zakat to multiple recipients?",
          answer:
            "Yes — the Qur'an specifies eight asnaf (recipient) categories. In Malaysia, most zakat is paid through state authorities (PPZ, LZS-MAIWP, MAIWP, MUIS-equivalents) which distribute on your behalf to all eight asnaf in the prescribed proportions.",
        },
        {
          question: "Is zakat deductible from income tax?",
          answer:
            "Yes — zakat paid to a recognised institution is a rebate against income tax payable in Malaysia, not just a relief. The rebate equals the zakat paid, capped at your tax liability for the year, so it can entirely offset your tax bill.",
        },
        {
          question: "How is EPF zakat handled?",
          answer:
            "Most state authorities require zakat on EPF only at the point of withdrawal — either as a one-off 2.5% on the lump sum (preferred by many councils) or annually thereafter on the remaining balance. Some muzakki pay annually on EPF balances even before withdrawal; check with your state authority.",
        },
        {
          question: "What if I have shared assets with a spouse?",
          answer:
            "Each spouse computes zakat on their own share of jointly-held assets. Joint bank accounts are typically split 50/50 unless documented otherwise; pre-marital assets remain individually owned for zakat purposes.",
        },
      ],
      related: ["salary", "faraid", "wasiat"],
      lastReviewed: "2026-01-01",
    },
    
    ms: {
      intro:
        "Kira zakat harta tahunan untuk simpanan, emas, perak, pelaburan, dan aset perniagaan berdasarkan panduan nisab Malaysia terkini.",
      howItWorks: {
        heading: "Cara zakat dikira",
        paragraphs: [
          "Zakat wajib atas harta yang telah dimiliki selama satu tahun hijriah (haul) dan melebihi nisab. Kadar standar adalah 2,5%.",
          "Nisab biasanya dikaitkan dengan nilai 85 gram emas murni.",
          "Daripada total aset wajib zakat, kurangi kewajiban jangka pendek untuk memperoleh kekayaan bersih wajib zakat.",
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
        "Faraid is the Islamic system for distributing a deceased Muslim's estate among heirs. This calculator applies standard Sunni jurisprudence — as practised in Malaysia by Syariah courts — to the most common family configurations. Enter the surviving heirs and the estate value to see each heir's fixed share, any residual (asabah), and the final ringgit amount per person.",
      howItWorks: {
        heading: "How faraid distribution works",
        paragraphs: [
          "Before faraid is applied, four pre-distribution items must be settled from the estate, in this order: (1) funeral and burial expenses; (2) outstanding debts owed by the deceased — including unpaid zakat, kifarah, mahar, and conventional debts; (3) valid wasiat to non-heirs, capped at one-third of the residue; and (4) any harta sepencarian (jointly-acquired marital property) due to the surviving spouse.",
          "Whatever remains after these deductions is the net distributable estate. Faraid then divides this net estate among two classes of heirs: Quranic heirs (ashab al-furud), whose shares are explicitly fixed by the Qur'an, and residuary heirs (asabah), who receive whatever surplus is left after the Quranic shares are paid out.",
          "If the Quranic shares sum to less than the whole net estate, the residual passes to the male agnatic line — typically sons (and through them, grandsons), then the father, then brothers, then paternal uncles. If there are no asabah, the surplus reverts (radd) back to the Quranic heirs in proportion to their shares, with the spouse usually excluded from this reversion.",
          "Two special doctrines occasionally apply. Awl (proportional reduction) is used when the sum of fixed shares exceeds one — every share is scaled down so the total adds up to one. Hajb (exclusion) blocks distant heirs in favour of closer ones — for example, a grandson is excluded if the deceased's son is alive.",
          "The calculator handles these standard cases, but it is a planning aid only. Complex situations — non-Muslim heirs, adopted children, conflicting paternity, missing or unborn heirs, harta sepencarian disputes — should be referred to a Malaysian Syariah Court or qualified Syariah lawyer.",
        ],
      },
      formula: {
        heading: "Common fixed shares",
        paragraphs: [
          "Husband: 1/4 (when the deceased wife has surviving descendants) or 1/2 (no surviving descendants).",
          "Wife / wives: 1/8 (with surviving descendants) or 1/4 (without), divided equally if multiple wives.",
          "Daughter: 1/2 if she is the only daughter and there is no son; 2/3 split among two or more daughters with no son; ta'sib (residuary) at the rate of half a son's share when sons exist.",
          "Son: residuary heir — receives twice the share of any daughter and inherits the entire residual if alone.",
          "Mother: 1/6 if the deceased has children or two or more siblings; 1/3 otherwise (subject to the Umariyyatan adjustment when spouse + both parents are the only heirs).",
          "Father: 1/6 as a fixed share if the deceased has a son or son-of-son; residuary heir otherwise, with the right to a fixed 1/6 in addition to any residual when daughters but no sons survive.",
          "Full sister: 1/2 (one only, no son/daughter/father), 2/3 (two+, same conditions), or residuary alongside brothers (kalalah cases).",
          "Half-siblings (uterine): 1/6 (one) or 1/3 split (two+), only when the deceased has no descendants or father.",
        ],
      },
      rateTable: {
        heading: "Quick reference — Quranic shares",
        columns: ["Heir", "Share with descendants", "Share without descendants"],
        rows: [
          ["Husband", "1/4", "1/2"],
          ["Wife (one or several, combined)", "1/8", "1/4"],
          ["Daughter (one, no son)", "1/2", "1/2"],
          ["Daughters (two+, no son)", "2/3 combined", "2/3 combined"],
          ["Mother", "1/6", "1/3 (or special cases)"],
          ["Father", "1/6 + residual if no son", "Residual"],
          ["Full sister (one, no son/daughter/father)", "Not applicable (excluded)", "1/2"],
          ["Full sisters (two+)", "Excluded", "2/3 combined"],
        ],
        note: "Shares can be adjusted by awl (proportional reduction) or radd (return) depending on the heir combination.",
      },
      examples: [
        {
          title: "Example 1 — Husband, mother, two daughters",
          given: [
            "Estate (net): RM 600,000",
            "Surviving heirs: husband, mother, two daughters",
          ],
          result:
            "Husband 1/4 = RM 150,000; Mother 1/6 = RM 100,000; Two daughters 2/3 split equally = RM 200,000 each. Total: RM 650,000. Awl reduces shares proportionally so the total = RM 600,000.",
        },
        {
          title: "Example 2 — Wife, one son, one daughter",
          given: [
            "Estate (net): RM 900,000",
            "Surviving heirs: wife, one son, one daughter",
          ],
          result:
            "Wife 1/8 = RM 112,500. Remaining RM 787,500 split between son and daughter in 2:1 ratio: son RM 525,000, daughter RM 262,500.",
        },
      ],
      faq: [
        {
          question: "Does faraid override a will (wasiat)?",
          answer:
            "For the bulk of the estate, yes. A Muslim may bequeath at most one-third of the estate by wasiat, and that one-third generally cannot go to existing Quranic heirs unless all other adult heirs consent after death. The remaining two-thirds (and the entire estate if no wasiat is made) is distributed by faraid.",
        },
        {
          question: "What about jointly-owned property and harta sepencarian?",
          answer:
            "Harta sepencarian (jointly-acquired marital property) is settled separately by the Syariah Court before faraid is applied. The surviving spouse's share of harta sepencarian is removed from the estate first, and only the deceased's portion enters the faraid distribution.",
        },
        {
          question: "Is this calculator a legal opinion?",
          answer:
            "No. It is a planning aid based on standard Sunni rules as commonly applied in Malaysia. Complex family situations — non-Muslim heirs, adopted children, missing persons, contested paternity, foreign assets — should be confirmed with a qualified Syariah lawyer or the Mahkamah Tinggi Syariah.",
        },
        {
          question: "How are EPF, insurance, and Tabung Haji handled?",
          answer:
            "EPF, insurance payouts to a nominee, and Tabung Haji balances are not automatically excluded from faraid. In Malaysia, the nominee is treated as a trustee (wasi) who must distribute the proceeds according to faraid, not as an absolute beneficiary. Tabung Haji and similar agencies may release funds directly to the nominee for administrative simplicity, but the funds remain part of the faraid estate.",
        },
        {
          question: "Do adopted children inherit by faraid?",
          answer:
            "Adopted children (anak angkat) do not inherit through faraid because Islamic law does not recognise legal adoption as creating an inheritance relationship. They may, however, receive up to one-third of the estate through wasiat or via hibah (gifts made during the deceased's lifetime).",
        },
        {
          question: "What happens to debts the deceased owed?",
          answer:
            "All debts must be settled from the estate before any distribution. This includes unpaid zakat, mahar, kifarah, and conventional debts. If the estate cannot cover the debts, heirs are not personally liable, but they receive nothing until creditors are repaid.",
        },
        {
          question: "Can non-Muslims inherit from a Muslim?",
          answer:
            "Direct inheritance by faraid requires the heir to also be Muslim. A non-Muslim spouse or child does not inherit by faraid, but the deceased may leave them up to one-third by wasiat. Some Malaysian practitioners also use hibah ruqba and other mechanisms to provide for non-Muslim family members.",
        },
      ],
      related: ["wasiat", "zakat", "salary"],
      lastReviewed: "2026-01-01",
    },
    
    ms: {
      intro:
        "Faraid adalah sistem Islam untuk membagi harta peninggalan seorang Muslim kepada waris. Kalkulator ini menerapkan kaedah Sunni yang umum.",
      howItWorks: {
        heading: "Cara pembahagian faraid",
        paragraphs: [
          "Selepas kos pengebumian, hutang, dan wasiat sah (maksimum sepertiga untuk non-waris) diselesaikan, sisanya dibahagikan kepada waris.",
          "Bahagian setiap waris ditetapkan oleh Al-Qur'an atau menjadi sisa (asabah) bagi kerabat lelaki tertentu.",
        ],
      },
      faq: [
        {
          question: "Apakah faraid mengabaikan wasiat?",
          answer:
            "Wasiat hanya berlaku untuk maksimum sepertiga harta dan tidak boleh kepada waris kecuali waris lain setuju. Sisa harta dibahagikan menurut faraid.",
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
        "Wasiat is an Islamic will. In Malaysia, a Muslim may bequeath up to one-third of the net estate to non-heirs through wasiat; the remaining two-thirds (and the wasiat itself, if invalid) is distributed under faraid. This guide walks you through a practical, end-to-end workflow — from listing assets to lodging the document with a trust corporation.",
      howItWorks: {
        heading: "Building your wasiat",
        paragraphs: [
          "Step 1 — Take stock of your estate. List every asset in your name: residential property, second properties, EPF and Tabung Haji balances, current and savings accounts, ASB / ASM / unit trust holdings, shares, life insurance and takaful policies, vehicles, business interests, and any sizeable personal effects. Then list any debts: housing loan, car loan, personal loans, credit cards, and unpaid zakat or mahar.",
          "Step 2 — Identify your wasi (executors). The wasi is the person you appoint to administer your estate: pay debts, lodge probate, distribute assets to faraid heirs, and execute your one-third bequests. Choose at least two wasis for redundancy; ensure they understand Shariah, are trustworthy, and ideally live in Malaysia for ease of court attendance.",
          "Step 3 — Decide on your one-third bequests. A Muslim may bequeath up to one-third of the net estate (after debts) to anyone who is not a Quranic heir — non-Muslim family members, adopted children, friends, charities, waqf endowments, or specific causes. Document the recipients and amounts clearly. Bequests to existing Quranic heirs are usually invalid unless all other adult heirs consent after your death.",
          "Step 4 — Address harta sepencarian (jointly-acquired marital property). If you and your spouse jointly built up assets during the marriage, the surviving spouse can claim their share separately before faraid applies. Documenting your understanding in the wasiat helps avoid disputes.",
          "Step 5 — Lodge and store. Sign the wasiat in front of two adult Muslim male witnesses (or one male and two female witnesses under standard Shariah practice). Store the original with a registered trust corporation such as Amanah Raya or As-Salihin, a Syariah-qualified lawyer, or your state Mufti's office. Tell your wasi where it is kept.",
          "Step 6 — Review every 3–5 years or after major life events: marriage, divorce, the birth of a child, a major asset purchase or sale, the death of a wasi or beneficiary, and significant changes in your financial position.",
        ],
      },
      formula: {
        heading: "The one-third rule",
        paragraphs: [
          "Maximum wasiat to non-heirs = 1/3 × (estate value − debts − funeral expenses).",
          "If the bequest exceeds one-third, the excess is void unless the heirs unanimously consent after the death.",
          "Quranic heirs can only inherit through wasiat in addition to their faraid share if every other adult heir consents.",
        ],
      },
      faq: [
        {
          question: "Can I bequeath more than one-third to non-heirs?",
          answer:
            "Only if all adult Quranic heirs consent after your death — and that consent is rarely guaranteed. Otherwise the cap is strictly one-third; any excess is void and reverts to the faraid pool.",
        },
        {
          question: "Is EPF distributed via faraid or my nominee?",
          answer:
            "An EPF nominee in Malaysia is treated as a trustee (wasi), not the absolute owner. The EPF balance is released to the nominee for administrative simplicity, but they are obliged to distribute it according to faraid rules. Naming a child as nominee does not give that child sole ownership of the EPF.",
        },
        {
          question: "Do I need a Syariah lawyer to write a wasiat?",
          answer:
            "Not strictly — but it is strongly recommended for any estate above RM 500,000 or with complex assets (businesses, foreign property, multiple wives). Registered trust corporations such as Amanah Raya or As-Salihin offer wasiat drafting services from a few hundred ringgit upward, with the option of also acting as your wasi.",
        },
        {
          question: "What is the difference between wasiat, hibah, and waqf?",
          answer:
            "Wasiat takes effect after death and is capped at one-third for non-heirs. Hibah is a gift made during your lifetime — it leaves the estate immediately, but the recipient takes ownership before you die. Waqf is a perpetual endowment for charitable or religious purposes; the underlying asset is locked, and only its returns are distributed.",
        },
        {
          question: "What happens if I die without a wasiat?",
          answer:
            "Your entire net estate is distributed by faraid, with no allocation to non-Muslim family members, adopted children, friends, or charities. The probate process is also slower and more expensive because the court must determine all heirs and there is no executor named.",
        },
        {
          question: "Are foreign assets covered by my Malaysian wasiat?",
          answer:
            "Movable assets (bank accounts, investments) are generally administered under Malaysian law. Immovable assets (land, real estate) are governed by the law of the country where they sit. A separate will may be required for property in other jurisdictions.",
        },
        {
          question: "Can I name a non-Muslim as wasi?",
          answer:
            "Most Malaysian Syariah courts prefer a Muslim wasi to ensure the distribution follows faraid correctly. A non-Muslim co-executor (for example, a corporate trustee) is sometimes accepted, particularly for complex estates.",
        },
      ],
      related: ["faraid", "zakat", "salary"],
      lastReviewed: "2026-01-01",
    },
    
    ms: {
      intro:
        "Wasiat adalah wasiat Islam. Di Malaysia, seorang Muslim boleh mewasiatkan maksimum sepertiga hartanya kepada non-waris; sisanya dibahagikan dengan faraid.",
      howItWorks: {
        heading: "Menyusun wasiat",
        paragraphs: [
          "Daftarkan aset Anda dan hutang yang perlu diselesaikan.",
          "Tetapkan wasi (pelaksana wasiat) — disarankan dua orang atau lebih.",
          "Tentukan wasiat hingga sepertiga untuk non-waris, sedekah, atau wakaf.",
          "Simpan wasiat di perusahaan amanah atau pengacara syariah.",
        ],
      },
      faq: [
        {
          question: "Bisakah saya mewasiatkan lebih daripada sepertiga?",
          answer: "Hanya jika seluruh waris dewasa setuju selepas Anda wafat.",
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
        "A fast, free basic arithmetic calculator for everyday use — addition, subtraction, multiplication, and division — with full keyboard support, a running history stored locally on your device, and dark mode for late-night work. Designed for quick mental-math sanity checks and simple budgeting without the overkill of a spreadsheet.",
      howItWorks: {
        heading: "Tips for using the basic calculator",
        paragraphs: [
          "Type directly with your keyboard. Number keys 0–9, the operators +, −, *, /, the decimal point, Enter (or =) to compute, and Backspace to delete the last digit are all wired up. Escape clears the current expression; pressing C twice clears the entire memory.",
          "Each completed calculation is appended to the history panel on the right. Click any previous entry to recall it as the current expression — useful when you want to chain a follow-up operation on a recent result.",
          "History is stored only in your browser's local storage on this device. It never leaves your machine, never syncs to a server, and is cleared if you wipe your browser data. There is also a one-click 'Clear history' button at the top of the panel.",
          "On mobile, the on-screen keypad responds to taps with the same key behaviour. The order-of-operations on this calculator is strictly left-to-right — for parentheses, exponents, or precedence-sensitive math, use the scientific calculator instead.",
        ],
      },
      formula: {
        heading: "How the basic operators behave",
        paragraphs: [
          "Addition (+) and subtraction (−) work as expected for both integers and decimals.",
          "Multiplication (× or *) and division (÷ or /) follow left-to-right evaluation. Pressing '2 + 3 × 4 =' on this calculator yields 20, not 14 — because each operator is applied immediately to the running total.",
          "Division by zero displays 'Error' and clears the operand. The next key resets the calculator.",
          "Decimal precision uses JavaScript's IEEE-754 doubles, accurate to about 15 significant digits. Use the scientific calculator for higher-precision work.",
        ],
      },
      faq: [
        {
          question: "Does my history sync across devices?",
          answer:
            "No. History is stored only in your browser's local storage on this device. There is no account system and the data never leaves your machine.",
        },
        {
          question: "How accurate is the arithmetic?",
          answer:
            "Calculations use JavaScript's IEEE-754 double-precision floats, which are exact for integers up to 2^53 and roughly 15–17 significant digits for decimals. For typical everyday use this is more than enough; for cryptographic-grade or financial-regulation work, use a fixed-point or decimal library instead.",
        },
        {
          question: "Why does '2 + 3 × 4' give 20 instead of 14?",
          answer:
            "This calculator applies each operator immediately to the running total — the same behaviour as classic physical pocket calculators. There is no operator-precedence resolution. For PEMDAS-style math with parentheses and exponents, switch to the scientific calculator.",
        },
        {
          question: "Can I copy a result?",
          answer:
            "Yes. Tap or click on the result display to select it, then copy with Cmd/Ctrl-C. The history panel also exposes individual entries for copy.",
        },
        {
          question: "Does the calculator work offline?",
          answer:
            "Once the page is loaded, the calculator runs entirely in your browser — no internet connection is needed to compute, save history, or change themes. Bookmark the page for quick offline access.",
        },
      ],
      related: ["scientific", "salary", "zakat"],
      lastReviewed: "2026-01-01",
    },
    
    ms: {
      intro:
        "Kalkulator aritmetik asas — tambah, kurang, kali, bagi — dengan sokongan keyboard penuh dan sejarah lokal.",
      howItWorks: {
        heading: "Tips menggunakan kalkulator asas",
        paragraphs: [
          "Gunakan keyboard: angka, +, −, *, /, Enter (=), dan Backspace.",
          "Klik entri di panel sejarah untuk memanggilnya kembali.",
        ],
      },
      faq: [
        {
          question: "Apakah sejarah tersinkron lintas peranti?",
          answer: "Tidak. Sejarah hanya disimpan di penyimpanan lokal browser ini.",
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
        "A free online scientific calculator covering trigonometry (sin, cos, tan and their inverses), logarithms (log, ln), exponents, factorials, roots, percentages, and the core mathematical constants π and e. Supports degree and radian modes, full operator precedence, and a calculation history for replay and copy.",
      howItWorks: {
        heading: "Function reference",
        paragraphs: [
          "Trigonometric functions (sin, cos, tan, sin⁻¹, cos⁻¹, tan⁻¹) accept either degrees or radians. Toggle the angle-mode switch before entering values — leaving it on the wrong mode is the most common source of unexpected results.",
          "log denotes the base-10 logarithm; ln denotes the natural logarithm (base e). For other bases, use the change-of-base formula: log_b(x) = ln(x) / ln(b) = log(x) / log(b).",
          "Operator precedence follows standard mathematics: parentheses bind tightest, then unary minus, then exponentiation (^), then multiplication and division, then addition and subtraction. When two operators share precedence, evaluation proceeds left to right.",
          "Powers can be entered with the ^ operator (e.g. 2^10 = 1024) or via the dedicated x² and xʸ buttons. Square root, cube root, and arbitrary nth root are available as functions; nth root is computed as x^(1/n).",
          "Constants π (≈ 3.14159265) and e (≈ 2.71828183) are available as buttons and can be used inside any expression. The factorial operator (!) accepts non-negative integers up to about 170 before overflowing to Infinity.",
        ],
      },
      formula: {
        heading: "Identities worth remembering",
        paragraphs: [
          "Pythagorean identity: sin²(θ) + cos²(θ) = 1.",
          "Logarithm rules: log(ab) = log(a) + log(b);  log(aⁿ) = n × log(a);  log_b(x) = ln(x) / ln(b).",
          "Exponent rules: aᵐ × aⁿ = aᵐ⁺ⁿ;  (aᵐ)ⁿ = aᵐⁿ;  a⁰ = 1 for any non-zero a.",
          "Euler's identity: eⁱπ + 1 = 0 (the calculator does not handle complex numbers, but the identity is useful context for radian-mode work).",
        ],
      },
      faq: [
        {
          question: "Why do I get a different result for sin(30)?",
          answer:
            "Check the angle mode. sin(30°) = 0.5 in degree mode, but sin(30 radians) ≈ −0.988 — and 30 radians is approximately 1719°, far past one full rotation.",
        },
        {
          question: "Does the calculator handle complex numbers?",
          answer:
            "No. Only real-valued arithmetic is supported. Square roots and even-power roots of negative numbers return 'Error'. For complex math, use a CAS such as Wolfram Alpha, SymPy, or your scientific software of choice.",
        },
        {
          question: "How do I compute log base 2?",
          answer:
            "Use the change-of-base formula: log₂(x) = ln(x) / ln(2) = log(x) / log(2). For example, log₂(8) = ln(8) / ln(2) = 2.0794 / 0.6931 = 3.",
        },
        {
          question: "What is the largest factorial I can compute?",
          answer:
            "JavaScript's number type can represent factorials up to 170! ≈ 7.26 × 10³⁰⁶. 171! overflows to Infinity. For arbitrary-precision factorials, use a BigInt library outside this calculator.",
        },
        {
          question: "Can I store intermediate results?",
          answer:
            "Yes — the M+, M−, MR, MC memory buttons store and recall a single value. The history panel additionally keeps a record of every completed expression; click any entry to load it back into the editor.",
        },
        {
          question: "How precise are trigonometric values?",
          answer:
            "About 15 significant decimal digits, the IEEE-754 double-precision limit. Values such as sin(180°) round to a tiny non-zero number rather than exactly zero — this is normal floating-point behaviour and visible only in very small magnitudes.",
        },
      ],
      related: ["normal", "salary", "zakat"],
      lastReviewed: "2026-01-01",
    },
    
    ms: {
      intro:
        "Kalkulator saintifik dengan trigonometri, logaritma, eksponen, faktorial, dan konstanta matematik.",
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

  housing: {
    en: {
      intro:
        "Estimate the monthly repayment on a Malaysian home loan and, just as importantly, the cash you need upfront — down payment, stamp duty on the Memorandum of Transfer (MOT), stamp duty on the loan agreement, legal fees, valuation, and MRTA. The calculator uses the 2026 ad-valorem stamp duty tiers and the standard legal-fee scale, and lets you model a developer rebate and absorbed fees.",
      howItWorks: {
        heading: "How the housing loan calculator works",
        paragraphs: [
          "The monthly installment is computed with the standard amortization formula using your loan amount (price minus down payment), the annual interest rate, and the tenure in months.",
          "MOT stamp duty is charged on the property price in tiers: 1% on the first RM100,000, 2% from RM100,001–500,000, 3% from RM500,001–1,000,000, and 4% above RM1,000,000.",
          "Loan agreement stamp duty is a flat 0.5% of the loan amount. Legal fees follow the Solicitors' Remuneration Order scale and are charged on both the Sale & Purchase Agreement and the loan agreement.",
          "Malaysian citizens buying their first home at RM500,000 or below qualify for full stamp duty exemption on both the MOT and the loan agreement. Budget 2026 extended this to 31 December 2027. Permanent residents pay the normal tiers but do not qualify for the exemption, and from 1 January 2026 non-citizens and foreign companies pay a flat 8% on the transfer instead of the tiers.",
          "On a new launch the developer often absorbs the legal fees and the MOT stamp duty, and quotes a rebate off the price. Switch those on to see your net cash required — with a large enough rebate it can fall to zero, which is what a \"zero down payment\" package really means. The rebate offsets your cash only: the bank still finances against the full price, and duty and legal fees are still assessed on it.",
          "An MRTA or MLTA premium can be paid upfront or rolled into the loan. Financing it raises the amount borrowed and therefore the monthly instalment. Any extra monthly payment goes straight to principal, which is why even a small amount shortens a 35-year loan by years.",
        ],
      },
      formula: {
        heading: "Monthly installment formula",
        paragraphs: [
          "M = P · r · (1 + r)^n / ((1 + r)^n − 1)",
          "P = loan amount, r = monthly interest rate (annual rate ÷ 12 ÷ 100), n = number of months (years × 12).",
        ],
      },
      rateTable: {
        heading: "MOT stamp duty tiers (2026)",
        columns: ["Property price band", "Rate"],
        rows: [
          ["First RM100,000", "1%"],
          ["RM100,001 – RM500,000", "2%"],
          ["RM500,001 – RM1,000,000", "3%"],
          ["Above RM1,000,000", "4%"],
        ],
        note: "Loan agreement stamp duty is a separate flat 0.5% of the loan amount. Non-citizens and foreign companies pay a flat 8% on the transfer instead of these tiers.",
      },
      examples: [
        {
          title: "RM500,000 home, 10% down, 35 years at 4%",
          given: ["Loan amount: RM450,000", "Down payment: RM50,000", "Interest rate: 4% p.a."],
          result: "≈ RM1,993/month, with roughly RM76,000 needed upfront (down payment + stamp duty + legal fees + valuation + disbursements) for a Malaysian citizen who is not a first-home buyer.",
        },
      ],
      faq: [
        {
          question: "How much down payment do I need for a house in Malaysia?",
          answer: "Most banks finance up to 90% of the property value for your first two homes, so you typically need a 10% down payment plus the stamp duty and legal fees on top.",
        },
        {
          question: "Is stamp duty really waived for first-home buyers?",
          answer: "Yes — for eligible Malaysian citizens buying their first home, properties priced at RM500,000 or below receive full stamp duty exemption on both the transfer (MOT) and the loan agreement, worth about RM11,250 on a RM500,000 home. Budget 2026 extended it to 31 December 2027. Above RM500,000 there is no relief: the 75% remission that once applied to the RM500,001–RM1,000,000 band lapsed at the end of 2023.",
        },
        {
          question: "Does this include MRTA or fire insurance?",
          answer: "MRTA is included if you enter a premium — you can pay it upfront or finance it into the loan. Home and fire insurance are quoted separately by your insurer and are not included, so budget for those on top.",
        },
      ],
      related: ["salary", "tax", "epf"],
      lastReviewed: "2026-06-15",
    },
    ms: {
      intro:
        "Anggarkan ansuran bulanan pinjaman rumah di Malaysia dan, yang sama penting, tunai pendahuluan yang diperlukan — bayaran pendahuluan, duti setem Memorandum Pindah Milik (MOT), duti setem perjanjian pinjaman, yuran guaman, penilaian, dan MRTA. Kalkulator ini menggunakan kadar duti setem 2026 dan skala yuran guaman standard, serta membolehkan anda memodelkan rebat pemaju dan yuran yang ditanggung pemaju.",
      howItWorks: {
        heading: "Cara kalkulator pinjaman perumahan berfungsi",
        paragraphs: [
          "Ansuran bulanan dikira dengan formula amortisasi standard menggunakan jumlah pinjaman (harga tolak bayaran pendahuluan), kadar faedah tahunan, dan tempoh dalam bulan.",
          "Duti setem MOT dikenakan secara berperingkat: 1% bagi RM100,000 pertama, 2% (RM100,001–500,000), 3% (RM500,001–1,000,000), dan 4% melebihi RM1,000,000.",
          "Duti setem perjanjian pinjaman ialah 0.5% rata daripada jumlah pinjaman. Pembeli rumah pertama bagi hartanah RM500,000 ke bawah layak mendapat pengecualian penuh.",
        ],
      },
      faq: [
        {
          question: "Berapa bayaran pendahuluan diperlukan untuk rumah di Malaysia?",
          answer: "Kebanyakan bank membiayai sehingga 90% nilai hartanah untuk dua rumah pertama, jadi anda biasanya perlu 10% bayaran pendahuluan berserta duti setem dan yuran guaman.",
        },
        {
          question: "Adakah duti setem benar-benar dikecualikan untuk rumah pertama?",
          answer: "Ya — bagi pembeli rumah pertama yang layak, hartanah RM500,000 ke bawah mendapat pengecualian penuh duti setem MOT dan perjanjian pinjaman. Sahkan terma tahun semasa dengan peguam anda.",
        },
      ],
      related: ["salary", "tax", "epf"],
      lastReviewed: "2026-06-15",
    },
    id: {
      intro:
        "Perkirakan cicilan bulanan pinjaman rumah di Malaysia dan, yang sama pentingnya, uang muka yang dibutuhkan — uang muka, bea meterai Memorandum Pengalihan (MOT), bea meterai perjanjian pinjaman, biaya hukum, penilaian, dan MRTA. Kalkulator ini menggunakan tarif bea meterai 2026 dan skala biaya hukum standar, serta memungkinkan Anda memodelkan rabat pengembang dan biaya yang ditanggung pengembang.",
      howItWorks: {
        heading: "Cara kalkulator pinjaman rumah bekerja",
        paragraphs: [
          "Cicilan bulanan dihitung dengan rumus amortisasi standar menggunakan jumlah pinjaman (harga dikurangi uang muka), suku bunga tahunan, dan tenor dalam bulan.",
          "Bea meterai MOT dikenakan bertingkat: 1% untuk RM100.000 pertama, 2% (RM100.001–500.000), 3% (RM500.001–1.000.000), dan 4% di atas RM1.000.000.",
          "Bea meterai perjanjian pinjaman adalah 0,5% rata dari jumlah pinjaman. Pembeli rumah pertama dengan properti RM500.000 ke bawah mendapat pembebasan penuh.",
        ],
      },
      faq: [
        {
          question: "Berapa uang muka untuk rumah di Malaysia?",
          answer: "Kebanyakan bank membiayai hingga 90% nilai properti untuk dua rumah pertama, jadi Anda biasanya butuh 10% uang muka plus bea meterai dan biaya hukum.",
        },
      ],
      related: ["salary", "tax", "epf"],
      lastReviewed: "2026-06-15",
    },
  },

  tax: {
    en: {
      intro:
        "Estimate your Malaysian personal income tax for Year of Assessment 2026. Enter your annual income and the reliefs you can claim — EPF, life insurance, medical, parents' medical, SSPN, PRS, SOCSO/EIS, lifestyle, sports, childcare, and child and spouse relief — plus any zakat paid, and the calculator returns your chargeable income, tax before and after rebates, total tax payable, effective rate, and an approximate monthly PCB.",
      howItWorks: {
        heading: "How the income tax calculator works",
        paragraphs: [
          "A personal relief of RM9,000 is applied automatically, then your other reliefs are added — each capped at its own statutory limit, independently of the others — and subtracted from your annual income to give chargeable income.",
          "Child relief is tiered rather than flat: RM2,000 for a child under 18, RM8,000 for a child aged 18 and over in tertiary education at diploma level or above, RM6,000 for a disabled child, and RM14,000 for a disabled child in higher education.",
          "Zakat is a rebate, not a relief. That makes it far more valuable than a relief of the same size: RM1 of relief only saves you your marginal rate, while RM1 of zakat cancels RM1 of tax outright. It cannot create a refund, so it is capped at the tax still standing.",
          "Tax is computed on chargeable income using the resident progressive bands for YA 2026. A rebate of RM400 applies when chargeable income is RM35,000 or less, with an extra RM400 if spouse relief is claimed.",
          "The effective rate is total tax payable divided by your annual income, and the monthly PCB is the annual tax spread across 12 months.",
        ],
      },
      rateTable: {
        heading: "Resident tax bands (YA 2026)",
        columns: ["Chargeable income (RM)", "Rate on band"],
        rows: [
          ["0 – 5,000", "0%"],
          ["5,001 – 20,000", "1%"],
          ["20,001 – 35,000", "3%"],
          ["35,001 – 50,000", "6%"],
          ["50,001 – 70,000", "11%"],
          ["70,001 – 100,000", "19%"],
          ["100,001 – 400,000", "25%"],
          ["400,001 – 600,000", "26%"],
          ["600,001 – 2,000,000", "28%"],
          ["Above 2,000,000", "30%"],
        ],
        note: "Tax is progressive — each rate applies only to income within that band.",
      },
      examples: [
        {
          title: "RM72,000 income with RM15,500 of reliefs",
          given: [
            "Annual income: RM72,000",
            "Reliefs: RM9,000 personal + RM4,000 EPF + RM2,500 lifestyle",
            "No spouse or child relief",
          ],
          result: "Chargeable income RM56,500 → tax of RM2,215 for the year (≈ RM185/month), an effective rate of about 3.08%.",
        },
      ],
      faq: [
        {
          question: "Who needs to file income tax in Malaysia?",
          answer: "Generally, residents earning more than RM34,000 a year after EPF deduction must register and file with LHDN. Filing for YA 2026 is typically done in early 2027.",
        },
        {
          question: "Is this the same as PCB / MTD?",
          answer: "PCB (Potongan Cukai Berjadual / Monthly Tax Deduction) is the monthly withholding by your employer. The monthly figure here is an annual-tax-over-12 estimate, which is close but not identical to the official PCB schedule.",
        },
        {
          question: "Which reliefs are capped?",
          answer: "Every relief has its own independent cap, and they do not pool. EPF is capped at RM4,000 and life insurance/takaful separately at RM3,000 — these are often quoted together as \"RM7,000\", but unused life insurance headroom cannot absorb EPF beyond RM4,000. Lifestyle is RM2,500 with a separate RM1,000 for sports, medical RM10,000, SSPN RM8,000, PRS RM3,000, and SOCSO/EIS RM350. The calculator applies each cap for you and shows which ones you have maxed out.",
        },
      ],
      related: ["salary", "epf", "housing"],
      lastReviewed: "2026-06-15",
    },
    ms: {
      intro:
        "Anggarkan cukai pendapatan peribadi Malaysia anda untuk Tahun Taksiran 2026. Masukkan pendapatan tahunan dan pelepasan yang boleh dituntut — KWSP, insurans hayat, perubatan, perubatan ibu bapa, SSPN, PRS, PERKESO/SIP, gaya hidup, sukan, taska, serta pelepasan anak dan pasangan — dan zakat yang dibayar, dan kalkulator memaparkan pendapatan bercukai, cukai sebelum dan selepas rebat, jumlah cukai kena dibayar, kadar berkesan, dan anggaran PCB bulanan.",
      howItWorks: {
        heading: "Cara kalkulator cukai pendapatan berfungsi",
        paragraphs: [
          "Pelepasan diri RM9,000 dikira secara automatik, kemudian pelepasan lain ditambah (setiap satu dihadkan) dan ditolak daripada pendapatan tahunan untuk mendapat pendapatan bercukai.",
          "Cukai dikira atas pendapatan bercukai menggunakan kadar berperingkat pemastautin TT 2026. Rebat RM400 dikenakan apabila pendapatan bercukai RM35,000 atau kurang.",
        ],
      },
      faq: [
        {
          question: "Siapa perlu memfailkan cukai pendapatan di Malaysia?",
          answer: "Secara amnya, pemastautin yang berpendapatan lebih RM34,000 setahun selepas potongan EPF perlu mendaftar dan memfailkan dengan LHDN.",
        },
      ],
      related: ["salary", "epf", "housing"],
      lastReviewed: "2026-06-15",
    },
    id: {
      intro:
        "Perkirakan pajak penghasilan pribadi Malaysia Anda untuk Tahun Penilaian 2026. Masukkan penghasilan tahunan dan keringanan yang dapat diklaim — EPF, asuransi jiwa, medis, medis orang tua, SSPN, PRS, SOCSO/EIS, gaya hidup, olahraga, penitipan anak, serta keringanan anak dan pasangan — dan zakat yang dibayar, dan kalkulator menampilkan penghasilan kena pajak, pajak sebelum dan sesudah rebat, total pajak terutang, tarif efektif, dan perkiraan PCB bulanan.",
      howItWorks: {
        heading: "Cara kalkulator pajak penghasilan bekerja",
        paragraphs: [
          "Keringanan pribadi RM9.000 diterapkan otomatis, lalu keringanan lain ditambahkan (masing-masing dibatasi) dan dikurangkan dari penghasilan tahunan untuk mendapat penghasilan kena pajak.",
          "Pajak dihitung atas penghasilan kena pajak memakai tarif progresif penduduk TP 2026. Rebat RM400 berlaku jika penghasilan kena pajak RM35.000 atau kurang.",
        ],
      },
      faq: [
        {
          question: "Siapa yang wajib lapor pajak di Malaysia?",
          answer: "Umumnya, penduduk dengan penghasilan lebih dari RM34.000 per tahun setelah potongan EPF wajib mendaftar dan melapor ke LHDN.",
        },
      ],
      related: ["salary", "epf", "housing"],
      lastReviewed: "2026-06-15",
    },
  },

  bmi: {
    en: {
      intro:
        "Calculate your Body Mass Index (BMI) and see which category you fall into under Malaysia's national clinical guideline, the healthy weight range for your height, your Basal Metabolic Rate (BMR), and the daily calories you need to maintain your weight (TDEE). Malaysia uses lower BMI thresholds than the international chart, so the answer here may differ from other calculators.",
      howItWorks: {
        heading: "How the BMI calculator works",
        paragraphs: [
          "BMI is your weight in kilograms divided by your height in metres squared. Malaysia's Clinical Practice Guidelines for the Management of Obesity (2nd edition, 2023), issued by the Ministry of Health with the Malaysian Endocrine and Metabolic Society, set pre-obesity at a BMI of 23 and obesity above 27.5.",
          "Those thresholds are lower than the international 25 and 30 because the international chart was drawn from a Caucasian reference population. Asians — including Malaysia's Malay, Chinese and Indian populations — carry more body fat at the same BMI and develop diabetes and cardiovascular disease at lower values, so the risk begins earlier. The calculator applies the Malaysian figures and tells you when the international chart would have said something different.",
          "BMR is estimated with the Mifflin-St Jeor equation, which uses your weight, height, age, and sex. TDEE then multiplies BMR by an activity factor from 1.2 (sedentary) to 1.9 (very active).",
          "The healthy weight range is the weight that would put your BMI between 18.5 and 23 at your current height — the upper bound is the Malaysian pre-obesity cut-off, not the international one.",
          "BMI categories apply to adults only. For anyone under 18 the guideline directs that the WHO BMI-for-age chart be used instead, because a healthy BMI changes with a child's age and sex. The calculator shows the BMI figure for a child but withholds the category rather than applying an adult threshold that does not fit.",
        ],
      },
      formula: {
        heading: "Formulas used",
        paragraphs: [
          "BMI = weight(kg) ÷ height(m)²",
          "BMR (male) = 10·kg + 6.25·cm − 5·age + 5",
          "BMR (female) = 10·kg + 6.25·cm − 5·age − 161",
          "TDEE = BMR × activity factor",
        ],
      },
      rateTable: {
        heading: "BMI categories for Malaysian adults (MOH CPG 2023)",
        caption:
          "Applies to adults aged 18 and over. Under-18s should be assessed with the WHO BMI-for-age chart.",
        columns: ["BMI", "Category", "International chart would say"],
        rows: [
          ["Below 18.5", "Underweight", "Underweight"],
          ["18.5 – 22.9", "Normal weight", "Normal weight"],
          ["23.0 – 27.5", "Pre-obese (overweight)", "Normal up to 25, then overweight"],
          ["Above 27.5", "Obese", "Overweight until 30, then obese"],
        ],
      },
      faq: [
        {
          question: "Is BMI accurate for everyone?",
          answer: "BMI is a quick screening tool, not a diagnosis. It does not distinguish muscle from fat, so very muscular people may read as overweight. It is also less precise across some ethnic groups — use it as a guide alongside other measures.",
        },
        {
          question: "What is the difference between BMR and TDEE?",
          answer: "BMR is the energy your body burns at complete rest. TDEE adds the calories you burn through daily activity and exercise — it is the number to aim for if you want to maintain your current weight.",
        },
        {
          question: "How do I lose or gain weight from my TDEE?",
          answer: "Eating roughly 300–500 kcal below your TDEE supports gradual weight loss; eating above it supports weight gain. Sustainable changes beat extreme deficits.",
        },
      ],
      related: ["salary", "normal", "epf"],
      lastReviewed: "2026-06-15",
    },
    ms: {
      intro:
        "Kira Indeks Jisim Badan (BMI) anda dan lihat kategori WHO yang sepadan, julat berat sihat untuk tinggi anda, Kadar Metabolik Asas (BMR), dan kalori harian yang diperlukan untuk mengekalkan berat anda (TDEE).",
      howItWorks: {
        heading: "Cara kalkulator BMI berfungsi",
        paragraphs: [
          "BMI ialah berat dalam kilogram dibahagi dengan kuasa dua tinggi dalam meter. Garis Panduan Amalan Klinikal Pengurusan Obesiti Malaysia (edisi ke-2, 2023), terbitan Kementerian Kesihatan bersama Persatuan Endokrin dan Metabolik Malaysia, menetapkan pra-obesiti pada BMI 23 dan obesiti melebihi 27.5.",
          "Nilai ini lebih rendah daripada 25 dan 30 antarabangsa kerana carta antarabangsa dibina daripada populasi rujukan Kaukasia. Orang Asia mempunyai lebih lemak badan pada BMI yang sama dan menghidap diabetes serta penyakit kardiovaskular pada nilai lebih rendah. Kalkulator ini menggunakan angka Malaysia dan memberitahu anda apabila carta antarabangsa memberi jawapan berbeza.",
          "BMR dianggar dengan persamaan Mifflin-St Jeor menggunakan berat, tinggi, umur, dan jantina. TDEE mendarabkan BMR dengan faktor aktiviti dari 1.2 hingga 1.9.",
        ],
      },
      rateTable: {
        heading: "Kategori BMI dewasa Malaysia (CPG KKM 2023)",
        columns: ["BMI", "Kategori"],
        rows: [
          ["Bawah 18.5", "Kurang berat"],
          ["18.5 – 22.9", "Berat normal"],
          ["23.0 – 27.5", "Pra-obes (berlebihan berat)"],
          ["Melebihi 27.5", "Obes"],
        ],
      },
      faq: [
        {
          question: "Adakah BMI tepat untuk semua orang?",
          answer: "BMI ialah alat saringan pantas, bukan diagnosis. Ia tidak membezakan otot daripada lemak, jadi orang yang sangat berotot mungkin terbaca berlebihan berat.",
        },
      ],
      related: ["salary", "normal", "epf"],
      lastReviewed: "2026-06-15",
    },
    id: {
      intro:
        "Hitung Indeks Massa Tubuh (BMI) Anda dan lihat kategori WHO yang sesuai, rentang berat sehat untuk tinggi Anda, Laju Metabolisme Basal (BMR), dan kalori harian yang dibutuhkan untuk mempertahankan berat Anda (TDEE).",
      howItWorks: {
        heading: "Cara kalkulator BMI bekerja",
        paragraphs: [
          "BMI adalah berat dalam kilogram dibagi kuadrat tinggi dalam meter. Pedoman Praktik Klinis Penanganan Obesitas Malaysia (edisi ke-2, 2023), terbitan Kementerian Kesehatan bersama Malaysian Endocrine and Metabolic Society, menetapkan pra-obesitas pada BMI 23 dan obesitas di atas 27,5.",
          "Ambang ini lebih rendah dari 25 dan 30 internasional karena bagan internasional disusun dari populasi rujukan Kaukasia. Orang Asia memiliki lebih banyak lemak tubuh pada BMI yang sama dan mengalami diabetes serta penyakit kardiovaskular pada nilai lebih rendah. Kalkulator ini memakai angka Malaysia dan memberi tahu Anda bila bagan internasional memberi jawaban berbeda.",
          "BMR diperkirakan dengan persamaan Mifflin-St Jeor menggunakan berat, tinggi, usia, dan jenis kelamin. TDEE mengalikan BMR dengan faktor aktivitas dari 1.2 hingga 1.9.",
        ],
      },
      rateTable: {
        heading: "Kategori BMI dewasa Malaysia (CPG KKM 2023)",
        columns: ["BMI", "Kategori"],
        rows: [
          ["Di bawah 18.5", "Berat kurang"],
          ["18.5 – 22.9", "Berat normal"],
          ["23,0 – 27,5", "Pra-obesitas (kelebihan berat)"],
          ["Di atas 27,5", "Obesitas"],
        ],
      },
      faq: [
        {
          question: "Apakah BMI akurat untuk semua orang?",
          answer: "BMI adalah alat skrining cepat, bukan diagnosis. Ia tidak membedakan otot dari lemak, jadi orang yang sangat berotot bisa terbaca kelebihan berat.",
        },
      ],
      related: ["salary", "normal", "epf"],
      lastReviewed: "2026-06-15",
    },
  },
};

export function getCalculatorContent(
  slug: RouteSlug,
  locale: Locale,
): CalculatorContent | undefined {
  return calculatorContent[slug]?.[locale];
}
