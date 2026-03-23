import { useLocale } from "@/hooks/use-locale";
import { Globe } from "lucide-react";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "id" : "en")}
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors text-sm font-medium"
      data-testid="button-locale-switch"
      title={locale === "en" ? "Switch to Bahasa Indonesia" : "Switch to English"}
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase">{locale}</span>
    </button>
  );
}
