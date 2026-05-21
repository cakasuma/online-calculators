import { useLocale } from "@/hooks/use-locale";

const SECTIONS = [
  {
    heading: "1. About HelloKalku",
    body: "HelloKalku (hellokalku.com) is a free online calculator platform providing salary, EPF retirement, zakat, faraid inheritance, wasiat planning, and general math calculators for users in Malaysia and Southeast Asia. HelloKalku is operated by an independent developer and is not affiliated with any Malaysian government agency, KWSP/EPF, LHDN, PERKESO, or any Islamic religious authority.",
  },
  {
    heading: "2. Acceptance of Terms",
    body: "By accessing or using HelloKalku you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree, please do not use this site. We reserve the right to update these terms at any time; continued use after changes are posted constitutes acceptance of the revised terms.",
  },
  {
    heading: "3. Calculator Accuracy and Disclaimer",
    body: "All calculators on HelloKalku provide estimates for informational and educational purposes only. Results are based on statutory rates and guidelines that were current at the time of the last update but may not reflect the most recent changes in legislation, tax regulations, or official rates. Specifically: (a) Salary and PCB estimates do not constitute official payroll advice — your employer's payroll system and LHDN's official e-PCB tool are the authoritative sources. (b) EPF projections are illustrative and depend on dividend rates that are declared annually by KWSP and may differ from the rate used in the calculation. (c) Zakat estimates are for reference only; consult your local zakat authority for official assessment and payment. (d) Faraid and Wasiat content is for educational purposes; consult a qualified Islamic scholar, solicitor, or certified estate planner for legally binding inheritance and will arrangements. You are solely responsible for verifying all results and seeking qualified professional advice before making financial, legal, or religious decisions.",
  },
  {
    heading: "4. No Professional Advice",
    body: "Nothing on HelloKalku constitutes financial advice, legal advice, tax advice, or religious (fatwa) advice. The calculators are tools to help you understand numbers and concepts — not substitutes for professional consultation.",
  },
  {
    heading: "5. Intellectual Property",
    body: "All content, design, code, and materials on HelloKalku are the property of the site operator or its licensors and are protected by intellectual property laws. You may use HelloKalku for personal, non-commercial purposes. You may not reproduce, redistribute, or sell any part of this site without prior written permission. Third-party tool names, logos, and trademarks mentioned on this site (EPF, KWSP, LHDN, SOCSO, etc.) belong to their respective owners.",
  },
  {
    heading: "6. Embed Widgets",
    body: "HelloKalku offers free embeddable calculator widgets for third-party websites. By embedding a HelloKalku widget you agree to display it without modification, not to use it for illegal or misleading purposes, and to credit HelloKalku visibly on the embedding page. We reserve the right to discontinue or modify the embed service at any time.",
  },
  {
    heading: "7. Third-Party Services",
    body: "HelloKalku uses third-party services including Google AdSense for advertising, Vercel Analytics for anonymous usage statistics, and Vercel for hosting. Your interactions with those services are governed by their respective terms and privacy policies. We are not responsible for the practices of any third-party services.",
  },
  {
    heading: "8. Limitation of Liability",
    body: "To the maximum extent permitted by applicable law, HelloKalku and its operator shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of or reliance on this site or its calculators, including but not limited to financial loss, tax penalties, or incorrect estate distribution. Your use of HelloKalku is entirely at your own risk.",
  },
  {
    heading: "9. Availability",
    body: "We aim to keep HelloKalku available at all times but do not guarantee uninterrupted access. We may update, modify, or discontinue any tool or feature at any time without notice.",
  },
  {
    heading: "10. Governing Law",
    body: "These Terms of Use are governed by the laws of Malaysia. Any disputes arising from your use of this site shall be subject to the exclusive jurisdiction of the courts of Malaysia.",
  },
  {
    heading: "11. Contact",
    body: "For questions about these Terms, please contact us via hellokalku.com. We aim to respond within 5 business days.",
  },
];

export default function TermsOfUse() {
  const { t } = useLocale();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("terms.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("terms.lastUpdated")}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Please read these Terms of Use carefully before using HelloKalku. By using this site you agree to these terms.
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
