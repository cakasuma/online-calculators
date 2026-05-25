import { useState, useCallback, useEffect } from "react";
import { Delete } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { recordServerEvent, track } from "@/lib/analytics";
import type { TranslationKey } from "@/lib/i18n";

interface Props {
  onCalculate: (expression: string, result: string) => void;
}

type CalcKey =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "." | "+" | "-" | "×" | "÷" | "=" | "C" | "⌫" | "±" | "%";

const BUTTONS: CalcKey[][] = [
  ["C", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "⌫", "="],
];

const ARIA_KEY_MAP: Partial<Record<CalcKey, TranslationKey>> = {
  "×": "a11y.calc.multiply",
  "÷": "a11y.calc.divide",
  "±": "a11y.calc.toggleSign",
  "%": "a11y.calc.percent",
  "⌫": "a11y.calc.backspace",
  "C": "a11y.calc.clear",
  "=": "a11y.calc.equals",
};

function safeEval(expr: string): string {
  try {
    // Replace × and ÷ for display
    const clean = expr.replace(/×/g, "*").replace(/÷/g, "/");
    // Only allow safe characters
    if (!/^[0-9+\-*/.() %]+$/.test(clean)) return "Error";
    // eslint-disable-next-line no-new-func
    const result = new Function("return " + clean)();
    if (!isFinite(result)) return "Error";
    // Format: avoid floating point issues
    const str = parseFloat(result.toFixed(10)).toString();
    return str;
  } catch {
    return "Error";
  }
}

function formatDisplayResult(raw: string): string {
  const n = parseFloat(raw);
  if (isNaN(n) || raw === "Error" || raw === "∞") return raw;
  const [intPart, decPart] = raw.split(".");
  const thousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${thousands}.${decPart}` : thousands;
}

export default function NormalCalculator({ onCalculate }: Props) {
  const { t } = useLocale();
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [justEvaluated, setJustEvaluated] = useState(false);

  const handleKey = useCallback(
    (key: CalcKey) => {
      if (key === "C") {
        setDisplay("0");
        setExpression("");
        setJustEvaluated(false);
        return;
      }

      if (key === "⌫") {
        if (justEvaluated) {
          setDisplay("0");
          setExpression("");
          setJustEvaluated(false);
        } else {
          setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
        }
        return;
      }

      if (key === "=") {
        const expr = expression + display;
        const result = safeEval(expr);
        onCalculate(expr, result);
        track("calculator_complete", { calculator: "normal", expression: expr, result });
        recordServerEvent({ calculator: "normal", event: "calculator_complete", payload: { expression: expr, result } });
        setExpression("");
        setDisplay(result);
        setJustEvaluated(true);
        return;
      }

      if (key === "±") {
        setDisplay((d) => (d.startsWith("-") ? d.slice(1) : "-" + d));
        return;
      }

      if (key === "%") {
        const val = parseFloat(display);
        if (!isNaN(val)) setDisplay((val / 100).toString());
        return;
      }

      const isOperator = ["+", "-", "×", "÷"].includes(key);

      if (isOperator) {
        if (justEvaluated) {
          setExpression(display + key);
          setDisplay("0");
          setJustEvaluated(false);
        } else {
          setExpression(expression + display + key);
          setDisplay("0");
        }
        return;
      }

      // Digit or decimal
      if (justEvaluated) {
        setDisplay(key === "." ? "0." : key);
        setExpression("");
        setJustEvaluated(false);
        return;
      }

      if (key === ".") {
        if (!display.includes(".")) setDisplay((d) => d + ".");
        return;
      }

      setDisplay((d) => (d === "0" ? key : d + key));
    },
    [display, expression, justEvaluated, onCalculate]
  );

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, CalcKey> = {
        "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
        "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
        "+": "+", "-": "-", "*": "×", "/": "÷",
        ".": ".", ",": ".",
        "Enter": "=", "=": "=",
        "Backspace": "⌫",
        "Escape": "C",
        "%": "%",
      };
      if (map[e.key]) {
        e.preventDefault();
        handleKey(map[e.key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const btnClass = (key: CalcKey) => {
    const base = "calc-btn h-16 text-base";
    if (key === "=") return `${base} bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:brightness-110`;
    if (["+", "-", "×", "÷"].includes(key)) return `${base} bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-lg`;
    if (key === "C") return `${base} bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/50`;
    if (["±", "%"].includes(key)) return `${base} bg-slate-100 dark:bg-muted/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-muted border border-slate-200/80 dark:border-border`;
    if (key === "⌫") return `${base} bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/50`;
    return `${base} bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted/40 border border-slate-200 dark:border-border text-foreground shadow-sm`;
  };

  return (
    <div className="max-w-sm mx-auto w-full">
      {/* Display */}
      <div className="mb-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border border-slate-700/50 dark:border-slate-800 min-h-[100px] flex flex-col justify-end items-end overflow-hidden shadow-lg">
        {expression && (
          <div className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-mono mb-1 w-full overflow-x-auto text-right whitespace-nowrap scrollbar-none">
            {expression}
          </div>
        )}
        <p
          className="font-mono font-semibold text-right break-all max-w-full text-white"
          style={{ fontSize: `clamp(1.25rem, ${display.length > 12 ? "5vw" : display.length > 8 ? "7vw" : "10vw"}, ${display.length > 12 ? "1.5rem" : display.length > 8 ? "2rem" : "2.75rem"})` }}
          data-testid="display-main"
        >
          {justEvaluated ? formatDisplayResult(display) : display}
        </p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        {BUTTONS.flat().map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            className={btnClass(key)}
            aria-label={ARIA_KEY_MAP[key] ? t(ARIA_KEY_MAP[key]!) : undefined}
            data-testid={`btn-${key}`}
          >
            {key === "⌫" ? <Delete className="w-5 h-5" aria-hidden="true" /> : key}
          </button>
        ))}
      </div>
    </div>
  );
}
