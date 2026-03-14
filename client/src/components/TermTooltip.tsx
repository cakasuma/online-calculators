import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocale } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";

interface TermTooltipProps {
  termKey: TranslationKey;
  children: React.ReactNode;
  className?: string;
}

export function TermTooltip({ termKey, children, className }: TermTooltipProps) {
  const { t } = useLocale();

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/40 ${className || ""}`}>
          {children}
          <Info className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {t(termKey)}
      </TooltipContent>
    </Tooltip>
  );
}
