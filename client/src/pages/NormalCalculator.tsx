import { useState, useCallback, useEffect } from "react";
import { Delete } from "lucide-react";

interface Props {
  onCalculate: (expression: string, result: string) => void;
}

type CalcKey =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "." | "+" | "-" | "*" | "/" | "=" | "C" | "⌫" | "±" | "%";

const BUTTONS: CalcKey[][] = [
  ["C", "±", "%", "/"],
  ["7", "8", "9", "*"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "⌫", "="],
];

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

export default function NormalCalculator({ onCalculate }: Props) {
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

      const isOperator = ["+", "-", "*", "/"].includes(key);

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
        "+": "+", "-": "-", "*": "*", "/": "/",
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
    const base = "calc-btn h-14 text-sm font-medium rounded-xl transition-all active:scale-95";
    if (key === "=") return `${base} bg-primary text-primary-foreground hover:bg-primary/90 col-span-1`;
    if (["+", "-", "*", "/"].includes(key)) return `${base} bg-secondary hover:bg-secondary/80 text-primary font-bold`;
    if (["C", "±", "%"].includes(key)) return `${base} bg-muted hover:bg-muted/80 text-muted-foreground`;
    if (key === "⌫") return `${base} bg-muted hover:bg-muted/80 text-destructive`;
    return `${base} bg-card hover:bg-muted/50 border`;
  };

  return (
    <div className="max-w-xs mx-auto">
      {/* Display */}
      <div className="mb-3 p-4 rounded-2xl bg-card border min-h-[80px] flex flex-col justify-end items-end overflow-hidden">
        {expression && (
          <p className="text-xs text-muted-foreground font-mono mb-1 truncate max-w-full">
            {expression}
          </p>
        )}
        <p
          className="font-mono font-semibold text-right break-all"
          style={{ fontSize: display.length > 12 ? "1.25rem" : display.length > 8 ? "1.75rem" : "2.25rem" }}
          data-testid="display-main"
        >
          {display}
        </p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {BUTTONS.flat().map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            className={btnClass(key)}
            data-testid={`btn-${key}`}
          >
            {key === "⌫" ? <Delete className="w-4 h-4" /> : key}
          </button>
        ))}
      </div>
    </div>
  );
}
