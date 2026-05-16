import { useLocale } from "@/hooks/use-locale";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";

const LOCALE_META: Record<Locale, { label: string; short: string; native: string }> = {
  en: { label: "English", short: "EN", native: "English" },
  ms: { label: "Bahasa Malaysia", short: "BM", native: "Bahasa Malaysia" },
  id: { label: "Bahasa Indonesia", short: "ID", native: "Bahasa Indonesia" },
};

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const current = LOCALE_META[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors text-sm font-medium"
          data-testid="button-locale-switch"
          aria-label={`Language: ${current.label}`}
        >
          <Globe className="w-4 h-4" />
          <span>{current.short}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {SUPPORTED_LOCALES.map((l) => {
          const meta = LOCALE_META[l];
          const isActive = l === locale;
          return (
            <DropdownMenuItem
              key={l}
              onClick={() => setLocale(l)}
              data-testid={`menuitem-locale-${l}`}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="flex flex-col">
                <span className="text-sm">{meta.native}</span>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  {meta.short}
                </span>
              </span>
              {isActive && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
