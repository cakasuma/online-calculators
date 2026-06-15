import { useState } from "react";
import { Share2, Check, Mail, X, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/hooks/use-locale";
import { track, recordServerEvent } from "@/lib/analytics";
import { LeadCaptureCard } from "@/components/LeadCaptureCard";
import { syncStateToUrl, buildShareUrl, type UrlSchema } from "@/lib/urlState";

type Calculator = "salary" | "zakat" | "faraid" | "wasiat" | "normal" | "scientific" | "epf" | "housing" | "tax" | "bmi";

interface ShareButtonProps<T> {
  /** Calculator slug, used for analytics tagging. */
  calculator: Calculator;
  /** Current calculator state that should be shared. */
  state: T;
  /** URL schema describing how to serialize the state. */
  schema: UrlSchema<T>;
  /** Optional className for the trigger button wrapper. */
  className?: string;
}

const FIRST_SHARE_KEY = "calc_first_share_prompted";

function hasBeenPromptedForNewsletter(): boolean {
  try {
    return localStorage.getItem(FIRST_SHARE_KEY) === "1";
  } catch {
    return false;
  }
}

function markPromptedForNewsletter() {
  try {
    localStorage.setItem(FIRST_SHARE_KEY, "1");
  } catch {
    /* noop */
  }
}

export function ShareButton<T>({ calculator, state, schema, className }: ShareButtonProps<T>) {
  const { toast } = useToast();
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const [showNewsletter, setShowNewsletter] = useState(false);

  async function handleShare() {
    // Make sure the visible URL matches what we copy (state may not have been
    // synced yet if the user moved fast).
    syncStateToUrl(state, schema);
    const url = buildShareUrl(state, schema);

    let succeeded = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        succeeded = true;
      } else {
        // Fallback for older browsers / insecure contexts
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        succeeded = document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch {
      succeeded = false;
    }

    track("share_click", { calculator, succeeded });
    recordServerEvent({
      calculator,
      event: "share_click",
      payload: { succeeded },
    });

    if (!succeeded) {
      toast({
        title: t("share.error"),
        description: t("share.errorDesc"),
        variant: "destructive",
      });
      return;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: t("share.copied"),
      description: t("share.copiedDesc"),
    });

    // First-time share: surface a non-blocking newsletter prompt.
    if (!hasBeenPromptedForNewsletter()) {
      markPromptedForNewsletter();
      track("share_first", { calculator });
      // Slight delay so the "Link copied" toast lands first.
      setTimeout(() => setShowNewsletter(true), 350);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="default"
        onClick={handleShare}
        className={`gap-2 font-semibold shadow-sm ${className ?? ""}`}
        data-testid="button-share"
        aria-label={t("share.action")}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span>{t("share.copiedShort")}</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-4 h-4" />
            <span>{t("share.action")}</span>
          </>
        )}
      </Button>

      {showNewsletter && (
        <div
          className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:max-w-sm animate-in slide-in-from-bottom-4"
          role="dialog"
          aria-labelledby="share-newsletter-title"
        >
          <div className="relative rounded-xl border bg-popover text-popover-foreground shadow-2xl ring-1 ring-black/5">
            <button
              type="button"
              onClick={() => setShowNewsletter(false)}
              className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-md hover:bg-muted text-muted-foreground"
              aria-label={t("share.newsletter.dismiss")}
              data-testid="button-newsletter-dismiss"
            >
              <X className="w-4 h-4" />
            </button>
            <LeadCaptureCard
              calculator={calculator}
              intent="newsletter"
              source="first-share"
              title={t("share.newsletter.title")}
              description={t("share.newsletter.desc")}
              ctaLabel={t("share.newsletter.cta")}
              successTitle={t("share.newsletter.successTitle")}
              successMessage={t("share.newsletter.successDesc")}
              icon={<Mail className="w-4 h-4 text-primary" />}
              disclaimer={t("share.newsletter.disclaimer")}
              className="!border-transparent !bg-transparent !shadow-none"
            />
          </div>
        </div>
      )}
    </>
  );
}
