import { useState } from "react";
import { Bookmark, Check, X, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/hooks/use-locale";
import { useSavedScenarios } from "@/hooks/use-saved";
import { track, recordServerEvent } from "@/lib/analytics";
import { LeadCaptureCard } from "@/components/LeadCaptureCard";
import { syncStateToUrl, buildShareUrl, type UrlSchema } from "@/lib/urlState";

type Calculator = "salary" | "zakat" | "faraid" | "wasiat" | "normal" | "scientific" | "epf";

interface SaveButtonProps<T> {
  calculator: Calculator;
  state: T;
  schema: UrlSchema<T>;
  /** Optional default name suggestion (e.g. "Salary scenario, RM 6000/mo"). */
  defaultName?: string;
  className?: string;
}

const FIRST_SAVE_KEY = "calc_first_save_prompted";

function hasBeenPromptedForNewsletter(): boolean {
  try {
    return localStorage.getItem(FIRST_SAVE_KEY) === "1";
  } catch {
    return false;
  }
}
function markPromptedForNewsletter() {
  try {
    localStorage.setItem(FIRST_SAVE_KEY, "1");
  } catch {
    /* noop */
  }
}

export function SaveButton<T>({
  calculator,
  state,
  schema,
  defaultName,
  className,
}: SaveButtonProps<T>) {
  const { toast } = useToast();
  const { t } = useLocale();
  const { add } = useSavedScenarios();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState(defaultName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showNewsletter, setShowNewsletter] = useState(false);

  function openDialog() {
    setName(defaultName ?? `${calculator} – ${new Date().toLocaleDateString()}`);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (submitting) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);

    // Make sure the URL reflects current state before we snapshot it.
    syncStateToUrl(state, schema);
    const url = buildShareUrl(state, schema);
    add(calculator, trimmed, url);

    track("scenario_save", { calculator });
    recordServerEvent({ calculator, event: "scenario_save", payload: { name: trimmed } });

    setSubmitting(false);
    setDialogOpen(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);

    toast({
      title: t("save.saved"),
      description: t("save.savedDesc"),
    });

    if (!hasBeenPromptedForNewsletter()) {
      markPromptedForNewsletter();
      track("scenario_save_first", { calculator });
      setTimeout(() => setShowNewsletter(true), 350);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={openDialog}
        className={`gap-2 font-semibold ${className ?? ""}`}
        data-testid="button-save-scenario"
        aria-label={t("save.action")}
      >
        {savedFlash ? (
          <>
            <Check className="w-4 h-4" />
            <span>{t("save.savedShort")}</span>
          </>
        ) : (
          <>
            <Bookmark className="w-4 h-4" />
            <span>{t("save.action")}</span>
          </>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("save.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("save.dialogDesc")}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-3"
          >
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("save.namePlaceholder")}
              maxLength={80}
              data-testid="input-scenario-name"
            />
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                {t("save.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={submitting || !name.trim()}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
                {t("save.confirm")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showNewsletter && (
        <div
          className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:max-w-sm animate-in slide-in-from-bottom-4"
          role="dialog"
        >
          <div className="relative rounded-xl border bg-popover text-popover-foreground shadow-2xl ring-1 ring-black/5">
            <button
              type="button"
              onClick={() => setShowNewsletter(false)}
              className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-md hover:bg-muted text-muted-foreground"
              aria-label={t("share.newsletter.dismiss")}
            >
              <X className="w-4 h-4" />
            </button>
            <LeadCaptureCard
              calculator={calculator}
              intent="newsletter"
              source="first-save"
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
