# Housing Loan Calculator — Real-World Modifiers

**Date:** 2026-08-29
**Status:** Approved, ready for implementation

## Problem

The Housing Loan calculator models the textbook amortisation formula but skips the
real-world modifiers that determine what a Malaysian buyer actually pays. A user
buying a new-launch unit with a 10% developer rebate and "free legal fee, free MOT"
sees an upfront figure that can be tens of thousands of ringgit too high. A
non-citizen buyer sees a stamp duty figure that is less than half the true amount.

Both users get a wrong number and stop trusting the site.

## Scope

One calculator, four feature groups:

1. Developer rebate and developer-absorbed fee waivers
2. Buyer type, and the correct stamp duty treatment for each
3. MRTA/MLTA and the missing upfront cost lines
4. Amortisation schedule with extra-repayment savings

Out of scope: DSR/affordability check, multi-scenario comparison, and the other
eight calculators. Those are separate units of work.

## Prior art check — what is NOT a bug

An earlier draft of this design proposed replacing the `price <= 500000` full
exemption with a tiered rule granting partial relief in the RM500k–RM1m band.
**That would have introduced a bug.** Research on 2026-08-29 confirmed:

- The 100% exemption on MOT *and* loan agreement for first-home buyers at
  ≤ RM500,000 is current, and Budget 2026 extended it to **31 Dec 2027**.
- The 75% remission for RM500,001–RM1,000,000 was the i-MILIKI scheme. It expired
  **31 Dec 2023** and was never renewed. Above RM500,000 there is no relief.
- The MOT tiers (1% / 2% / 3% / 4%) and the 0.5% loan agreement duty already in
  the code are correct for 2026.

The existing exemption logic is therefore kept as-is. It is only relocated into a
dated constant so the next Budget change is a one-line edit.

Sources are recorded in the code comments beside each constant.

## Architecture

### Extract the math

The formulas currently live inline in `client/src/pages/HousingLoanCalculator.tsx`,
unlike `lib/carLoan.ts` and `lib/fixedDeposit.ts` which are extracted and unit
tested. This change roughly triples the logic, so it moves to a new
`client/src/lib/housingLoan.ts` following the established pattern, with
`client/src/lib/__tests__/housingLoan.test.ts` alongside the existing four suites.

The page becomes presentation only: inputs, formatting, and layout.

### Input model

```ts
export type BuyerType = "citizen" | "pr" | "foreigner";

export interface HousingLoanInputs {
  price: number;                   // SPA price in RM
  rebatePct: number;               // developer rebate, % of SPA price
  downPct: number;
  tenureYears: number;
  rate: number;                    // annual %, reducing balance
  buyerType: BuyerType;
  firstHome: "yes" | "no";
  developerAbsorbsLegal: boolean;
  developerAbsorbsMot: boolean;
  mrtaPremium: number;             // RM, 0 = none
  financeMrta: boolean;            // roll the premium into the loan
  extraMonthly: number;            // RM extra principal per month, 0 = none
}
```

Rebate is a percentage, not a ringgit amount, because that is how developers quote
it. Every new field defaults to zero, false, or the status-quo enum value, so
existing shared URLs keep resolving — `mergeFromUrl` fills the remainder from
defaults. Toggles use the existing `boolField` helper in `lib/urlState.ts`.

## Calculation rules

### Stamp duty by buyer type

| Buyer type | MOT duty | First-home exemption |
|---|---|---|
| `citizen` | Tiered 1/2/3/4% | Eligible |
| `pr` | Tiered 1/2/3/4% | **Not** eligible |
| `foreigner` | **Flat 8%** of price | Not eligible |

The permanent resident row is the reason `pr` is a distinct option rather than
being folded into `citizen`: a PR is exempt from the higher foreign-buyer rate and
pays the normal tiers, but the first-home exemption is restricted to Malaysian
citizens.

The 8% flat rate for non-citizens and foreign companies took effect 1 Jan 2026,
raised from 4% in Budget 2026.

Exemption predicate:

```
exempt = buyerType === "citizen" && firstHome === "yes" && price <= FIRST_HOME_EXEMPTION.maxPrice
```

When `exempt`, both MOT duty and loan agreement duty are zero.

The eligibility conditions the calculator cannot verify — must never have owned
residential property, SPA must be signed within the exemption window — are stated
as hint text under the first-home toggle rather than modelled as inputs.

### Loan and MRTA

```
downPayment = price × downPct / 100
baseLoan    = price − downPayment
principal   = baseLoan + (financeMrta ? mrtaPremium : 0)
```

The instalment, loan agreement stamp duty, and loan agreement legal fee are all
computed on `principal`, since that is the sum the loan agreement is actually
executed for. An unfinanced MRTA premium falls to upfront cash instead.

Instalment is the standard reducing-balance formula, with the `rate === 0` case
falling back to `principal / months`.

### Rebate and waivers

Per the agreed treatment, the rebate is cash-side only. It does not reduce the
financed amount, and it does not reduce the basis for stamp duty or legal fees —
which matches how the standard Malaysian "zero down payment" new-launch package
actually works, where the bank finances against the full SPA price.

```
rebateAmount = price × rebatePct / 100

payableMot      = developerAbsorbsMot   ? 0 : motDuty
payableLegal    = developerAbsorbsLegal ? 0 : legalFees
payableLoanDuty = loanDuty   // never waived by the developer package

grossUpfront = downPayment + payableMot + payableLoanDuty + payableLegal
             + valuationFee + disbursements
             + (financeMrta ? 0 : mrtaPremium)

netCashRequired = max(0, grossUpfront − rebateAmount)
rebateSurplus   = max(0, rebateAmount − grossUpfront)
```

`netCashRequired` becomes the headline upfront figure. When the rebate exceeds
gross upfront cost, the calculator floors the figure at zero and surfaces the
surplus separately — that negative case is the entire point of the feature, since
it is how a buyer confirms a "zero down payment" claim is real.

The developer package covers the MOT duty and the legal fees only. The loan
agreement stamp duty stays with the buyer, since it belongs to the financing
rather than to the sale, and is zeroed only by the first-home exemption.

Waived lines are still computed and displayed struck-through with a
"covered by developer" tag. The user should see the value being given to them,
not a blank row.

### Additional upfront costs

- **Valuation fee** — tiered scale: 0.25% on the first RM100,000, 0.2% on the next
  RM2,000,000, 0.167% on the next RM7,000,000, 0.125% thereafter.
- **Legal disbursements** — flat RM1,800 constant, labelled in the UI as an
  estimate.

### Amortisation

`buildSchedule(principal, annualRate, months, extraMonthly)` iterates monthly,
applying any extra payment to principal, and aggregates into yearly rows:

```ts
export interface AmortYear {
  year: number;
  openingBalance: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}
```

At most 40 rows, so it is cheap enough to run inside a `useMemo` on every input
change. The loop is bounded by the nominal term as a safety stop; extra payments
can only shorten it.

Savings are derived by running the schedule twice — once at `extraMonthly = 0` and
once with the user's figure — and differencing:

```
interestSaved = baseTotalInterest − extraTotalInterest
monthsSaved   = baseMonths − extraMonths
```

## Presentation

- Rebate, buyer type, MRTA, and extra repayment join the existing input grid.
  The two developer-absorbs switches are grouped under a "Developer package"
  subheading, since they only apply to new launches.
- The upfront breakdown card gains the waived-line treatment and a
  `netCashRequired` total replacing `totalUpfront` as the emphasised figure.
- The amortisation schedule renders as a collapsible yearly table plus a stacked
  principal-vs-interest bar built from CSS grid. No chart library — the repo has
  none, and introducing one for a single bar is not justified.
- Extra-repayment savings render as a callout above the schedule.

## Constants

All rule-bound figures become exported, dated constants with a source comment, so
that a Budget change is a one-line edit rather than a hunt through the file:

- `FIRST_HOME_EXEMPTION` — `{ maxPrice: 500_000, expires: "2027-12-31" }`
- `FOREIGN_BUYER_MOT_RATE` — `0.08`, effective 2026-01-01
- `MOT_TIERS`, `LEGAL_FEE_TIERS`, `VALUATION_FEE_TIERS`
- `LOAN_AGREEMENT_DUTY_RATE` — `0.005`
- `LEGAL_DISBURSEMENTS_ESTIMATE` — `1_800`

## Testing

`housingLoan.test.ts`, matching the style of the existing lib suites:

- MOT tiers at each boundary (100k, 500k, 1m, above 1m)
- Foreign buyer flat 8%, and that it bypasses the tiers entirely
- PR pays tiers but is denied the first-home exemption
- Citizen first-home exemption applies at exactly RM500,000 and not at RM500,001
- Exemption zeroes both MOT and loan agreement duty
- Rebate does not change loan amount, MOT duty, or legal fees
- `netCashRequired` floors at zero, and `rebateSurplus` reports the excess
- Each waiver zeroes only its own payable line, leaving the gross line intact
- Financed MRTA raises the instalment; unfinanced MRTA raises upfront cash instead
- Schedule closing balance reaches zero at term, and yearly principal sums to the
  loan amount
- Extra repayment shortens the term and reduces total interest
- `rate === 0` does not divide by zero

## i18n

Roughly 25 new keys in the existing `housing.*` block of `lib/i18n.ts`, populated
for all three supported locales: `en`, `ms`, `id`.

## Sources

- Budget 2026 exemption extension to 31 Dec 2027 — The Star, RinggitPlus
- i-MILIKI 75% remission expiry (31 Dec 2023, not renewed) — The Edge Malaysia
- 2026 MOT tiers, 0.5% loan duty, 8% foreign buyer rate — ClearTax, KC Group
