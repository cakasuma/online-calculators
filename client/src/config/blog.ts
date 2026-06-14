export interface BlogSection {
  heading?: string;
  body?: string[];
  list?: { text: string; subtext?: string }[];
  table?: { headers: string[]; rows: string[][] };
  callout?: string;
}

export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  keywords: string;
  publishedDate: string;
  readingTime: number;
  categoryLabel: string;
  relatedCalculator?: { href: string; label: string };
  intro: string;
  sections: BlogSection[];
}

export const blogArticles: BlogArticle[] = [
  {
    slug: "malaysia-salary-deductions-explained",
    title: "Malaysian Salary Deductions Explained: EPF, SOCSO, EIS & PCB (2026)",
    description:
      "Understand every deduction on your Malaysian payslip — EPF, SOCSO, EIS, and PCB. Includes 2026 contribution rates, employer vs employee shares, and a worked example.",
    keywords:
      "malaysia salary deductions, EPF contribution rate, SOCSO rate, EIS deduction, PCB calculator, take home pay malaysia",
    publishedDate: "2026-01-15",
    readingTime: 8,
    categoryLabel: "Salary & Tax",
    relatedCalculator: { href: "/salary", label: "Try the Salary Calculator" },
    intro:
      "When you receive your first Malaysian payslip, the gap between your gross salary and take-home pay can be surprising. Four statutory deductions — EPF, SOCSO, EIS, and PCB — can collectively reduce your gross pay by 15 to 25 percent. This guide explains exactly what each deduction is, how the rates are calculated, what you receive in return, and how to verify your own payslip.",
    sections: [
      {
        heading: "Why Your Gross and Net Salary Differ",
        body: [
          "Malaysian law requires employers to deduct certain contributions from your salary before paying you. These are not punitive taxes — they are partly contributions to your own savings and insurance funds, and partly income tax prepayments.",
          "The four main deductions are: EPF (Employees Provident Fund), SOCSO (Social Security Organisation), EIS (Employment Insurance System), and PCB (Potongan Cukai Berjadual, the monthly tax deduction). On top of employee deductions, your employer also pays its own contributions into EPF and SOCSO on your behalf.",
        ],
      },
      {
        heading: "EPF — Your Retirement Savings",
        body: [
          "EPF (or KWSP — Kumpulan Wang Simpanan Pekerja) is Malaysia's mandatory retirement savings fund. Both you and your employer contribute a percentage of your monthly salary.",
          "Employee contribution rate: 11% of monthly wages (or 9% for employees aged 60 and above). Employer contribution rate: 13% if your monthly wage is RM5,000 or below; 12% if above RM5,000.",
          "On a RM5,000 salary, you contribute RM550 (11%) and your employer contributes RM650 (13%), totalling RM1,200 per month going into your EPF account. This money is yours — it accumulates interest and is returned at retirement.",
        ],
        table: {
          headers: ["Employee Age", "Employee Rate", "Employer Rate (≤RM5,000)", "Employer Rate (>RM5,000)"],
          rows: [
            ["Below 60", "11%", "13%", "12%"],
            ["60 and above", "0% (optional)", "4%", "4%"],
          ],
        },
        callout:
          "EPF contributions qualify for personal income tax relief of up to RM4,000 per year (combined with life insurance premiums).",
      },
      {
        heading: "SOCSO — Work Injury and Invalidity Protection",
        body: [
          "SOCSO (PERKESO) provides insurance for workplace injuries, occupational diseases, and permanent invalidity. It operates two schemes: the Employment Injury Scheme and the Invalidity Scheme.",
          "Contribution rates are based on your monthly wages but capped at a wage ceiling of RM4,000 per month. If you earn more than RM4,000, contributions are still calculated as if your wage were RM4,000.",
        ],
        table: {
          headers: ["Monthly Wage", "Employee (0.5%)", "Employer (1.75%)", "Total"],
          rows: [
            ["RM2,000", "RM10.00", "RM35.00", "RM45.00"],
            ["RM3,000", "RM15.00", "RM52.50", "RM67.50"],
            ["RM4,000 (cap)", "RM20.00", "RM70.00", "RM90.00"],
            ["RM5,000+ (same as cap)", "RM20.00", "RM70.00", "RM90.00"],
          ],
        },
      },
      {
        heading: "EIS — Protection If You Lose Your Job",
        body: [
          "EIS (Employment Insurance System), managed by SOCSO/PERKESO, was introduced in January 2018 to protect employees who are retrenched or made redundant.",
          "The EIS contribution rate is 0.2% from the employee and 0.2% from the employer — a combined 0.4% of monthly wages, capped at RM5,000/month. On a RM5,000 salary, you pay RM10.00 and your employer pays RM10.00.",
          "If you are retrenched, EIS provides a Job Search Allowance (up to 80% of your previous wage for the first month, reducing over subsequent months), career counselling, job matching, and upskilling programmes.",
        ],
      },
      {
        heading: "PCB — Your Monthly Income Tax Prepayment",
        body: [
          "PCB (Potongan Cukai Berjadual) is the monthly tax deduction. Your employer estimates and deducts income tax from your salary each month based on your projected annual income.",
          "PCB is not a separate tax — it is a prepayment of your annual income tax. When you file your tax return with LHDN every April, any overpayment is refunded and any shortfall must be paid.",
          "Your PCB amount depends on your annual income, declared tax reliefs, and whether you are a tax resident. Non-residents pay a flat rate of 28% on employment income with no access to personal reliefs.",
        ],
      },
      {
        heading: "Worked Example: RM5,000 Gross Salary",
        body: [
          "Here is how all deductions combine for a Malaysian resident employee earning RM5,000 gross per month, under age 60.",
        ],
        table: {
          headers: ["Deduction", "Amount", "Note"],
          rows: [
            ["EPF (Employee 11%)", "RM550.00", "Goes to your EPF account"],
            ["SOCSO (Employee 0.5%)", "RM20.00", "Capped at RM4,000 wage"],
            ["EIS (Employee 0.2%)", "RM10.00", "Capped at RM5,000 wage"],
            ["PCB (single, no additional reliefs)", "~RM113.00", "Varies with declared reliefs"],
            ["Total Deductions", "~RM693.00", ""],
            ["Take-Home Pay", "~RM4,307.00", "Before any additional reliefs"],
          ],
        },
        callout:
          "Your employer additionally contributes RM600 (EPF 12%) + RM87.50 (SOCSO 1.75%) + RM10 (EIS 0.2%) = RM697.50 at no cost to you — making your true total compensation package RM5,697.50.",
      },
      {
        heading: "How to Verify Your Payslip",
        body: [
          "Check your EPF contributions anytime via KWSP i-Akaun (kwsp.gov.my) or the i-Akaun mobile app. Your statement shows contributions from both you and your employer.",
          "For SOCSO and EIS, use the MySocso app or website (perkeso.gov.my) to view your contribution history and coverage status.",
          "Your EA Form — issued by your employer each February — summarises your annual gross income and total PCB deducted. Review it carefully before filing your tax return.",
        ],
      },
    ],
  },

  {
    slug: "how-epf-kwsp-works",
    title: "How EPF (KWSP) Works in Malaysia: Contributions, Accounts & Withdrawals (2026)",
    description:
      "A complete guide to Malaysia's EPF — contribution rates, the three-account structure (Persaraan, Sejahtera, Fleksibel), annual dividends, the basic savings target, and withdrawal rules.",
    keywords:
      "how EPF works malaysia, KWSP contribution rates, EPF account 1 2 3, EPF withdrawal rules, KWSP dividend 2026, EPF basic savings",
    publishedDate: "2026-01-20",
    readingTime: 9,
    categoryLabel: "EPF & Retirement",
    relatedCalculator: { href: "/epf-retirement", label: "Try the EPF Retirement Calculator" },
    intro:
      "EPF (Employees Provident Fund) — KWSP (Kumpulan Wang Simpanan Pekerja) in Malay — is Malaysia's mandatory retirement savings scheme. Founded in 1951, it has grown into one of the world's largest pension funds, managing over RM1 trillion in assets for more than 15 million contributors. Yet many contributors don't fully understand how their money is structured, how it grows, or when they can access it. This guide explains everything.",
    sections: [
      {
        heading: "Who Must Contribute to EPF?",
        body: [
          "All Malaysian citizens and permanent residents working in the private sector under a contract of service or apprenticeship must contribute to EPF. Government servants are covered under a separate pension scheme (KWAP).",
          "Foreign workers and expatriates are not mandatorily required to contribute, but may opt in voluntarily. Since July 2019, foreigners can choose to contribute and receive the same EPF protections as local employees.",
          "Self-employed individuals, gig workers, and freelancers are not automatically enrolled, but can join voluntarily through the i-Saraan scheme. The government provides an annual incentive of RM300 for active i-Saraan contributors earning below RM6,000/month and below age 55.",
        ],
      },
      {
        heading: "Contribution Rates (2026)",
        body: [
          "EPF contributions are calculated as a percentage of monthly wages, which includes basic salary, fixed allowances, and overtime, but excludes certain items such as reimbursements and annual bonus (if paid separately).",
        ],
        table: {
          headers: ["Employee Age", "Employee Share", "Employer Share (wage ≤RM5,000)", "Employer Share (wage >RM5,000)"],
          rows: [
            ["Below 60", "11%", "13%", "12%"],
            ["60 and above", "0% (optional)", "4%", "4%"],
          ],
        },
        callout:
          "At age 60 and above, employees are not required to contribute their own share, though they may choose to continue. Employer contributions continue at 4%.",
      },
      {
        heading: "The Three EPF Accounts",
        body: [
          "Since May 2024, EPF restructured contributions into three accounts, giving members more flexibility while protecting retirement savings.",
        ],
        list: [
          {
            text: "Akaun Persaraan (Account 1) — 75% of contributions",
            subtext:
              "Your core retirement fund. No withdrawals until age 55 or 60, except for permanent departure from Malaysia, incapacitation, or death. This account cannot be used for housing, education, or other pre-retirement purposes.",
          },
          {
            text: "Akaun Sejahtera (Account 2) — 15% of contributions",
            subtext:
              "Permits withdrawals before retirement for: housing (down payment or loan repayment), higher education (yourself or children), medical treatment, and an optional 30% withdrawal at age 50 above the basic savings threshold.",
          },
          {
            text: "Akaun Fleksibel (Account 3) — 10% of contributions",
            subtext:
              "Introduced in 2024. Allows withdrawal at any time, minimum RM50 per request. Acts as an accessible emergency buffer within the EPF system.",
          },
        ],
      },
      {
        heading: "EPF Dividends: How Your Money Grows",
        body: [
          "EPF invests contributions in a diversified global portfolio of equities, bonds, real estate, and infrastructure. Each year, EPF declares an annual dividend based on investment returns.",
          "Historical EPF dividends have averaged 5.5%–6.5% per year over the past decade. These dividends are credited to your account and compound year after year.",
        ],
        table: {
          headers: ["Year", "Conventional Dividend", "Shariah Dividend"],
          rows: [
            ["2020", "5.20%", "4.90%"],
            ["2021", "6.10%", "5.65%"],
            ["2022", "5.35%", "4.75%"],
            ["2023", "5.50%", "5.40%"],
            ["2024", "6.40%", "6.25%"],
            ["2025", "6.30%", "5.80%"],
          ],
        },
        callout:
          "At 6% annual dividend, RM100,000 in EPF doubles in approximately 12 years — without any additional contributions.",
      },
      {
        heading: "Basic Savings Target",
        body: [
          "EPF sets a Basic Savings benchmark — the minimum balance EPF considers necessary for a basic retirement income.",
        ],
        table: {
          headers: ["Retirement Age", "Basic Savings Target (2026)", "Implied Monthly Income"],
          rows: [
            ["55", "RM270,000", "~RM900/month for 25 years"],
            ["60", "RM390,000", "~RM1,300/month for 25 years"],
          ],
        },
        body: [
          "These targets represent a minimum, not a comfortable retirement. Financial planners typically recommend accumulating 2–3× the basic savings target to maintain your working-life lifestyle in retirement.",
          "Less than 30% of active EPF contributors aged 54 meet the RM270,000 benchmark. If you are below target for your age, making voluntary contributions now significantly improves your retirement outlook.",
        ],
      },
      {
        heading: "Withdrawal Rules",
        list: [
          { text: "Account 3: Any time", subtext: "Minimum RM50 per withdrawal via i-Akaun. Processing takes 3–5 business days." },
          { text: "Account 2 at age 50: 30% above basic savings", subtext: "You may withdraw up to 30% of the amount exceeding the basic savings threshold from Account 2." },
          { text: "Account 1 at age 55: Full withdrawal available", subtext: "You may withdraw your entire Account 1 balance upon reaching 55, or choose to leave it invested and continue earning dividends." },
          { text: "Account 2: Housing, education, medical", subtext: "Approved withdrawals for down payments, mortgage reduction, approved courses, and serious medical expenses." },
          { text: "Upon incapacitation or permanent departure", subtext: "EPF permits full withdrawal for permanent total disablement or permanent departure from Malaysia for non-citizen/PR members." },
        ],
      },
      {
        heading: "Boosting Your EPF with Voluntary Contributions",
        body: [
          "Members can make additional voluntary contributions to their EPF account beyond the statutory rate. These earn the same annual dividend as regular contributions.",
          "Voluntary top-up contributions qualify for personal income tax relief of up to RM4,000/year (combined with life insurance premiums). Contributing an extra RM1,000 to EPF can save RM130–RM240 in income tax depending on your bracket.",
          "You can also top up your spouse's or children's EPF accounts under the separate RM8,000 KWSP/PRS relief.",
        ],
      },
    ],
  },

  {
    slug: "epf-retirement-planning-malaysia",
    title: "EPF Retirement Planning: How Much Do You Really Need to Retire in Malaysia?",
    description:
      "A practical guide to retirement adequacy in Malaysia — the 4% rule, the EPF basic savings benchmark, age-based targets, and strategies to close your savings gap.",
    keywords:
      "EPF retirement planning malaysia, how much EPF to retire, KWSP retirement adequacy, retirement savings malaysia, 4% withdrawal rule",
    publishedDate: "2026-01-25",
    readingTime: 8,
    categoryLabel: "EPF & Retirement",
    relatedCalculator: { href: "/epf-retirement", label: "Try the EPF Retirement Calculator" },
    intro:
      "How much money do you need to retire comfortably in Malaysia? Most people leave this question unanswered until it is almost too late. EPF's basic savings target gives you a floor, but for most workers — especially those in their 30s and 40s today — it represents the bare minimum, not a comfortable retirement. This guide helps you understand the numbers, identify common shortfalls, and take action today.",
    sections: [
      {
        heading: "The Retirement Savings Problem",
        body: [
          "Malaysia's workforce faces a retirement savings crisis. EPF data shows that nearly 70% of active members aged 54 have savings below the RM270,000 basic savings target. Upon retirement at 55, many members exhaust their entire EPF balance within 3–5 years, leaving them financially dependent on family or government assistance in their later years.",
          "The challenge is structural: most employees contribute a combined 23–24% of wages (11% employee + 12–13% employer), which sounds substantial. But low starting wages, career gaps, and Account 2 withdrawals for housing and education significantly erode balances over time.",
        ],
      },
      {
        heading: "EPF's Basic Savings Benchmark",
        table: {
          headers: ["Retirement Age", "Basic Savings Target (2026)", "Implied Monthly Income (25 years)"],
          rows: [
            ["55", "RM270,000", "~RM900/month"],
            ["60", "RM390,000", "~RM1,300/month"],
          ],
        },
        body: [
          "Malaysia's median household expenditure in urban areas is around RM4,500/month. The basic savings target generates income well below this — enough for basic subsistence, not a comfortable urban retirement.",
        ],
        callout: "Basic Savings is a floor, not a goal. Maintaining your working-life lifestyle in retirement typically requires 2–3× the basic savings target.",
      },
      {
        heading: "The 4% Rule: A Framework for Retirement Adequacy",
        body: [
          "The 4% rule suggests that withdrawing 4% of your portfolio annually provides a high probability of your money lasting 30 years. EPF's historical dividend of 5.5–6.5% per year exceeds the 4% withdrawal rate, meaning your principal continues to grow slightly in retirement — making the rule broadly applicable to EPF savings.",
          "Under the 4% rule, here is how much you need for different monthly income targets:",
        ],
        table: {
          headers: ["Target Monthly Income", "Required Total Savings (25× annual)"],
          rows: [
            ["RM1,500/month", "RM450,000"],
            ["RM2,000/month", "RM600,000"],
            ["RM3,000/month", "RM900,000"],
            ["RM5,000/month", "RM1,500,000"],
          ],
        },
      },
      {
        heading: "Age-Based Savings Benchmarks",
        body: [
          "Compare your current Account 1 balance against these age-based checkpoints to see whether you are on track:",
        ],
        table: {
          headers: ["Your Age", "Basic Savings Benchmark"],
          rows: [
            ["25", "RM10,000"],
            ["30", "RM30,000"],
            ["35", "RM60,000"],
            ["40", "RM100,000"],
            ["45", "RM150,000"],
            ["50", "RM210,000"],
            ["55", "RM270,000"],
            ["60", "RM390,000"],
          ],
        },
        body: [
          "If your Account 1 balance is below the benchmark for your age, you are at risk of retiring with insufficient savings. The gap is not insurmountable, but it requires deliberate action now.",
        ],
      },
      {
        heading: "Strategies to Close the Gap",
        list: [
          {
            text: "Make voluntary EPF top-up contributions",
            subtext:
              "Every additional RM1,000 contributed at age 35, growing at 6% annually, becomes RM5,743 by age 60. Contributions also earn tax relief of up to RM4,000/year.",
          },
          {
            text: "Limit Account 2 withdrawals",
            subtext:
              "Account 2 withdrawals for housing permanently reduce your long-term balance. Explore other options before using EPF for property purchases.",
          },
          {
            text: "Invest outside EPF",
            subtext:
              "The Private Retirement Scheme (PRS), unit trusts, REITs, and ETFs complement your EPF savings. PRS contributions attract a separate RM3,000 annual tax relief.",
          },
          {
            text: "Delay retirement by 5 years",
            subtext:
              "Working until 60 instead of 55 adds 5 more years of contributions, 5 more years of compound growth, and 5 fewer years of drawdown — dramatically improving retirement outcomes.",
          },
          {
            text: "Pay off the mortgage before retirement",
            subtext:
              "A paid-off home reduces your required monthly retirement income by RM1,000–RM2,500/month, lowering the total savings you need.",
          },
        ],
      },
      {
        heading: "Self-Employed and Gig Workers",
        body: [
          "If you are self-employed, a freelancer, or a gig worker, there is no employer matching your contributions. You can join EPF's voluntary i-Saraan scheme and contribute any amount (minimum RM50) at any time. i-Saraan contributions earn the same annual dividend as regular EPF savings.",
          "The government contributes RM300 per year as an incentive for active i-Saraan contributors earning below RM6,000/month who are below age 55.",
          "Without an employer match, your retirement planning burden is entirely self-driven. Starting as early as possible and contributing consistently are non-negotiable for gig workers.",
        ],
      },
      {
        heading: "EPF Should Be One Pillar Among Several",
        list: [
          { text: "Private Retirement Scheme (PRS)", subtext: "Regulated by the Securities Commission, offering diversified fund choices and a separate RM3,000 annual tax relief." },
          { text: "Amanah Saham Bumiputera / ASN", subtext: "Competitive dividend returns (3–6%) with lower volatility. Open to eligible Bumiputera Malaysians." },
          { text: "Unit trusts and ETFs", subtext: "Broader market exposure through equity and bond funds via licensed fund managers." },
          { text: "Property rental income", subtext: "Monthly rental can supplement retirement cash flow, though it requires significant capital and active management." },
        ],
      },
    ],
  },

  {
    slug: "malaysia-income-tax-pcb-guide",
    title: "Malaysia Income Tax 2026: Tax Brackets, PCB Deductions & Available Reliefs",
    description:
      "Complete guide to Malaysia's personal income tax — 2026 progressive tax brackets, how PCB (monthly tax deduction) is calculated, all tax reliefs, and how to file your return.",
    keywords:
      "malaysia income tax 2026, PCB deduction malaysia, tax brackets malaysia, personal tax relief malaysia, LHDN income tax, chargeable income",
    publishedDate: "2026-02-01",
    readingTime: 10,
    categoryLabel: "Salary & Tax",
    relatedCalculator: { href: "/salary", label: "Try the Salary Calculator" },
    intro:
      "Malaysia uses a progressive income tax system — the higher your income, the higher your tax rate on each additional ringgit earned. For most employees, income tax is collected monthly through PCB (Potongan Cukai Berjadual), where your employer deducts an estimated tax amount and remits it to LHDN. Understanding how your tax is calculated, which reliefs you can legally claim, and how PCB reconciles with your annual return is essential knowledge for every working Malaysian.",
    sections: [
      {
        heading: "What is PCB?",
        body: [
          "PCB stands for Potongan Cukai Berjadual — 'Scheduled Tax Deduction'. It is Malaysia's monthly income tax withholding system. Your employer deducts an estimated amount each month and sends it directly to LHDN (Lembaga Hasil Dalam Negeri — Inland Revenue Board).",
          "PCB is not a final tax — it is a prepayment. When you file your annual e-Filing return by April 30, LHDN reconciles your actual tax liability against the total PCB already deducted. You receive a refund if you overpaid, or pay the shortfall if you underpaid (common with bonuses).",
          "Employees can reduce their monthly PCB by declaring reliefs to their employer using Form CP21A at the start of each year. Without a declaration, your employer assumes the basic individual relief only.",
        ],
      },
      {
        heading: "Tax Residency: Who Pays Progressive Rates?",
        body: [
          "Tax residents pay progressive income tax rates with access to all personal reliefs. You are a tax resident if you are in Malaysia for at least 182 days in the calendar year.",
          "Non-residents — including Malaysians who have been abroad for more than 183 days, and most short-term expatriates — pay a flat rate of 28% on Malaysian employment income with no access to personal reliefs.",
        ],
      },
      {
        heading: "2026 Income Tax Brackets (Residents)",
        body: ["Tax is calculated on 'chargeable income' — your total income minus all applicable reliefs."],
        table: {
          headers: ["Chargeable Income", "Tax Rate", "Tax on This Tier"],
          rows: [
            ["First RM5,000", "0%", "RM0"],
            ["RM5,001 – RM20,000", "1%", "RM150"],
            ["RM20,001 – RM35,000", "3%", "RM450"],
            ["RM35,001 – RM50,000", "8%", "RM1,200"],
            ["RM50,001 – RM70,000", "13%", "RM2,600"],
            ["RM70,001 – RM100,000", "21%", "RM6,300"],
            ["RM100,001 – RM400,000", "24%", "RM72,000"],
            ["RM400,001 – RM600,000", "25%", "RM50,000"],
            ["RM600,001 – RM2,000,000", "26%", "RM364,000"],
            ["Above RM2,000,000", "30%", "—"],
          ],
        },
        callout:
          "Tax is progressive — only the income in each tier is taxed at that tier's rate. Earning RM70,001 does not mean all your income is taxed at 21%.",
      },
      {
        heading: "Tax Reliefs You Can Claim (2026)",
        body: ["Each ringgit of relief reduces your chargeable income, lowering the tax you owe."],
        table: {
          headers: ["Relief", "Maximum Amount", "Notes"],
          rows: [
            ["Individual self", "RM9,000", "Automatic — no documentation needed"],
            ["Spouse (no income)", "RM4,000", "Only if spouse has no employment income"],
            ["Child under 18", "RM2,000 each", "Per qualifying child"],
            ["Child over 18, in full-time education", "RM8,000 each", "Education certificate required"],
            ["EPF + Life Insurance (combined)", "RM7,000", "EPF: up to RM4,000; Life ins: up to RM3,000"],
            ["Medical expenses (serious illness)", "RM8,000", "Licensed medical receipts required"],
            ["Lifestyle (books, sports, internet, devices)", "RM2,500", "Per year, with receipts"],
            ["SSPN education savings", "RM8,000", "Net deposit into SSPN account"],
            ["Private Retirement Scheme (PRS)", "RM3,000", "For contributions into approved PRS funds"],
            ["Medical examination / health screening", "RM1,000", "GP or specialist receipts"],
            ["EV/Hybrid charging equipment", "RM2,500", "Purchase or charging fees"],
            ["Disabled individual (self)", "RM6,000", "Additional relief if self is disabled"],
            ["Disabled spouse", "RM5,000", "Additional to spouse relief"],
            ["Disabled child", "RM6,000", "Additional to child relief"],
          ],
        },
      },
      {
        heading: "Step-by-Step Tax Calculation Example",
        body: [
          "A Malaysian resident earning RM6,000/month (RM72,000/year), with a non-working spouse and one child under 18, claiming EPF and lifestyle reliefs:",
        ],
        table: {
          headers: ["Item", "Amount"],
          rows: [
            ["Gross Annual Income", "RM72,000"],
            ["Less: Individual Relief", "–RM9,000"],
            ["Less: EPF Relief (capped)", "–RM4,000"],
            ["Less: Life Insurance", "–RM3,000"],
            ["Less: Spouse Relief", "–RM4,000"],
            ["Less: Child Relief (1 child)", "–RM2,000"],
            ["Less: Lifestyle Relief", "–RM2,500"],
            ["Less: Medical Examination", "–RM1,000"],
            ["Chargeable Income", "RM46,500"],
            ["Tax on first RM35,000", "RM600"],
            ["Tax on next RM11,500 @ 8%", "RM920"],
            ["Total Annual Tax", "RM1,520"],
            ["Estimated Monthly PCB", "~RM127/month"],
          ],
        },
        callout:
          "Claiming all available reliefs is legal and encouraged. Keep receipts and documentation for at least 7 years in case of LHDN audit.",
      },
      {
        heading: "Filing Your Annual Tax Return",
        body: [
          "File your tax return via e-Filing at mytax.hasil.gov.my. The deadline for employment income is April 30 each year. First-time filers must first register for a tax number on the same portal.",
          "Before filing, gather your EA Form (issued by your employer by February 28), receipts for all claimed reliefs, and your annual EPF statement.",
          "Refunds for e-Filing submissions are typically processed within 30 working days. Penalties apply for late filing — up to 10% for first-time offences and higher for repeat offences.",
        ],
      },
    ],
  },

  {
    slug: "zakat-harta-guide-malaysia",
    title: "Zakat Harta in Malaysia: Types, Nisab & How to Calculate (2026)",
    description:
      "A complete guide to zakat harta (wealth zakat) in Malaysia — types of zakatable wealth, how nisab is determined, and calculation methods for savings, gold, investments, and business assets.",
    keywords:
      "zakat harta malaysia, how to calculate zakat, nisab 2026 malaysia, zakat savings, zakat gold, zakat pelaburan, zakat perniagaan",
    publishedDate: "2026-02-05",
    readingTime: 9,
    categoryLabel: "Islamic Finance",
    relatedCalculator: { href: "/zakat", label: "Try the Zakat Calculator" },
    intro:
      "Zakat is the third pillar of Islam — an annual obligation for Muslims who possess wealth above the nisab (minimum threshold) for a full lunar year. In Malaysia, zakat is administered by state Islamic religious authorities and carries a unique dual benefit: fulfilling a religious duty and earning a ringgit-for-ringgit income tax rebate. This guide explains the types of zakat harta, how nisab is determined in 2026, and how to calculate your obligation across different asset classes.",
    sections: [
      {
        heading: "Who Must Pay Zakat Harta?",
        body: [
          "To be obligated to pay zakat harta, you must be: (1) Muslim, (2) fully sane (aqil), (3) free from slavery, (4) in possession of wealth above the nisab threshold, and (5) have held that wealth for a complete hawl — one full lunar year (approximately 354 days).",
          "In Malaysia, you pay zakat to the zakat authority in your state of residence. For example, workers in Kuala Lumpur pay to MAIWP regardless of their home state.",
        ],
      },
      {
        heading: "Types of Zakat Harta in Malaysia",
        list: [
          { text: "Zakat Fitrah", subtext: "Personal zakat paid during Ramadan. Fixed at the value of staple food (~RM7–RM22 per person, set by state). Not the same as zakat harta." },
          { text: "Zakat Pendapatan (Income Zakat)", subtext: "2.5% of net monthly employment income above the nisab. Some states allow this via monthly salary deduction." },
          { text: "Zakat Simpanan (Savings Zakat)", subtext: "2.5% of cash and bank savings held above the nisab for a full hawl." },
          { text: "Zakat Emas dan Perak (Gold & Silver)", subtext: "2.5% of the current market value of gold and silver holdings above the nisab weight." },
          { text: "Zakat Pelaburan (Investment Zakat)", subtext: "2.5% of the current market value of unit trusts, shares, ASB, and similar investments." },
          { text: "Zakat Perniagaan (Business Zakat)", subtext: "2.5% of net current business assets (simplified method), or a full accounting-based calculation for larger companies." },
        ],
      },
      {
        heading: "Understanding Nisab",
        body: [
          "Nisab is the minimum wealth threshold that triggers zakat. Two traditional nisab values exist: 85 grams of pure gold or 595 grams of silver. Most Malaysian zakat authorities use the gold nisab for zakat harta.",
        ],
        table: {
          headers: ["Nisab Basis", "Weight", "Approx. 2026 Value (RM)"],
          rows: [
            ["Gold (85 grams)", "85g pure gold", "~RM24,650 – RM26,350"],
            ["Silver (595 grams)", "595g silver", "~RM2,800 – RM3,200"],
          ],
        },
        callout:
          "Always check your state's zakat authority website for the current nisab — it changes with gold and silver prices. The figures above are 2026 approximations.",
      },
      {
        heading: "Calculating Zakat on Savings",
        body: [
          "Zakat on savings applies to cash in hand, current accounts, savings accounts, and fixed deposits.",
          "Method: Identify your minimum balance held continuously throughout the hawl. If this minimum exceeds the nisab, multiply it by 2.5%.",
          "Example: Minimum balance of RM50,000 held for a full hawl. Nisab = RM25,000. Zakat = RM50,000 × 2.5% = RM1,250.",
          "If your balance dropped below the nisab at any point during the year, the hawl resets from when it returns above nisab.",
        ],
      },
      {
        heading: "Calculating Zakat on Gold and Silver",
        body: [
          "Physical gold and silver — bullion, coins, bars, and jewellery — are zakatable at 2.5% of current market value, provided the total weight exceeds the nisab.",
          "There is scholarly disagreement on gold jewellery worn regularly for personal use. Malaysia's major zakat authorities generally include jewellery above the nisab weight, but practice varies by state.",
          "Example: You own 100 grams of 24-karat gold at RM300/gram. Market value = RM30,000. Zakat = RM30,000 × 2.5% = RM750.",
        ],
      },
      {
        heading: "Calculating Zakat on Investments",
        body: [
          "Shares, unit trusts, ASB/ASN, and similar instruments are zakatable. Most Malaysian authorities accept the market value method: 2.5% of current market value above the nisab, held for a full hawl.",
          "Example: Unit trust portfolio worth RM80,000 at year-end. Zakat = RM80,000 × 2.5% = RM2,000.",
          "For EPF savings, some states require 2.5% on the hawl balance above nisab when the annual dividend is credited. Check your state's ruling — practice is not uniform across Malaysia.",
        ],
      },
      {
        heading: "Allowable Deductions",
        body: ["Legitimate liabilities reduce your zakatable wealth before applying the 2.5% rate:"],
        list: [
          { text: "Short-term personal debts due within the year", subtext: "Loans, instalments, credit card balances due and payable within the current hawl." },
          { text: "Business liabilities (for business zakat)", subtext: "Trade payables, short-term bank loans, and other current liabilities." },
          { text: "Basic personal living expenses", subtext: "An estimated annual amount for yourself and dependants — methodology varies by state." },
        ],
      },
      {
        heading: "Zakat as an Income Tax Rebate",
        body: [
          "Zakat paid to an authorised Malaysian state zakat authority is a ringgit-for-ringgit income tax rebate — not merely a deduction. If you pay RM2,000 in zakat and owe RM3,000 in income tax, your tax payable becomes RM1,000.",
          "This is more valuable than a tax relief, which only reduces chargeable income at your marginal rate. Keep your zakat payment receipt for your annual e-Filing return and declare it under the 'Rebate' section.",
        ],
        callout:
          "Zakat is the only expense in Malaysia's tax system that gives a direct ringgit-for-ringgit rebate against income tax payable.",
      },
    ],
  },

  {
    slug: "faraid-islamic-inheritance-explained",
    title: "Faraid: Understanding Islamic Inheritance Distribution in Malaysia",
    description:
      "How faraid (Islamic inheritance) works in Malaysia — who qualifies as an heir, fixed share allocations, the awl and hajb rules, practical examples, and what faraid does not cover.",
    keywords:
      "faraid malaysia, islamic inheritance malaysia, pembahagian waris, faraid heirs, faraid shares, awl hajb, faraid calculator",
    publishedDate: "2026-02-10",
    readingTime: 10,
    categoryLabel: "Islamic Finance",
    relatedCalculator: { href: "/faraid", label: "Try the Faraid Calculator" },
    intro:
      "Faraid (فرائض) is the Quranic system of inheritance distribution that governs how a deceased Muslim's estate is divided among surviving heirs. In Malaysia, faraid applies to all Muslims under state Islamic Family Law, making it a legally binding framework — not merely a religious guideline. Understanding faraid is essential for estate planning, avoiding family disputes, and ensuring your wealth reaches the right people.",
    sections: [
      {
        heading: "What is Faraid and How Does It Apply in Malaysia?",
        body: [
          "The rules of faraid are derived from the Quran (Surah An-Nisa, verses 11–12 and 176) and expanded through classical Islamic jurisprudence. In Malaysia, these rules apply to all Muslims upon death for property held in the deceased's name.",
          "Non-Muslims are governed by the Distribution Act 1958 or the Wills Act 1959 — faraid does not apply to them. For Muslims, faraid is administered through the Syariah Courts, with Amanah Raya Berhad handling estate administration in many cases.",
        ],
      },
      {
        heading: "Pre-Distribution: Three Deductions Come First",
        list: [
          { text: "Funeral and burial expenses", subtext: "Reasonable costs of washing, shrouding, prayers, and burial are settled first from the estate." },
          { text: "Outstanding debts", subtext: "All financial obligations of the deceased must be paid in full — bank loans, credit cards, unpaid taxes, zakat, and personal loans." },
          { text: "Valid wasiat (bequests)", subtext: "Bequests made by the deceased to non-Quranic heirs, up to a maximum of one-third of the remaining estate after debts." },
        ],
        body: ["Only the remainder after these three deductions forms the distributable estate for faraid purposes."],
      },
      {
        heading: "Three Classes of Heirs",
        list: [
          { text: "Dhul Furud (Fixed-Share Heirs)", subtext: "Heirs with predetermined Quranic shares: husband/wife, daughters, mothers, fathers, grandmothers, and sisters. They receive their fixed shares first." },
          { text: "Asabah (Residual Heirs)", subtext: "Heirs who receive the remainder after fixed shares are distributed. Sons are primary asabah; brothers, uncles, and their descendants serve as asabah in the absence of closer male relatives." },
          { text: "Dhul Arham (Distant Relatives)", subtext: "Relatives who inherit only in the complete absence of dhul furud and asabah. Includes maternal grandparents, aunts and uncles on the mother's side, and certain cousins." },
        ],
      },
      {
        heading: "Fixed Shares: Who Gets What",
        body: ["The fixed Quranic shares depend on which other heirs are present:"],
        table: {
          headers: ["Heir", "Share if NO children", "Share if CHILDREN present"],
          rows: [
            ["Husband", "1/2", "1/4"],
            ["Wife / Wives (shared equally)", "1/4", "1/8"],
            ["Only daughter (no son)", "1/2", "—"],
            ["Two or more daughters (no son)", "2/3 shared", "—"],
            ["Mother", "1/3", "1/6"],
            ["Father", "1/6 + residual", "1/6"],
            ["Full Sister (only one, no brothers)", "1/2", "Blocked by son"],
            ["Full Sisters (2+, no brothers)", "2/3 shared", "Blocked by son"],
          ],
        },
        callout:
          "Sons are not fixed-share heirs — they are asabah (residual heirs). Sons take whatever remains after all fixed shares, with sons receiving twice the share of daughters.",
      },
      {
        heading: "Awl: When Fixed Shares Exceed the Estate",
        body: [
          "Awl (عول) occurs when the mathematical sum of all fixed shares exceeds 100% of the estate. This can happen in certain heir combinations, such as a husband, two daughters, and a mother inheriting simultaneously.",
          "When awl applies, all shares are reduced proportionally so they total exactly 100%. No heir is eliminated — everyone receives a smaller proportional share.",
          "Example: Husband (1/4) + Two Daughters (2/3) + Mother (1/6). Sum = 3/12 + 8/12 + 2/12 = 13/12 (exceeds 100%). Under awl, estate is divided into 13 parts: husband 3/13, daughters 8/13, mother 2/13.",
        ],
      },
      {
        heading: "Hajb: When Heirs Block Other Heirs",
        list: [
          { text: "Hajb Hirman (Complete Blocking)", subtext: "A closer heir completely excludes a more distant one. A son blocks grandsons, brothers, and uncles. A father blocks the grandfather and brothers." },
          { text: "Hajb Nuqsan (Share Reduction)", subtext: "A closer heir reduces (but does not eliminate) another heir's share. Children reduce the husband's share from 1/2 to 1/4, and reduce the wife's collective share from 1/4 to 1/8." },
        ],
        body: ["Hajb is the most complex aspect of faraid and a primary reason professional calculation or scholarly advice is sought for large estates."],
      },
      {
        heading: "What Faraid Does NOT Cover",
        list: [
          { text: "EPF savings", subtext: "EPF is distributed via your nomination form, not faraid. The EPF nominee receives funds directly upon death, treated as a form of hibah (gift)." },
          { text: "Life insurance proceeds", subtext: "Insurance benefits go to the named beneficiary, bypassing the estate." },
          { text: "Jointly owned property", subtext: "Property held jointly may pass to the surviving owner by right of survivorship under Malaysian land law, depending on how the joint tenancy is structured." },
          { text: "Assets transferred via hibah (gift) before death", subtext: "Property genuinely given away during the deceased's lifetime does not form part of the estate." },
          { text: "Trust assets", subtext: "Assets held in a properly structured trust for specified beneficiaries are not part of the faraid estate." },
        ],
      },
      {
        heading: "Getting a Faraid Certificate",
        body: [
          "After a Muslim dies in Malaysia, a Faraid Certificate (Sijil Faraid) issued by the Syariah Court or an authorised body is typically required before the estate can be administered. This document sets out the precise distribution shares.",
          "The process involves obtaining the death certificate from JPN, filing an application with the Syariah Court or Amanah Raya Berhad, and providing evidence of the family tree, marriages, and heirs' identification documents.",
          "Amanah Raya Berhad offers end-to-end estate administration services for smaller estates. For complex cases involving businesses, multiple properties, or disputed heirs, an Islamic estate lawyer is strongly recommended.",
        ],
      },
    ],
  },

  {
    slug: "wasiat-hibah-estate-planning-malaysia",
    title: "Wasiat and Hibah: Estate Planning Tools for Malaysian Muslims",
    description:
      "How wasiat (Islamic will) and hibah (gift) work alongside faraid for comprehensive Muslim estate planning in Malaysia — differences, limitations, the one-third rule, and practical advice.",
    keywords:
      "wasiat malaysia, hibah malaysia, islamic will malaysia, wasiat vs hibah, estate planning malaysia, one third rule wasiat, hibah EPF nomination",
    publishedDate: "2026-02-15",
    readingTime: 8,
    categoryLabel: "Islamic Finance",
    relatedCalculator: { href: "/wasiat", label: "Try the Wasiat Planning Guide" },
    intro:
      "Faraid governs the distribution of a Muslim's estate after death, but operates on fixed rules you cannot customise. Two complementary instruments — wasiat (Islamic will) and hibah (gift) — allow Malaysian Muslims to direct certain assets to specific people, protect non-Quranic heirs, and bypass the delays of estate administration. This guide explains both tools, when to use each, and how they interact with faraid.",
    sections: [
      {
        heading: "The Practical Challenges of Faraid Alone",
        list: [
          { text: "Frozen assets", subtext: "Without planning, bank accounts and property in the deceased's name can be frozen for months or years during estate administration, creating financial hardship for the family." },
          { text: "Fixed heirs only", subtext: "Faraid gives prescribed shares to Quranic heirs. You cannot leave more to a disabled child, or give anything to a non-Muslim spouse or step-children, through faraid alone." },
          { text: "Family disputes", subtext: "Without a clearly documented plan, disagreements about assets, valuations, and distributions are common among heirs." },
          { text: "No guardian designation", subtext: "Faraid does not designate a guardian for minor children — that requires a separate document." },
        ],
      },
      {
        heading: "What is Wasiat?",
        body: [
          "A wasiat is an Islamic testamentary document — instructions that take effect upon your death. It is broadly equivalent to a conventional will but governed by Islamic law.",
          "The most important constraint on wasiat is the one-third rule: you can direct at most one-third of your net estate (after funeral costs and debts) through wasiat. The remaining two-thirds must be distributed according to faraid.",
          "Wasiat cannot benefit Quranic heirs (those who already receive faraid shares), unless all other heirs unanimously agree after death. Wasiat is ideal for: step-children, adopted children, non-Muslim family members, grandchildren whose parent predeceased you, and charitable causes.",
        ],
      },
      {
        heading: "Requirements for a Valid Wasiat",
        list: [
          { text: "Made by a sane adult Muslim", subtext: "At least 18 years old and of sound mind. A wasiat made under duress or by a person deemed mentally incompetent is invalid." },
          { text: "Witnessed by two adult Muslim males", subtext: "The witnesses must be present when the wasiat is signed and cannot themselves be beneficiaries." },
          { text: "Within the one-third limit", subtext: "All wasiat bequests combined cannot exceed one-third of the net estate. Any excess requires unanimous agreement from all Quranic heirs after death." },
          { text: "Not for haram purposes", subtext: "Bequests for prohibited activities (gambling, alcohol business, etc.) are invalid." },
        ],
      },
      {
        heading: "What is Hibah?",
        body: [
          "Hibah (هبة) is a gift that transfers ownership of an asset to the recipient during the giver's lifetime. Unlike wasiat, hibah takes effect immediately upon giving — the asset leaves your ownership now.",
          "There is no one-third restriction on hibah. You can give any amount of any asset to anyone — including Quranic heirs, non-Muslim family members, step-children, or institutions. Once given, the asset is no longer part of your estate, so faraid cannot apply to it.",
          "Hibah is particularly valuable for: ensuring a specific child or spouse receives the family home, providing for a disabled family member who needs more than their faraid entitlement, business succession planning, and eliminating the risk of assets being frozen during estate administration.",
        ],
      },
      {
        heading: "Wasiat vs Hibah: Direct Comparison",
        table: {
          headers: ["Feature", "Wasiat", "Hibah"],
          rows: [
            ["When it takes effect", "At death", "Immediately (upon giving)"],
            ["One-third restriction", "Yes — maximum 1/3 of net estate", "No restriction"],
            ["Can benefit Quranic heirs?", "No (without heirs' consent)", "Yes"],
            ["Can benefit non-Muslims?", "Yes (majority scholarly view)", "Yes"],
            ["Avoids estate freeze?", "No — asset stays in estate", "Yes — asset already transferred"],
            ["Revocable?", "Yes — at any time before death", "Generally irrevocable once given"],
            ["Subject to faraid?", "The remaining 2/3 is still subject to faraid", "Not subject to faraid"],
          ],
        },
      },
      {
        heading: "EPF Nominations and Insurance: The Practical Hibah",
        body: [
          "Many Malaysians do not realise that EPF nominations and life insurance beneficiary designations function similarly to hibah — assets go directly to the named person, bypassing faraid entirely.",
          "Your EPF nomination means that your EPF savings go to the nominated person upon your death, regardless of who your faraid heirs are. You can nominate a non-Muslim spouse, a step-child, or a disabled sibling — people who would receive nothing under faraid.",
          "Important caveat for Muslims: EPF's official position is that the nomination creates a trust. The nominee is expected (but not legally compelled) to distribute proceeds according to faraid among other heirs. Consult your state's Islamic religious authority if you intend the nomination as an outright hibah.",
          "Update your EPF and insurance nominations regularly — after marriage, divorce, or the birth of children — via i-Akaun at kwsp.gov.my.",
        ],
      },
      {
        heading: "Building a Complete Estate Plan",
        list: [
          { text: "Accept faraid for the majority of your estate", subtext: "Plan your financial affairs knowing that most assets will be distributed by faraid. Make peace with this — it is divinely ordained." },
          { text: "Write a wasiat for up to one-third", subtext: "Direct specific assets or cash to non-Quranic heirs, charities, or as special provisions for particular family members." },
          { text: "Use hibah for time-sensitive transfers", subtext: "Give assets now that you want specific people to have — especially property, to avoid the asset being frozen after death." },
          { text: "Update EPF and insurance nominations", subtext: "The most immediate and accessible tools. Process these first — they bypass estate administration entirely." },
          { text: "Appoint an executor (wasi)", subtext: "Name a trusted individual or appoint Amanah Raya Berhad as professional trustee to administer your estate." },
        ],
        callout:
          "Start your estate plan today. The freeze and confusion following an unplanned death creates hardship for the people you love most.",
      },
    ],
  },

  {
    slug: "socso-eis-guide-malaysia",
    title: "SOCSO and EIS in Malaysia: Benefits, Contribution Rates & How to Claim (2026)",
    description:
      "Everything you need to know about SOCSO (PERKESO) and EIS — what they cover, 2026 contribution rates, how to claim work injury or job loss benefits, and how to use MySocso.",
    keywords:
      "SOCSO malaysia, PERKESO, EIS malaysia, socso contribution rates, how to claim SOCSO, employment insurance malaysia, mysocso portal",
    publishedDate: "2026-02-20",
    readingTime: 8,
    categoryLabel: "Salary & Tax",
    relatedCalculator: { href: "/salary", label: "Try the Salary Calculator" },
    intro:
      "Every month, a small amount is deducted from your Malaysian payslip labelled SOCSO and EIS. Many workers have no idea what these deductions cover or how to claim the benefits they have been paying into. This guide explains what SOCSO covers, how EIS protects you if you lose your job, the exact 2026 contribution rates, and step-by-step guidance on making a claim.",
    sections: [
      {
        heading: "What is SOCSO (PERKESO)?",
        body: [
          "SOCSO — Social Security Organisation, or PERKESO (Pertubuhan Keselamatan Sosial) in Malay — is the Malaysian statutory body established under the Employees' Social Security Act 1969. It provides two types of social protection insurance: coverage for workplace accidents and occupational diseases, and protection against permanent invalidity or death from any cause.",
          "SOCSO is mandatory for all Malaysian citizens and permanent residents employed under a contract of service. Contributions are capped at a monthly wage ceiling of RM4,000 — meaning employees earning above RM4,000 still contribute as if their wage were RM4,000.",
        ],
      },
      {
        heading: "The Two SOCSO Schemes",
        list: [
          {
            text: "Employment Injury Insurance Scheme (First Category)",
            subtext:
              "Covers work accidents and occupational diseases. Benefits include free medical treatment at government hospitals and panel clinics, temporary disablement allowance (80% of assumed daily wage from day 4), permanent disablement pension or lump sum, death benefit and dependants' pension.",
          },
          {
            text: "Invalidity Insurance Scheme (Second Category)",
            subtext:
              "Covers permanent invalidity or death from any cause — not just work-related incidents. Benefits include monthly invalidity pension (if deemed permanently invalid before 60), invalidity grant (lump sum for fewer than 24 contribution months), and survivors' pension for spouse and children.",
          },
        ],
      },
      {
        heading: "SOCSO Contribution Rates (2026)",
        table: {
          headers: ["Monthly Wage", "Employee (0.5%)", "Employer (1.75%)", "Total"],
          rows: [
            ["RM1,000", "RM5.00", "RM17.50", "RM22.50"],
            ["RM1,500", "RM7.50", "RM26.25", "RM33.75"],
            ["RM2,000", "RM10.00", "RM35.00", "RM45.00"],
            ["RM3,000", "RM15.00", "RM52.50", "RM67.50"],
            ["RM4,000 (maximum wage for calculation)", "RM20.00", "RM70.00", "RM90.00"],
          ],
        },
        callout:
          "SOCSO contributions are capped at the RM4,000 wage ceiling. Even if you earn RM10,000/month, your SOCSO contribution remains RM20.00 (employee) and RM70.00 (employer).",
      },
      {
        heading: "What is EIS (Employment Insurance System)?",
        body: [
          "EIS was introduced in January 2018 under the Employment Insurance System Act 2017 and is administered by SOCSO/PERKESO. While SOCSO protects you against injuries and invalidity, EIS protects you against involuntary job loss.",
          "If you are retrenched, made redundant, or your fixed-term contract expires without renewal, EIS provides financial support and career services to help you find new employment. Voluntary resignations do not qualify for EIS benefits.",
        ],
      },
      {
        heading: "EIS Benefits",
        list: [
          { text: "Job Search Allowance (JSA)", subtext: "Monthly cash benefit while job hunting. First month: 80% of assumed daily wage × 30 days. Reduces to 50% by month 3. Maximum benefit period: 3–6 months depending on contribution history." },
          { text: "Reduced Income Benefit (RIB)", subtext: "If you accept a new job paying at least 30% less than your previous salary, EIS tops up your income for up to 6 months." },
          { text: "Career counselling", subtext: "Free sessions with SOCSO-approved counsellors to plan your next steps and update your CV." },
          { text: "Job placement assistance", subtext: "Access to JobsMalaysia and SOCSO's employer network for job matching." },
          { text: "Upskilling programmes", subtext: "Training through HRDF-registered providers to improve your employability in new sectors." },
        ],
      },
      {
        heading: "EIS Contribution Rates (2026)",
        table: {
          headers: ["Monthly Wage", "Employee (0.2%)", "Employer (0.2%)", "Total (0.4%)"],
          rows: [
            ["RM2,000", "RM4.00", "RM4.00", "RM8.00"],
            ["RM3,000", "RM6.00", "RM6.00", "RM12.00"],
            ["RM4,000", "RM8.00", "RM8.00", "RM16.00"],
            ["RM5,000 (maximum)", "RM10.00", "RM10.00", "RM20.00"],
          ],
        },
        callout: "EIS maximum employee contribution: RM10/month. Maximum employer contribution: RM10/month. Total cap: RM20/month.",
      },
      {
        heading: "How to Claim SOCSO Benefits",
        list: [
          { text: "For work accidents: report within 48 hours", subtext: "Your employer must complete Form 34 (Accident Report) and submit it to SOCSO within 48 hours of the incident." },
          { text: "Seek treatment at a SOCSO panel clinic or government hospital", subtext: "Present your MyKad at the clinic. Treatment costs are covered directly — you should not pay out of pocket for panel treatment." },
          { text: "Submit Form 10 (Employee Accident Notice)", subtext: "You or your employer submits this form along with your medical certificate and Form 34 to SOCSO." },
          { text: "Temporary disablement benefit begins from day 4", subtext: "SOCSO pays 80% of your assumed daily wage for each day you cannot work. The first 3 days are not covered." },
        ],
        body: [
          "For invalidity claims (non-work-related), contact SOCSO via the MySocso portal or visit a SOCSO branch with medical documentation from a registered doctor confirming your permanent invalidity.",
        ],
      },
      {
        heading: "How to Claim EIS Benefits",
        list: [
          { text: "Confirm eligibility", subtext: "You must have contributed to EIS for at least 12 months within the previous 24 months. Only involuntary job loss qualifies." },
          { text: "Apply within 60 days of losing your job", subtext: "Applications after 60 days from the last day of employment are automatically rejected." },
          { text: "Apply online via eis.perkeso.gov.my", subtext: "Upload your termination letter, MyKad copy, and bank account details. Your employer must also submit the Separation Notice (Form SPN-I) online." },
          { text: "Report monthly job search activities", subtext: "You must log your job search efforts each month to continue receiving JSA. Failure to report results in suspension of payments." },
        ],
      },
      {
        heading: "MySocso: Your Online Portal",
        body: [
          "MySocso (perkeso.gov.my) and the MySocso mobile app give you full visibility of your SOCSO and EIS records. You can check contribution history, verify coverage, download contribution statements, submit and track claims, and access career services — all without visiting a branch.",
          "Check your SOCSO contributions regularly. Employers are legally required to register all employees from their first day of work. If contributions are missing from your statement, report it to SOCSO — employers who fail to contribute face fines and prosecution.",
        ],
      },
    ],
  },
];
