import { useLocale } from "@/hooks/use-locale";
import { CONTACT_EMAIL, OPERATOR_URL, companyPages } from "@/config/legal";

export default function CompanyPage({ page }: { page: "about" | "contact" }) {
  const { locale } = useLocale();
  const content = companyPages[page][locale];

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
      {content.paragraphs.map((paragraph) => <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">{paragraph}</p>)}
      <p className="text-sm leading-relaxed">
        <a href={OPERATOR_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          amammustofa.com
        </a>
        {CONTACT_EMAIL && <> · <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">{CONTACT_EMAIL}</a></>}
      </p>
    </article>
  );
}
