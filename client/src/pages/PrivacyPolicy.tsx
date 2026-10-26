import { useLocale } from "@/hooks/use-locale";
import { CONTACT_EMAIL, OPERATOR_URL, privacySections } from "@/config/legal";

export default function PrivacyPolicy() {
  const { t } = useLocale();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("privacy.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("privacy.lastUpdated")}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          HelloKalku is committed to protecting your privacy. The short version: we do not collect your calculator inputs, we use anonymous analytics, and we may show Google AdSense ads. Read the full policy below.
        </p>
      </header>

      <div className="space-y-6">
        {privacySections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <h2 className="text-base font-semibold">{section.heading}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{section.body}{" "}
              {section.heading === "10. Contact" && (
                <>
                  <a href={OPERATOR_URL} target="_blank" rel="noopener noreferrer" className="underline">{OPERATOR_URL.replace("https://", "")}</a>
                  {CONTACT_EMAIL && <> · <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a></>}
                </>
              )}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
