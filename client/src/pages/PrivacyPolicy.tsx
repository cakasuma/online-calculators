import { useLocale } from "@/hooks/use-locale";

const SECTIONS = [
  {
    heading: "1. Overview",
    body: "HelloKalku is a free online calculator and financial-planning guide for users in Malaysia and Southeast Asia. This Privacy Policy explains what information we collect, what we do not collect, and how we protect your privacy when you use hellokalku.com.",
  },
  {
    heading: "2. Calculator Inputs Stay in Your Browser",
    body: "All calculations — salary, EPF projections, zakat, faraid inheritance, and wasiat planning — are performed entirely in your browser using JavaScript. Your salary figures, asset values, heir details, and any other inputs you enter are never transmitted to our servers. They exist only in your browser's memory while the page is open and are discarded when you close or refresh the page. Saved scenarios and calculation history are stored in your browser's localStorage only on your device.",
  },
  {
    heading: "3. Analytics",
    body: "We use Vercel Analytics to collect anonymous, aggregate statistics about page views and navigation patterns. Vercel Analytics does not use cookies, does not track individual users across sessions, and does not collect personally identifiable information. The data collected includes anonymised page URLs, referrer information, browser type, and country-level location. This data helps us understand which calculators are most used so we can improve them.",
  },
  {
    heading: "4. Advertising (Google AdSense)",
    body: "HelloKalku is supported by Google AdSense advertisements. Google AdSense may use cookies and similar technologies to serve ads based on your prior visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the internet. You may opt out of personalised advertising by visiting Google's Ads Settings at adssettings.google.com. If you have not opted out, third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites.",
  },
  {
    heading: "5. Optional Lead Capture Forms",
    body: "Some calculator pages include optional email collection forms (for example, a newsletter sign-up or a request for a free consultation). These forms are clearly labelled and entirely voluntary. If you submit your email address, it is used only for the stated purpose and is never sold to third parties. You can unsubscribe from any email we send using the unsubscribe link in that email.",
  },
  {
    heading: "6. Cookies and Local Storage",
    body: "We use browser localStorage to store: (a) your selected language preference, (b) your dark/light mode preference, (c) calculation history and saved scenarios you have explicitly created. No personally identifiable information is stored in localStorage. We do not set first-party cookies ourselves, though Google AdSense may set third-party advertising cookies as described in Section 4.",
  },
  {
    heading: "7. Children's Privacy",
    body: "HelloKalku is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has submitted personal information to us, please contact us and we will delete it promptly.",
  },
  {
    heading: "8. Your Rights and Choices",
    body: "You can clear all locally stored data (history, preferences) at any time by clearing your browser's site data for hellokalku.com. To opt out of Google personalised advertising, visit adssettings.google.com. If you submitted your email to one of our lead-capture forms and want it removed, email us using the contact details below.",
  },
  {
    heading: "9. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. Continued use of HelloKalku after changes constitutes your acceptance of the revised policy.",
  },
  {
    heading: "10. Contact",
    body: "For privacy-related questions or requests, please contact us via hellokalku.com. We aim to respond within 5 business days.",
  },
];

export default function PrivacyPolicy() {
  const { t } = useLocale();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("privacy.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("privacy.lastUpdated")}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          HelloKalku is committed to protecting your privacy. The short version: we do not collect your calculator inputs, we use anonymous analytics, and we show Google AdSense ads. Read the full policy below.
        </p>
      </header>

      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.heading} className="space-y-2">
            <h2 className="text-base font-semibold">{s.heading}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
