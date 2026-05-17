import { useEffect, useState } from "react";
import {
  getSavedScenarios,
  persistSavedScenarios,
  type SavedScenario,
} from "@/lib/savedScenarios";

const EVENT = "calc-saved-scenarios-change";

function emitChange() {
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* noop */
  }
}

export function useSavedScenarios() {
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => getSavedScenarios());

  // Cross-component sync: any SaveButton add fires the event so the panel
  // re-reads the list without having to thread props all the way down.
  useEffect(() => {
    const refresh = () => setScenarios(getSavedScenarios());
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const add = (
    calculator: SavedScenario["calculator"],
    name: string,
    url: string,
  ): SavedScenario => {
    const entry: SavedScenario = {
      id: crypto.randomUUID(),
      calculator,
      name,
      url,
      createdAt: Date.now(),
    };
    const next = [entry, ...scenarios];
    persistSavedScenarios(next);
    setScenarios(next);
    emitChange();
    return entry;
  };

  const remove = (id: string) => {
    const next = scenarios.filter((s) => s.id !== id);
    persistSavedScenarios(next);
    setScenarios(next);
    emitChange();
  };

  const clear = () => {
    persistSavedScenarios([]);
    setScenarios([]);
    emitChange();
  };

  return { scenarios, add, remove, clear };
}
