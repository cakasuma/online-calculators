export interface HistoryEntry {
  id: string;
  calculator: "normal" | "scientific" | "faraid";
  expression: string;
  result: string;
  timestamp: number;
}

const STORAGE_KEY = "calc_history";
const MAX_ENTRIES = 100;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addHistoryEntry(
  calculator: HistoryEntry["calculator"],
  expression: string,
  result: string
): HistoryEntry {
  const entry: HistoryEntry = {
    id: generateId(),
    calculator,
    expression,
    result,
    timestamp: Date.now(),
  };
  const history = getHistory();
  history.unshift(entry);
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // storage full — silently fail
  }
  return entry;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

export function deleteHistoryEntry(id: string): void {
  const history = getHistory().filter((e) => e.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // noop
  }
}
