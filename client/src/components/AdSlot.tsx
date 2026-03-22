import { cn } from "@/lib/utils";

interface AdSlotProps {
  id: string;
  className?: string;
  /** "banner" = 728×90-style wide, "rectangle" = 300×250-style square */
  variant?: "banner" | "rectangle";
}

/**
 * Placeholder component for future ad network integration (e.g. Google AdSense).
 * Replace the inner div content with an <ins class="adsbygoogle"> tag when ready.
 */
export function AdSlot({ id, className, variant = "banner" }: AdSlotProps) {
  return (
    <div
      id={id}
      className={cn(
        "ad-slot w-full rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 flex items-center justify-center text-xs text-muted-foreground/40 select-none",
        variant === "banner" ? "min-h-[60px]" : "min-h-[120px]",
        className
      )}
      aria-hidden="true"
    >
      Advertisement
    </div>
  );
}
