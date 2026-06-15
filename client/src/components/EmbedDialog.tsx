import { useMemo, useState } from "react";
import { Code2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/hooks/use-locale";
import { SITE_ORIGIN } from "@/config/seo";

type Calculator = "salary" | "zakat" | "faraid" | "normal" | "scientific" | "epf" | "housing" | "tax" | "bmi";

interface EmbedDialogProps {
  calculator: Calculator;
  className?: string;
}

export function EmbedDialog({ calculator, className }: EmbedDialogProps) {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // If we're already inside an embed iframe (path starts with /embed/), do not
  // surface the Embed action — a partner reading their own embed shouldn't see
  // recursive "embed me!" UI.
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/embed/")) {
    return null;
  }

  const embedSrc = `${SITE_ORIGIN}/embed/${calculator}?locale=${locale}`;
  const iframeSnippet = useMemo(
    () =>
      `<iframe\n  src="${embedSrc}"\n  data-hellokalku="${calculator}"\n  width="100%"\n  height="800"\n  style="border:0"\n  loading="lazy"\n  title="HelloKalku ${calculator} calculator"\n></iframe>\n<script async src="${SITE_ORIGIN}/embed.js"></script>`,
    [embedSrc, calculator],
  );

  async function copy(text: string, key: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
      toast({ title: t("embed.copied") });
    } catch {
      toast({ title: t("embed.copyError"), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 text-xs ${className ?? ""}`}
          data-testid="button-open-embed"
        >
          <Code2 className="w-3.5 h-3.5" />
          {t("embed.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("embed.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("embed.dialogDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">{t("embed.htmlSnippet")}</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copy(iframeSnippet, "iframe")}
                className="gap-1.5 h-7"
              >
                {copiedKey === "iframe" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedKey === "iframe" ? t("embed.copied") : t("embed.copy")}
              </Button>
            </div>
            <pre className="text-xs bg-muted/60 border rounded-lg p-3 overflow-x-auto whitespace-pre">
              <code>{iframeSnippet}</code>
            </pre>
            <p className="text-xs text-muted-foreground">{t("embed.snippetHint")}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">{t("embed.urlOnly")}</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copy(embedSrc, "url")}
                className="gap-1.5 h-7"
              >
                {copiedKey === "url" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedKey === "url" ? t("embed.copied") : t("embed.copy")}
              </Button>
            </div>
            <pre className="text-xs bg-muted/60 border rounded-lg p-3 overflow-x-auto whitespace-pre">
              <code>{embedSrc}</code>
            </pre>
            <p className="text-xs text-muted-foreground">{t("embed.urlHint")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
