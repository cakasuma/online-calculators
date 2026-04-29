import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  id: string;
  className?: string;
  /** "banner" = 728×90-style wide, "rectangle" = 300×250-style square */
  variant?: "banner" | "rectangle";
  slot?: string;
  client?: string;
  enabled?: boolean;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ id, className, variant = "banner", slot, client, enabled = true }: AdSlotProps) {
  const isConfigured = Boolean(enabled && slot && client);

  useEffect(() => {
    if (!isConfigured) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Noop: ad blockers or missing network scripts should not break the UI
    }
  }, [isConfigured, slot, client]);

  if (!isConfigured) {
    return (
      <div
        id={id}
        className={cn(
          "ad-slot w-full rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 flex items-center justify-center text-xs text-muted-foreground/40 select-none",
          variant === "banner" ? "min-h-[60px]" : "min-h-[120px]",
          className,
        )}
        aria-hidden="true"
      >
        Advertisement
      </div>
    );
  }

  return (
    <div
      id={id}
      className={cn(
        "ad-slot w-full overflow-hidden rounded-lg border border-muted-foreground/20 bg-muted/5",
        variant === "banner" ? "min-h-[60px]" : "min-h-[120px]",
        className,
      )}
    >
      <ins
        className="adsbygoogle block w-full"
        style={{
          minHeight: variant === "banner" ? "60px" : "120px",
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
