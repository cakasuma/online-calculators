import { useLocale } from "@/hooks/use-locale";

export default function TermsOfUse() {
  const { t } = useLocale();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("terms.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("terms.lastUpdated")}</p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>{t("terms.p1")}</p>
        <p>{t("terms.p2")}</p>
        <p>{t("terms.p3")}</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">{t("terms.contact.title")}</h2>
        <p>
          {t("terms.contact.text")}{" "}
          <a href="https://hellokalku.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            hellokalku.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
