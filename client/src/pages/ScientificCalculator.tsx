import { useState, useCallback, useEffect } from "react";
import { Delete } from "lucide-react";

interface Props {
  onCalculate: (expression: string, result: string) => void;
}

type AngleMode = "deg" | "rad";

export default function ScientificCalculator({ onCalculate }: Props) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [angleMode, setAngleMode] = useState<AngleMode>("deg");
  const [showInverse, setShowInverse] = useState(false);

  const toRad = useCallback(
    (val: number) => (angleMode === "deg" ? (val * Math.PI) / 180 : val),
    [angleMode]
  );
  const fromRad = useCallback(
    (val: number) => (angleMode === "deg" ? (val * 180) / Math.PI : val),
    [angleMode]
  );

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
      const displaySymbol = op === "*" ? "\u00d7" : op === "/" ? "\u00f7" : op;
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

  const applyUnaryFn = useCallback(
    (fnName: string, fn: (x: number) => number) => {
      const val = parseFloat(display);
      if (isNaN(val)) return;
      try {
        const result = fn(val);
        if (!isFinite(result)) {
          setDisplay("Error");
          return;
        }
        const resultStr = parseFloat(result.toPrecision(12)).toString();
        onCalculate(`${fnName}(${val})`, resultStr);
        setDisplay(resultStr);
        setLastResult(resultStr);
        setWaitingForOperand(false);
        setExpression("");
      } catch {
        setDisplay("Error");
      }
    },
    [display, onCalculate]
  );

  const evaluate = useCallback(() => {
    const fullExpr = expression + display;
    const evalExpr = fullExpr
      .replace(/\u00d7/g, "*")
      .replace(/\u00f7/g, "/")
      .replace(/[^0-9+\-*/.() ]/g, "");
    try {
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
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleDigit, handleDecimal, handleOperator, evaluate, clear, handleBackspace]);

  const scientificFns = showInverse
    ? [
        { label: "sin\u207b\u00b9", action: () => applyUnaryFn("asin", (x) => fromRad(Math.asin(x))) },
        { label: "cos\u207b\u00b9", action: () => applyUnaryFn("acos", (x) => fromRad(Math.acos(x))) },
        { label: "tan\u207b\u00b9", action: () => applyUnaryFn("atan", (x) => fromRad(Math.atan(x))) },
        { label: "e\u02e3", action: () => applyUnaryFn("exp", Math.exp) },
        { label: "10\u02e3", action: () => applyUnaryFn("10^", (x) => Math.pow(10, x)) },
      ]
    : [
        { label: "sin", action: () => applyUnaryFn("sin", (x) => Math.sin(toRad(x))) },
        { label: "cos", action: () => applyUnaryFn("cos", (x) => Math.cos(toRad(x))) },
        { label: "tan", action: () => applyUnaryFn("tan", (x) => Math.tan(toRad(x))) },
        { label: "ln", action: () => applyUnaryFn("ln", Math.log) },
        { label: "log", action: () => applyUnaryFn("log", Math.log10) },
      ];

  const scientificExtra = [
    { label: "x\u00b2", action: () => applyUnaryFn("sqr", (x) => x * x) },
    { label: "\u221ax", action: () => applyUnaryFn("sqrt", Math.sqrt) },
    { label: "x\u02b8", action: () => handleOperator("**"), isOp: true },
    { label: "\u03c0", action: () => { setDisplay(Math.PI.toString()); setLastResult(null); setWaitingForOperand(false); } },
    { label: "e", action: () => { setDisplay(Math.E.toString()); setLastResult(null); setWaitingForOperand(false); } },
    { label: "1/x", action: () => applyUnaryFn("1/", (x) => 1 / x) },
    { label: "|x|", action: () => applyUnaryFn("abs", Math.abs) },
    { label: "x!", action: () => applyUnaryFn("fact", factorial) },
  ];

  const numButtons: { label: string; action: () => void; style: string; icon?: boolean; wide?: boolean }[] = [
    { label: "C", action: clear, style: "fn" },
    { label: "(", action: () => setDisplay((p) => p === "0" ? "(" : p + "("), style: "fn" },
    { label: ")", action: () => setDisplay((p) => p + ")"), style: "fn" },
    { label: "\u00f7", action: () => handleOperator("/"), style: "op" },
    { label: "7", action: () => handleDigit("7"), style: "num" },
    { label: "8", action: () => handleDigit("8"), style: "num" },
    { label: "9", action: () => handleDigit("9"), style: "num" },
    { label: "\u00d7", action: () => handleOperator("*"), style: "op" },
    { label: "4", action: () => handleDigit("4"), style: "num" },
    { label: "5", action: () => handleDigit("5"), style: "num" },
    { label: "6", action: () => handleDigit("6"), style: "num" },
    { label: "\u2212", action: () => handleOperator("-"), style: "op" },
    { label: "1", action: () => handleDigit("1"), style: "num" },
    { label: "2", action: () => handleDigit("2"), style: "num" },
    { label: "3", action: () => handleDigit("3"), style: "num" },
    { label: "+", action: () => handleOperator("+"), style: "op" },
    { label: "\u232b", action: handleBackspace, style: "num", icon: true },
    { label: "0", action: () => handleDigit("0"), style: "num" },
    { label: ".", action: handleDecimal, style: "num" },
    { label: "=", action: evaluate, style: "eq" },
  ];

  return (
    <div className="w-full max-w-lg mx-auto" data-testid="scientific-calculator">
      <div className="bg-card border border-card-border rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAngleMode((m) => (m === "deg" ? "rad" : "deg"))}
              className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              data-testid="button-angle-mode"
            >
              {angleMode}
            </button>
            <button
              onClick={() => setShowInverse((s) => !s)}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                showInverse
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
              data-testid="button-inverse"
            >
              INV
            </button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground font-mono h-5 text-right truncate" data-testid="text-sci-expression">
          {expression || "\u00a0"}
        </div>
        <div className="text-3xl font-semibold font-mono text-right truncate mt-1" data-testid="text-sci-display">
          {display}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5 mb-2">
        {scientificFns.map((fn, i) => (
          <button
            key={i}
            onClick={fn.action}
            className="calc-btn h-10 text-xs bg-accent/50 hover:bg-accent text-accent-foreground font-medium rounded-lg"
            data-testid={`button-sci-${fn.label}`}
          >
            {fn.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {scientificExtra.map((fn, i) => (
          <button
            key={i}
            onClick={fn.action}
            className="calc-btn h-10 text-xs bg-accent/50 hover:bg-accent text-accent-foreground font-medium rounded-lg"
            data-testid={`button-sci-${fn.label}`}
          >
            {fn.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {numButtons.map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`
              calc-btn h-12 text-sm
              ${btn.wide ? "col-span-2" : ""}
              ${btn.style === "num" ? "bg-card border border-card-border hover:bg-muted/60 text-foreground" : ""}
              ${btn.style === "fn" ? "bg-muted hover:bg-muted/80 text-foreground font-medium" : ""}
              ${btn.style === "op" ? "bg-primary/10 hover:bg-primary/20 text-primary font-semibold" : ""}
              ${btn.style === "eq" ? "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" : ""}
            `}
            data-testid={`button-sci-calc-${btn.label}`}
          >
            {btn.icon ? <Delete className="w-4 h-4" /> : btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity;
  if (n !== Math.floor(n)) return NaN;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}
