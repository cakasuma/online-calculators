// Bookmark-style saved scenarios — a user names a particular calculator state
// and we keep an entry in localStorage so they can recall it from the history
// drawer. Backed by the same URL-as-source-of-truth model as ShareButton: each
// saved scenario carries the share URL, so opening it just navigates there.

export interface SavedScenario {
  id: string;
  calculator: "salary" | "zakat" | "faraid" | "wasiat" | "normal" | "scientific" | "epf" | "housing" | "tax" | "bmi";
  name: string;
  /** Full shareable URL that recreates the scenario. */
  url: string;
  /** ISO ms timestamp. */
  createdAt: number;
}

const STORAGE_KEY = "calc_saved_scenarios";
const MAX_SCENARIOS = 50;

function safeParse(raw: string | null): SavedScenario[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getSavedScenarios(): SavedScenario[] {
  try {
    return safeParse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function persistSavedScenarios(list: SavedScenario[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_SCENARIOS)));
  } catch {
    /* storage full → silently drop */
  }
}
