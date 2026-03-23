import { Clock, Trash2, Calculator, FlaskConical, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HistoryEntry } from "@/lib/history";
import { useLocale } from "@/hooks/use-locale";

const calcIcon: Record<HistoryEntry["calculator"], typeof Calculator> = {
  normal: Calculator,
  scientific: FlaskConical,
  faraid: Scale,
};

const calcLabel: Record<HistoryEntry["calculator"], string> = {
  normal: "Basic",
  scientific: "Scientific",
  faraid: "Faraid",
};

function formatTime(ts: number, locale: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return locale === "id" ? "Baru saja" : "Just now";
  if (diffMin < 60) return locale === "id" ? `${diffMin}m lalu` : `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return locale === "id" ? `${diffHr}j lalu` : `${diffHr}h ago`;
  return d.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", { month: "short", day: "numeric" });
}

interface Props {
  entries: HistoryEntry[];
  onClear: () => void;
  onRemove: (id: string) => void;
  onUseEntry?: (entry: HistoryEntry) => void;
}

export function HistoryPanel({ entries, onClear, onRemove, onUseEntry }: Props) {
  const { t, locale } = useLocale();

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm">{t("common.noHistory")}</p>
        <p className="text-xs mt-1.5 opacity-60">{t("common.historyHint")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-1 pb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("common.history")} ({entries.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
          data-testid="button-clear-history"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          {t("common.clear")}
        </Button>
      </div>
      <ScrollArea className="flex-1 -mx-1">
        <div className="space-y-1 px-1">
          {entries.map((entry) => {
            const Icon = calcIcon[entry.calculator];
            return (
              <div
                key={entry.id}
                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onUseEntry?.(entry)}
                data-testid={`history-entry-${entry.id}`}
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate font-mono">
                    {entry.expression}
                  </p>
                  <p className="text-sm font-semibold font-mono truncate">
                    = {entry.result}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground/60">
                      {calcLabel[entry.calculator]}
                    </span>
                    <span className="text-xs text-muted-foreground/40">
                      {formatTime(entry.timestamp, locale)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(entry.id);
                  }}
                  className="opacity-40 hover:opacity-100 flex-shrink-0 p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all"
                  data-testid={`button-remove-${entry.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
