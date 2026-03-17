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
  // Mirrors open state synchronously so event handlers never read stale state.
  const openRef = useRef(false);

  const setOpenSynced = (v: boolean) => {
    openRef.current = v;
    setOpen(v);
  };

  return (
    // onOpenChange lets Radix manage desktop hover open/close naturally.
    <Tooltip open={open} onOpenChange={setOpenSynced} delayDuration={200}>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/40 ${className || ""}`}
          onPointerDown={(e) => {
            // Toggle on pointer-down for both mouse and touch (iOS fires pointerdown
            // reliably, unlike click which arrives after synthesized pointer events).
            //
            // For touch: e.preventDefault() serves two purposes via Radix's
            //   composeEventHandlers (which skips Radix's handler when defaultPrevented):
            //   1. Blocks Radix's own onPointerDown handler, which calls
            //      context.onClose() whenever the tooltip is already open —
            //      without this, a tap causes a close→reopen flicker every time.
            //   2. Suppresses the synthesized click event (per Pointer Events spec),
            //      preventing a second toggle from firing in onClick.
            // For mouse: no preventDefault so native text-selection stays intact.
            if (e.pointerType === "touch") {
              e.preventDefault();
            }
            // Stop the event from bubbling to parent labels / Switch toggles.
            e.stopPropagation();
            setOpenSynced(!openRef.current);
          }}
          onClick={(e) => {
            // Block Radix's composed onClick handler (it always calls context.onClose).
            e.preventDefault();
            // Prevent the click from reaching parent labels / Switch toggles.
            e.stopPropagation();
            // The toggle was already applied in onPointerDown; nothing more to do here.
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              // Suppress the synthesized click so we don't double-toggle.
              e.preventDefault();
              e.stopPropagation();
              setOpenSynced(!openRef.current);
            } else if (e.key === "Escape") {
              e.stopPropagation();
              setOpenSynced(false);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Show info"
          aria-expanded={open}
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
