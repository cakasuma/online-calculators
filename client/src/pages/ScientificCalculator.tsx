import { useState, useCallback, useEffect } from "react";
import { Delete } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";

interface Props {
  onCalculate: (expression: string, result: string) => void;
}

type Mode = "deg" | "rad";

const scientificFunctions = [
  "sin", "cos", "tan",
  "asin", "acos", "atan",
  "log", "ln", "√",
  "x²", "xʸ", "1/x",
  "|", "n!", "π",
  "e", "(", ")",
];

const numpadButtons = [
  "7", "8", "9", "÷",
  "4", "5", "6", "×",
  "1", "2", "3", "-",
  "0", ".", "⌫", "+",
  "C", "±", "%", "=",
];

const SCI_ARIA_KEY_MAP: Record<string, TranslationKey> = {
  "×": "a11y.calc.multiply",
  "÷": "a11y.calc.divide",
  "±": "a11y.calc.toggleSign",
  "%": "a11y.calc.percent",
  "⌫": "a11y.calc.backspace",
  "C": "a11y.calc.clear",
  "=": "a11y.calc.equals",
  "x²": "a11y.calc.xSquared",
  "xʸ": "a11y.calc.xPowerY",
  "1/x": "a11y.calc.oneOverX",
  "n!": "a11y.calc.factorial",
  "|": "a11y.calc.absoluteValue",
  "√": "a11y.calc.squareRoot",
  "π": "a11y.calc.pi",
  "e": "a11y.calc.euler",
  "(": "a11y.calc.openParen",
  ")": "a11y.calc.closeParen",
  "asin": "a11y.calc.arcsine",
  "acos": "a11y.calc.arccosine",
  "atan": "a11y.calc.arctangent",
};

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export default function ScientificCalculator({ onCalculate }: Props) {
  const { t } = useLocale();
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [mode, setMode] = useState<Mode>("deg");
  const [justEvaluated, setJustEvaluated] = useState(false);

  function toRad(deg: number) {
    return (deg * Math.PI) / 180;
  }

  function evaluate(expr: string): string {
    try {
      let e = expr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/π/g, String(Math.PI))
        .replace(/e(?![0-9])/g, String(Math.E));

      // Handle functions
      const degMode = mode === "deg";
      e = e.replace(/sin\(([^)]+)\)/g, (_, a) =>
        String(Math.sin(degMode ? toRad(parseFloat(a)) : parseFloat(a)))
      );
      e = e.replace(/cos\(([^)]+)\)/g, (_, a) =>
        String(Math.cos(degMode ? toRad(parseFloat(a)) : parseFloat(a)))
      );
      e = e.replace(/tan\(([^)]+)\)/g, (_, a) =>
        String(Math.tan(degMode ? toRad(parseFloat(a)) : parseFloat(a)))
      );
      e = e.replace(/asin\(([^)]+)\)/g, (_, a) =>
        String(degMode ? (Math.asin(parseFloat(a)) * 180) / Math.PI : Math.asin(parseFloat(a)))
      );
      e = e.replace(/acos\(([^)]+)\)/g, (_, a) =>
        String(degMode ? (Math.acos(parseFloat(a)) * 180) / Math.PI : Math.acos(parseFloat(a)))
      );
      e = e.replace(/atan\(([^)]+)\)/g, (_, a) =>
        String(degMode ? (Math.atan(parseFloat(a)) * 180) / Math.PI : Math.atan(parseFloat(a)))
      );
      e = e.replace(/log\(([^)]+)\)/g, (_, a) => String(Math.log10(parseFloat(a))));
      e = e.replace(/ln\(([^)]+)\)/g, (_, a) => String(Math.log(parseFloat(a))));
      e = e.replace(/√\(([^)]+)\)/g, (_, a) => String(Math.sqrt(parseFloat(a))));
      e = e.replace(/([0-9.]+)!\s*/g, (_, n) => String(factorial(parseFloat(n))));
      e = e.replace(/\|([^|]+)\|/g, (_, a) => String(Math.abs(parseFloat(a))));

      if (!/^[0-9+\-*/.() e+\-]+$/.test(e)) return "Error";
      // eslint-disable-next-line no-new-func
      const result = new Function("return " + e)();
      if (!isFinite(result)) return result === Infinity ? "∞" : "Error";
      return parseFloat(result.toFixed(10)).toString();
    } catch {
      return "Error";
    }
  }

  const handleSciFn = useCallback(
    (fn: string) => {
      const val = display === "0" ? "" : display;
      switch (fn) {
        case "x²":
          setDisplay((d) => String(parseFloat(d) ** 2));
          setJustEvaluated(true);
          break;
        case "1/x":
          setDisplay((d) => String(1 / parseFloat(d)));
          setJustEvaluated(true);
          break;
        case "xʸ":
          setExpression(expression + display + "**");
          setDisplay("0");
          setJustEvaluated(false);
          break;
        case "π":
          setDisplay(String(Math.PI));
          setJustEvaluated(true);
          break;
        case "e":
          setDisplay(String(Math.E));
          setJustEvaluated(true);
          break;
        case "(":
          setExpression((ex) => ex + display + "(");
          setDisplay("0");
          break;
        case ")":
          setExpression((ex) => ex + display + ")");
          setDisplay("0");
          break;
        case "n!":
          setDisplay((d) => String(factorial(parseFloat(d))));
          setJustEvaluated(true);
          break;
        case "|": {
          const abs = Math.abs(parseFloat(display));
          setDisplay(String(abs));
          setJustEvaluated(true);
          break;
        }
        default:
          // Trig/log/sqrt — append function call
          setExpression((ex) => ex + fn + "(");
          setDisplay(val || "0");
          break;
      }
    },
    [display, expression]
  );

  const handleKey = useCallback(
    (key: string) => {
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
        const result = evaluate(expr);
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
        setDisplay((d) => String(parseFloat(d) / 100));
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
    [display, expression, justEvaluated, onCalculate, mode]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, string> = {
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

  const sciBtnClass =
    "calc-btn h-12 text-xs font-medium rounded-xl bg-muted/60 hover:bg-muted border transition-all active:scale-95";
  const numBtnClass = (key: string) => {
    const base = "calc-btn h-14 text-base font-semibold rounded-xl transition-all active:scale-95";
    if (key === "=") return `${base} bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm`;
    if (["+", "-", "×", "÷"].includes(key)) return `${base} bg-secondary hover:bg-secondary/80 text-primary font-bold`;
    if (["C", "±", "%"].includes(key)) return `${base} bg-muted hover:bg-muted/80 text-muted-foreground`;
    if (key === "⌫") return `${base} bg-muted hover:bg-muted/80 text-destructive`;
    return `${base} bg-card hover:bg-muted/50 border text-foreground`;
  };

  return (
    <div className="max-w-sm mx-auto w-full min-w-0">
      {/* Display */}
      <div className="mb-3 p-3 sm:p-5 rounded-2xl bg-card border min-h-[96px] flex flex-col justify-end items-end overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 mb-1.5 w-full min-w-0 flex-wrap">
          <div className="flex text-xs rounded-full border overflow-hidden shrink-0" aria-label="angle mode">
            <button
              onClick={() => setMode("deg")}
              className={`px-2.5 py-1 font-medium transition-colors ${mode === "deg" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              aria-pressed={mode === "deg"}
            >
              DEG
            </button>
            <button
              onClick={() => setMode("rad")}
              className={`px-2.5 py-1 font-medium transition-colors ${mode === "rad" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              aria-pressed={mode === "rad"}
            >
              RAD
            </button>
          </div>
          {expression && (
            <div className="text-sm text-muted-foreground font-mono flex-1 overflow-x-auto text-right whitespace-nowrap scrollbar-none">
              {expression}
            </div>
          )}
        </div>
        <p
          className="font-mono font-semibold text-right break-all max-w-full"
          style={{ fontSize: `clamp(1.1rem, ${display.length > 12 ? "4.5vw" : display.length > 8 ? "6vw" : "9vw"}, ${display.length > 12 ? "1.35rem" : display.length > 8 ? "1.75rem" : "2.5rem"})` }}
          data-testid="sci-display-main"
        >
          {display}
        </p>
      </div>

      {/* Scientific function grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
        {scientificFunctions.map((fn) => (
          <button
            key={fn}
            onClick={() => handleSciFn(fn)}
            className={sciBtnClass}
            aria-label={SCI_ARIA_KEY_MAP[fn] ? t(SCI_ARIA_KEY_MAP[fn]) : undefined}
            data-testid={`sci-btn-${fn}`}
          >
            {fn}
          </button>
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        {numpadButtons.map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            className={numBtnClass(key)}
            aria-label={SCI_ARIA_KEY_MAP[key] ? t(SCI_ARIA_KEY_MAP[key]) : undefined}
            data-testid={`btn-${key}`}
          >
            {key === "⌫" ? <Delete className="w-5 h-5" aria-hidden="true" /> : key}
          </button>
        ))}
      </div>
    </div>
  );
}
