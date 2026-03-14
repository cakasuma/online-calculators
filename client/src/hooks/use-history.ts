import { useState, useEffect } from "react";
import type { HistoryEntry } from "@/lib/history";

const STORAGE_KEY = "calc-history";
const MAX_ENTRIES = 100;

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const add = (calculator: HistoryEntry["calculator"], expression: string, result: string) => {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      calculator,
      expression,
      result,
      timestamp: Date.now(),
    };
    setEntries((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));
  };

  const clear = () => setEntries([]);
  const remove = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return { entries, add, clear, remove };
}
