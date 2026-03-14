import { useState, useCallback, useEffect } from "react";
import { Delete } from "lucide-react";

interface Props {
  onCalculate: (expression: string, result: string) => void;
}

export default function NormalCalculator({ onCalculate }: Props) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const clear = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setLastResult(null);
    setWaitingForOperand(false);
  }, []);

  const handleDigit = useCallback(
    (digit: string) => {
      if (lastResult !== null) {
        setDisplay(digit);
        setExpression("");
        setLastResult(null);
        setWaitingForOperand(false);
        return;
      }
      if (waitingForOperand) {
        setDisplay(digit);
        setWaitingForOperand(false);
      } else {
        setDisplay((prev) => (prev === "0" ? digit : prev + digit));
      }
    },
    [waitingForOperand, lastResult]
  );

  const handleDecimal = useCallback(() => {
    if (lastResult !== null) {
      setDisplay("0.");
      setExpression("");
      setLastResult(null);
      setWaitingForOperand(false);
      return;
    }
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay((prev) => prev + ".");
    }
  }, [display, waitingForOperand, lastResult]);

  const handleOperator = useCallback(
    (op: string) => {
      const displaySymbol = op === "*" ? "×" : op === "/" ? "÷" : op;
      if (lastResult !== null) {
        setExpression(lastResult + " " + displaySymbol + " ");
        setLastResult(null);
        setWaitingForOperand(true);
        return;
      }
      setExpression((prev) => prev + display + " " + displaySymbol + " ");
      setWaitingForOperand(true);
    },
    [display, lastResult]
  );

  const handlePercent = useCallback(() => {
    const val = parseFloat(display);
    if (!isNaN(val)) {
      const result = val / 100;
      setDisplay(String(result));
    }
  }, [display]);

  const handleToggleSign = useCallback(() => {
    setDisplay((prev) => {
      if (prev === "0") return prev;
      return prev.startsWith("-") ? prev.slice(1) : "-" + prev;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    if (lastResult !== null) {
      clear();
      return;
    }
    setDisplay((prev) => {
      if (prev.length <= 1 || (prev.length === 2 && prev.startsWith("-"))) return "0";
      return prev.slice(0, -1);
    });
  }, [lastResult, clear]);

  const evaluate = useCallback(() => {
    const fullExpr = expression + display;
    // Convert display symbols back to operators
    const evalExpr = fullExpr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/[^0-9+\-*/.() ]/g, "");

    try {
      // Using Function constructor for safe math evaluation
      const fn = new Function(`"use strict"; return (${evalExpr});`);
      const rawResult = fn();
      if (typeof rawResult !== "number" || !isFinite(rawResult)) {
        setDisplay("Error");
        setExpression("");
        return;
      }
      const result = parseFloat(rawResult.toPrecision(12)).toString();
      onCalculate(fullExpr.trim(), result);
      setDisplay(result);
      setExpression("");
      setLastResult(result);
      setWaitingForOperand(false);
    } catch {
      setDisplay("Error");
      setExpression("");
    }
  }, [expression, display, onCalculate]);

  // Keyboard support
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key;
      if (key >= "0" && key <= "9") handleDigit(key);
      else if (key === ".") handleDecimal();
      else if (key === "+" || key === "-") handleOperator(key);
      else if (key === "*") handleOperator("*");
      else if (key === "/") { e.preventDefault(); handleOperator("/"); }
      else if (key === "Enter" || key === "=") evaluate();
      else if (key === "Escape") clear();
      else if (key === "Backspace") handleBackspace();
      else if (key === "%") handlePercent();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleDigit, handleDecimal, handleOperator, evaluate, clear, handleBackspace, handlePercent]);

  const buttons = [
    { label: "C", action: clear, style: "fn" },
    { label: "±", action: handleToggleSign, style: "fn" },
    { label: "%", action: handlePercent, style: "fn" },
    { label: "÷", action: () => handleOperator("/"), style: "op" },
    { label: "7", action: () => handleDigit("7"), style: "num" },
    { label: "8", action: () => handleDigit("8"), style: "num" },
    { label: "9", action: () => handleDigit("9"), style: "num" },
    { label: "×", action: () => handleOperator("*"), style: "op" },
    { label: "4", action: () => handleDigit("4"), style: "num" },
    { label: "5", action: () => handleDigit("5"), style: "num" },
    { label: "6", action: () => handleDigit("6"), style: "num" },
    { label: "−", action: () => handleOperator("-"), style: "op" },
    { label: "1", action: () => handleDigit("1"), style: "num" },
    { label: "2", action: () => handleDigit("2"), style: "num" },
    { label: "3", action: () => handleDigit("3"), style: "num" },
    { label: "+", action: () => handleOperator("+"), style: "op" },
    { label: "⌫", action: handleBackspace, style: "num", icon: true },
    { label: "0", action: () => handleDigit("0"), style: "num" },
    { label: ".", action: handleDecimal, style: "num" },
    { label: "=", action: evaluate, style: "eq" },
  ];

  return (
    <div className="w-full max-w-sm mx-auto" data-testid="normal-calculator">
      {/* Display */}
      <div className="bg-card border border-card-border rounded-xl p-4 mb-3">
        <div className="text-xs text-muted-foreground font-mono h-5 text-right truncate" data-testid="text-expression">
          {expression || "\u00A0"}
        </div>
        <div
          className="text-3xl font-semibold font-mono text-right truncate mt-1"
          data-testid="text-display"
        >
          {display}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`
              calc-btn h-14 text-base
              ${btn.wide ? "col-span-2" : ""}
              ${btn.style === "num" ? "bg-card border border-card-border hover:bg-muted/60 text-foreground" : ""}
              ${btn.style === "fn" ? "bg-muted hover:bg-muted/80 text-foreground font-medium" : ""}
              ${btn.style === "op" ? "bg-primary/10 hover:bg-primary/20 text-primary font-semibold" : ""}
              ${btn.style === "eq" ? "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" : ""}
            `}
            data-testid={`button-calc-${btn.label}`}
          >
            {btn.icon ? <Delete className="w-5 h-5" /> : btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
