import { useState, useCallback } from "react";
import {
  getHistory,
  addHistoryEntry,
  clearHistory,
  deleteHistoryEntry,
  type HistoryEntry,
} from "@/lib/history";

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => getHistory());

  const refresh = useCallback(() => {
    setEntries(getHistory());
  }, []);

  const add = useCallback(
    (calculator: HistoryEntry["calculator"], expression: string, result: string) => {
      addHistoryEntry(calculator, expression, result);
      refresh();
    },
    [refresh]
  );

  const clear = useCallback(() => {
    clearHistory();
    refresh();
  }, [refresh]);

  const remove = useCallback(
    (id: string) => {
      deleteHistoryEntry(id);
      refresh();
    },
    [refresh]
  );

  return { entries, add, clear, remove, refresh };
}
