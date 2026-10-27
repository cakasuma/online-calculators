# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
People in Malaysia (and Indonesia) who arrive with one concrete question, usually on a phone: "what is my take-home pay", "how much zakat do I owe", "what will this loan cost me a month". They want the right calculator in one or two taps, an answer they can trust, and to leave. Interface languages: English, Bahasa Malaysia, Bahasa Indonesia.

## Product Purpose
HelloKalku (hellokalku.com) is a free collection of 13 Malaysia-focused calculators and guides: salary/EPF/housing loan/income tax/car loan/fixed deposit (finance), BMI (health), basic and scientific (math), and faraid/zakat/wasiat (Islamic planning), plus a guides section. Success is a visitor reaching the right tool quickly and getting a clear result, with ad revenue (AdSense) and optional lead capture as the business model.

## Positioning
Local rates and rules (2026 EPF/SOCSO/EIS/PCB, Malaysian stamp duty, Islamic inheritance rules) in one place, no sign-up, runs in the browser, three languages. A global calculator site cannot truthfully claim this.

## Operating Context
- Vite + React + wouter SPA, Tailwind + shadcn/Radix primitives, deployed on Vercel; locale is a URL prefix (`/en`, `/ms`, `/id`).
- Navigation single source of truth is `NAV_GROUPS` in `client/src/App.tsx`; tool metadata in `client/src/config/tools.ts`; copy in `client/src/lib/i18n.ts`.
- Pages are indexed for SEO; each calculator page renders explanatory content (`CalculatorContent`) below the tool. This content must stay in the DOM.
- Ad slots exist on the home page and globally at the top (production only).

## Capabilities and Constraints
- Calculation logic, URL-state sharing, history, save/share/embed, lead capture and analytics events must not change in a visual redesign.
- Must keep light and dark themes, three locales, print styles, and iOS safe-area handling.
- The Faraid page has its own green/gold theme class (`theme-faraid`).

## Brand Commitments
Name "HelloKalku" with the "HK" mark. Built by amammustofa.com. Brand blue is the existing accent; the user asked for a calm, light look with one accent colour.

## Product Principles
1. The calculator is the product; every screen gets the visitor to it or helps them read its result.
2. One way to do each thing: one navigation model, one list of tools, one result style.
3. Quiet by default. Colour and emphasis are reserved for the primary action and the answer.
4. Numbers are the content: tabular, large where they matter, always with their unit.
5. Local trust comes from specifics (the year of the rates, the source of the rule), not from badges and slogans.

## Accessibility & Inclusion
Phone-first, one-handed use. Body text at least 16px, 4.5:1 contrast, 44px touch targets, visible keyboard focus, reduced-motion respected. RTL is not required. Three-language copy must fit without truncation.
