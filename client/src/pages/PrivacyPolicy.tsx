import { useLocale } from "@/hooks/use-locale";

export default function PrivacyPolicy() {
  const { t } = useLocale();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("privacy.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("privacy.lastUpdated")}</p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>{t("privacy.p1")}</p>
        <p>{t("privacy.p2")}</p>
        <p>{t("privacy.p3")}</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">{t("privacy.contact.title")}</h2>
        <p>
          {t("privacy.contact.text")}{" "}
          <a href="https://hellokalku.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            hellokalku.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
