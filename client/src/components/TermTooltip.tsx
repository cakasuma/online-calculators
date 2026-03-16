import { useState, useRef } from "react";
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
  const [open, setOpen] = useState(false);
  // Tracks actual open value synchronously so click handler never reads stale state.
  const openRef = useRef(false);
  // Suppresses the Radix Dismissable Layer's immediate onOpenChange(false) that fires
  // during the same click event that opened the tooltip (reproducible on iOS).
  const suppressCloseRef = useRef(false);

  // Keeps openRef and the React state in sync in one place.
  const setOpenSynced = (v: boolean) => {
    openRef.current = v;
    setOpen(v);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v && suppressCloseRef.current) return;
    setOpenSynced(v);
  };

  const toggleOpen = () => {
    if (!openRef.current) {
      setOpenSynced(true);
      // Guard against the Dismissable Layer closing the tooltip in the same event tick.
      // queueMicrotask clears the flag after all synchronous event handlers have run
      // but before the next macrotask, making it reliable across browsers.
      suppressCloseRef.current = true;
      queueMicrotask(() => {
        suppressCloseRef.current = false;
      });
    } else {
      setOpenSynced(false);
    }
  };

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange} delayDuration={200}>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/40 ${className || ""}`}
          onClick={(e) => {
            // Stop propagation so clicks don't bubble to parent labels/toggles
            e.stopPropagation();
            toggleOpen();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleOpen();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Show info"
        >
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
