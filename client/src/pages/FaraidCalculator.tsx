import { useState, useCallback } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  onCalculate: (expression: string, result: string) => void;
}

interface Heir {
  label: string;
  key: string;
  share: string;
  amount: number;
}

interface FormState {
  totalEstate: string;
  debtsAndExpenses: string;
  wasiyyah: string;
  hasHusband: boolean;
  hasWife: boolean;
  hasFather: boolean;
  hasMother: boolean;
  sons: number;
  daughters: number;
}

const initialForm: FormState = {
  totalEstate: "",
  debtsAndExpenses: "0",
  wasiyyah: "0",
  hasHusband: false,
  hasWife: false,
  hasFather: false,
  hasMother: false,
  sons: 0,
  daughters: 0,
};

export default function FaraidCalculator({ onCalculate }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<Heir[] | null>(null);
  const [netEstate, setNetEstate] = useState(0);

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        // Husband and wife are mutually exclusive
        if (key === "hasHusband" && value === true) next.hasWife = false;
        if (key === "hasWife" && value === true) next.hasHusband = false;
        return next;
      });
      setResult(null);
    },
    []
  );

  const calculate = useCallback(() => {
    const total = parseFloat(form.totalEstate) || 0;
    const debts = parseFloat(form.debtsAndExpenses) || 0;
    const wasiyyahInput = parseFloat(form.wasiyyah) || 0;
    if (total <= 0) return;

    const afterDebts = Math.max(0, total - debts);
    // Wasiyyah capped at 1/3
    const maxWasiyyah = afterDebts / 3;
    const wasiyyah = Math.min(wasiyyahInput, maxWasiyyah);
    const net = afterDebts - wasiyyah;
    setNetEstate(net);

    const heirs: Heir[] = [];
    let totalFixedShare = 0;
    const hasChildren = form.sons > 0 || form.daughters > 0;

    // Spouse share
    if (form.hasHusband) {
      const share = hasChildren ? 1 / 4 : 1 / 2;
      const label = hasChildren ? "1/4" : "1/2";
      totalFixedShare += share;
      heirs.push({ label: "Husband", key: "husband", share: label, amount: net * share });
    }
    if (form.hasWife) {
      const share = hasChildren ? 1 / 8 : 1 / 4;
      const label = hasChildren ? "1/8" : "1/4";
      totalFixedShare += share;
      heirs.push({ label: "Wife", key: "wife", share: label, amount: net * share });
    }

    // Father
    if (form.hasFather) {
      if (hasChildren) {
        const share = 1 / 6;
        totalFixedShare += share;
        heirs.push({ label: "Father", key: "father", share: "1/6", amount: net * share });
      } else {
        // Father gets residual (asabah) — handled below
        // but first gives him 1/6 if there are daughters only with no sons
        if (form.daughters > 0 && form.sons === 0) {
          const share = 1 / 6;
          totalFixedShare += share;
          heirs.push({ label: "Father (fixed)", key: "father-fixed", share: "1/6", amount: net * share });
          // Father also gets residual, added below
        }
        // if no children at all, father is asabah (gets residual)
      }
    }

    // Mother
    if (form.hasMother) {
      const share = hasChildren ? 1 / 6 : 1 / 3;
      const label = hasChildren ? "1/6" : "1/3";
      totalFixedShare += share;
      heirs.push({ label: "Mother", key: "mother", share: label, amount: net * share });
    }

    const remainder = net * (1 - totalFixedShare);

    // Children
    if (form.sons > 0) {
      // Sons and daughters as asabah, male=2x female
      const totalShares = form.sons * 2 + form.daughters;
      const perShare = totalShares > 0 ? remainder / totalShares : 0;
      if (form.sons > 0) {
        heirs.push({
          label: `Son${form.sons > 1 ? "s" : ""} (${form.sons})`,
          key: "sons",
          share: "Residual (2x)",
          amount: perShare * 2 * form.sons,
        });
      }
      if (form.daughters > 0) {
        heirs.push({
          label: `Daughter${form.daughters > 1 ? "s" : ""} (${form.daughters})`,
          key: "daughters",
          share: "Residual (1x)",
          amount: perShare * form.daughters,
        });
      }
      // Father residual (if no sons, handled above)
      if (form.hasFather && !hasChildren) {
        // already pushed fixed share, rest is asabah — not applicable here since hasChildren is true
      }
    } else if (form.daughters > 0) {
      // Daughters only (no sons) — fixed shares
      if (form.daughters === 1) {
        const share = 1 / 2;
        const amt = net * share;
        if (totalFixedShare + share <= 1) {
          heirs.push({ label: "Daughter", key: "daughters", share: "1/2", amount: amt });
          totalFixedShare += share;
        } else {
          heirs.push({ label: "Daughter", key: "daughters", share: "1/2*", amount: amt });
        }
      } else {
        const share = 2 / 3;
        const amt = net * share;
        heirs.push({
          label: `Daughters (${form.daughters})`,
          key: "daughters",
          share: "2/3",
          amount: amt,
        });
        totalFixedShare += share;
      }
      // Father gets residual if present
      if (form.hasFather) {
        const fatherResidue = Math.max(0, net - heirs.reduce((s, h) => s + h.amount, 0));
        if (fatherResidue > 0) {
          heirs.push({
            label: "Father (residual)",
            key: "father-residual",
            share: "Residual",
            amount: fatherResidue,
          });
        }
      }
    } else {
      // No children — father gets residual
      if (form.hasFather) {
        heirs.push({
          label: "Father",
          key: "father",
          share: "Residual",
          amount: remainder,
        });
      }
    }

    setResult(heirs);

    // Build summary for history
    const parts = heirs.map((h) => `${h.label}: ${formatCurrency(h.amount)}`).join(", ");
    onCalculate(
      `Faraid: Estate ${formatCurrency(net)}`,
      parts
    );
  }, [form, onCalculate]);

  const reset = useCallback(() => {
    setForm(initialForm);
    setResult(null);
    setNetEstate(0);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto space-y-4" data-testid="faraid-calculator">
      {/* Disclaimer */}
      <div className="flex gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-700 dark:text-amber-300 text-xs">Prototype Only</p>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
            This is a simplified Faraid calculator. It covers basic inheritance scenarios only. Always consult a qualified Islamic scholar for actual estate distribution.
          </p>
        </div>
      </div>

      {/* Estate Input */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-primary" /> Estate Details
          </h3>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="totalEstate" className="text-xs text-muted-foreground">Total Estate Value</Label>
              <Input
                id="totalEstate"
                type="number"
                placeholder="e.g. 100000"
                value={form.totalEstate}
                onChange={(e) => update("totalEstate", e.target.value)}
                className="font-mono mt-1"
                data-testid="input-total-estate"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="debts" className="text-xs text-muted-foreground">Debts & Expenses</Label>
                <Input
                  id="debts"
                  type="number"
                  placeholder="0"
                  value={form.debtsAndExpenses}
                  onChange={(e) => update("debtsAndExpenses", e.target.value)}
                  className="font-mono mt-1"
                  data-testid="input-debts"
                />
              </div>
              <div>
                <Label htmlFor="wasiyyah" className="text-xs text-muted-foreground">Wasiyyah (max 1/3)</Label>
                <Input
                  id="wasiyyah"
                  type="number"
                  placeholder="0"
                  value={form.wasiyyah}
                  onChange={(e) => update("wasiyyah", e.target.value)}
                  className="font-mono mt-1"
                  data-testid="input-wasiyyah"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heirs Selection */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h3 className="text-sm font-semibold">Heirs</h3>

          {/* Spouse */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="husband" className="text-sm">Husband</Label>
              <Switch
                id="husband"
                checked={form.hasHusband}
                onCheckedChange={(v) => update("hasHusband", v)}
                data-testid="switch-husband"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="wife" className="text-sm">Wife</Label>
              <Switch
                id="wife"
                checked={form.hasWife}
                onCheckedChange={(v) => update("hasWife", v)}
                data-testid="switch-wife"
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Parents */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="father" className="text-sm">Father</Label>
              <Switch
                id="father"
                checked={form.hasFather}
                onCheckedChange={(v) => update("hasFather", v)}
                data-testid="switch-father"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="mother" className="text-sm">Mother</Label>
              <Switch
                id="mother"
                checked={form.hasMother}
                onCheckedChange={(v) => update("hasMother", v)}
                data-testid="switch-mother"
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Children */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Sons</Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => update("sons", Math.max(0, form.sons - 1))}
                  className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-medium"
                  data-testid="button-sons-minus"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-mono" data-testid="text-sons-count">{form.sons}</span>
                <button
                  onClick={() => update("sons", Math.min(20, form.sons + 1))}
                  className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-medium"
                  data-testid="button-sons-plus"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Daughters</Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => update("daughters", Math.max(0, form.daughters - 1))}
                  className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-medium"
                  data-testid="button-daughters-minus"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-mono" data-testid="text-daughters-count">{form.daughters}</span>
                <button
                  onClick={() => update("daughters", Math.min(20, form.daughters + 1))}
                  className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-medium"
                  data-testid="button-daughters-plus"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={calculate} className="flex-1" data-testid="button-calculate-faraid">
          Calculate Distribution
        </Button>
        <Button variant="outline" onClick={reset} data-testid="button-reset-faraid">
          Reset
        </Button>
      </div>

      {/* Results */}
      {result && (
        <Card>
          <CardContent className="pt-5">
            <h3 className="text-sm font-semibold mb-1">Distribution Results</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Net estate: <span className="font-mono font-medium text-foreground">{formatCurrency(netEstate)}</span>
            </p>
            <div className="space-y-2">
              {result.map((heir) => (
                <div
                  key={heir.key}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30"
                  data-testid={`result-heir-${heir.key}`}
                >
                  <div>
                    <p className="text-sm font-medium">{heir.label}</p>
                    <p className="text-xs text-muted-foreground">Share: {heir.share}</p>
                  </div>
                  <p className="text-sm font-semibold font-mono text-primary">
                    {formatCurrency(heir.amount)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <span className="text-sm font-medium">Total Distributed</span>
              <span className="text-sm font-semibold font-mono">
                {formatCurrency(result.reduce((s, h) => s + h.amount, 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
