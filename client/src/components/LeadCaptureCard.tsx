import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Loader2, Mail, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { getUtmParams, recordServerEvent, track } from "@/lib/analytics";
import { useLocale } from "@/hooks/use-locale";

type Calculator = "faraid" | "wasiat" | "zakat" | "salary" | "normal" | "scientific" | "epf";
type Intent = "consult" | "reminder" | "partner" | "newsletter" | "report";

export interface LeadCaptureCardProps {
  calculator: Calculator;
  intent: Intent;
  title: string;
  description: string;
  ctaLabel: string;
  successTitle?: string;
  successMessage?: string;
  emailPlaceholder?: string;
  showPhone?: boolean;
  phonePlaceholder?: string;
  /** Returns the snapshot of calculator state to attach to the lead. Called only on submit. */
  getContext?: () => Record<string, unknown>;
  /** Fine-grained label for analytics events (e.g. "consult-shariah-lawyer"). Falls back to intent. */
  source?: string;
  icon?: ReactNode;
  className?: string;
  /** Extra disclaimer text shown below the form. */
  disclaimer?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadCaptureCard({
  calculator,
  intent,
  title,
  description,
  ctaLabel,
  successTitle = "Thanks — we'll be in touch.",
  successMessage = "Check your inbox in the next few minutes.",
  emailPlaceholder = "you@example.com",
  showPhone = false,
  phonePlaceholder = "+60 12 345 6789",
  getContext,
  source,
  icon,
  className,
  disclaimer,
}: LeadCaptureCardProps) {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    const sourceLabel = source ?? intent;
    track("cta_view", { calculator, intent, source: sourceLabel });
    recordServerEvent({
      calculator,
      event: "cta_view",
      payload: { intent, source: sourceLabel },
    });
  }, [calculator, intent, source]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setStatus("error");
      setErrorMessage(t("lead.errorEmail"));
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    const sourceLabel = source ?? intent;
    track("cta_click", { calculator, intent, source: sourceLabel });

    try {
      let context: Record<string, unknown> | undefined;
      try {
        context = getContext?.();
      } catch {
        context = undefined;
      }

      const locale =
        typeof document !== "undefined" ? document.documentElement.lang || undefined : undefined;

      await apiRequest("POST", "/api/leads", {
        email: trimmedEmail,
        phone: phone.trim() || undefined,
        calculator,
        intent,
        locale,
        source: sourceLabel,
        utm: getUtmParams(),
        context,
      });

      setStatus("success");
      track("lead_submit_success", { calculator, intent, source: sourceLabel });
      recordServerEvent({
        calculator,
        event: "lead_submit_success",
        payload: { intent, source: sourceLabel },
      });
    } catch (err) {
      setStatus("error");
      setErrorMessage(t("lead.errorGeneric"));
      track("lead_submit_error", { calculator, intent, source: sourceLabel });
    }
  }

  if (status === "success") {
    return (
      <Card className={`border-emerald-300/60 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20 ${className ?? ""}`}>
        <CardContent className="p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{successTitle}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{successMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-primary/25 bg-primary/[0.04] print:hidden ${className ?? ""}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            {icon ?? <Mail className="w-4 h-4 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-snug">{title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <Input
            type="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={emailPlaceholder}
            disabled={status === "submitting"}
            aria-label="Email address"
            className="h-10"
          />
          {showPhone && (
            <Input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={phonePlaceholder}
              disabled={status === "submitting"}
              aria-label="Phone (optional)"
              className="h-10"
            />
          )}
          <Button
            type="submit"
            disabled={status === "submitting"}
            className="w-full gap-2 h-10"
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("lead.sending")}
              </>
            ) : (
              ctaLabel
            )}
          </Button>
          {status === "error" && errorMessage && (
            <div className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {disclaimer && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">{disclaimer}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
