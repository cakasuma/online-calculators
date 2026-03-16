import { useState, useCallback } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/hooks/use-locale";
import { TermTooltip } from "@/components/TermTooltip";
import { formatInputValue } from "@/lib/i18n";

interface Props {
  onCalculate: (expression: string, result: string) => void;
}

interface Heir {
  labelKey: string;
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

interface ValidationErrors {
  totalEstate?: string;
  debtsAndExpenses?: string;
  wasiyyah?: string;
  heirs?: string;
}

const initialForm: FormState = {
  totalEstate: "",
  debtsAndExpenses: "",
  wasiyyah: "",
  hasHusband: false,
  hasWife: false,
  hasFather: false,
  hasMother: false,
  sons: 0,
  daughters: 0,
};

export default function FaraidCalculator({ onCalculate }: Props) {
  const { t, locale } = useLocale();
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<Heir[] | null>(null);
  const [netEstate, setNetEstate] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Parse locale-aware number input
  function parseInput(val: string): number {
    if (!val || val.trim() === "") return 0;
    // Remove locale-specific thousand separators
    const cleaned = locale === "id"
      ? val.replace(/\./g, "").replace(",", ".")
      : val.replace(/,/g, "");
    return parseFloat(cleaned) || 0;
  }

  function validate(): boolean {
    const errs: ValidationErrors = {};
    const estate = parseInput(form.totalEstate);
    const debts = parseInput(form.debtsAndExpenses);
    const wasiyyah = parseInput(form.wasiyyah);

    if (!form.totalEstate.trim()) {
      errs.totalEstate = t("validation.required");
    } else if (isNaN(estate) || estate <= 0) {
      errs.totalEstate = t("validation.positiveNumber");
    }

    if (form.debtsAndExpenses.trim() && (isNaN(debts) || debts < 0)) {
      errs.debtsAndExpenses = t("validation.positiveNumber");
    }

    if (estate > 0 && debts >= estate) {
      errs.debtsAndExpenses = t("validation.debtsExceedEstate");
    }

    const netEst = estate - debts;
    if (form.wasiyyah.trim() && (isNaN(wasiyyah) || wasiyyah < 0)) {
      errs.wasiyyah = t("validation.positiveNumber");
    } else if (wasiyyah > netEst / 3) {
      errs.wasiyyah = t("validation.wasiyyahExceeds");
    }

    const hasHeirs =
      form.hasHusband || form.hasWife || form.hasFather ||
      form.hasMother || form.sons > 0 || form.daughters > 0;
    if (!hasHeirs) {
      errs.heirs = t("validation.noHeirs");
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const calculate = useCallback(() => {
    if (!validate()) return;

    const estate = parseInput(form.totalEstate);
    const debts = parseInput(form.debtsAndExpenses);
    const wasiyyah = parseInput(form.wasiyyah);
    const net = estate - debts - wasiyyah;
    setNetEstate(net);

    const heirs: Heir[] = [];
    let remaining = net;

    // Spouse shares
    const hasChildren = form.sons > 0 || form.daughters > 0;
    if (form.hasHusband) {
      const fraction = hasChildren ? 1 / 4 : 1 / 2;
      const amount = net * fraction;
      remaining -= amount;
      heirs.push({
        labelKey: t("faraid.husband"),
        key: "husband",
        share: hasChildren ? "1/4" : "1/2",
        amount,
      });
    }
    if (form.hasWife) {
      const fraction = hasChildren ? 1 / 8 : 1 / 4;
      const amount = net * fraction;
      remaining -= amount;
      heirs.push({
        labelKey: t("faraid.wife"),
        key: "wife",
        share: hasChildren ? "1/8" : "1/4",
        amount,
      });
    }

    // Father
    if (form.hasFather) {
      if (hasChildren) {
        const amount = net * (1 / 6);
        remaining -= amount;
        heirs.push({
          labelKey: t("faraid.fatherFixed"),
          key: "father",
          share: "1/6",
          amount,
        });
      }
      // else father is asabah — handled below
    }

    // Mother
    if (form.hasMother) {
      const fraction = hasChildren ? 1 / 6 : 1 / 3;
      const amount = net * fraction;
      remaining -= amount;
      heirs.push({
        labelKey: t("faraid.mother"),
        key: "mother",
        share: hasChildren ? "1/6" : "1/3",
        amount,
      });
    }

    // Children — asabah
    if (hasChildren) {
      const totalParts = form.sons * 2 + form.daughters * 1;
      for (let i = 0; i < form.sons; i++) {
        const share = remaining * (2 / totalParts);
        heirs.push({
          labelKey: `${t("faraid.son")} ${i + 1}`,
          key: `son_${i}`,
          share: "asabah",
          amount: share,
        });
      }
      for (let i = 0; i < form.daughters; i++) {
        const share = remaining * (1 / totalParts);
        heirs.push({
          labelKey: `${t("faraid.daughter")} ${i + 1}`,
          key: `daughter_${i}`,
          share: "asabah",
          amount: share,
        });
      }
      remaining = 0;
    } else if (!hasChildren && form.hasFather) {
      // Father gets residual
      const fatherAsabah = remaining;
      heirs.push({
        labelKey: t("faraid.fatherResidual"),
        key: "father_asabah",
        share: "asabah",
        amount: fatherAsabah,
      });
      remaining = 0;
    }

    // Record to history
    const expr = `Faraid: ${form.totalEstate} - ${form.debtsAndExpenses || "0"} - ${form.wasiyyah || "0"}`;
    const res = `Net: ${net.toLocaleString(locale === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 2 })}`;
    onCalculate(expr, res);

    setResult(heirs);
  }, [form, t, locale, onCalculate]);

  const formatAmount = (n: number) =>
    n.toLocaleString(locale === "id" ? "id-ID" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-300">
            {t("faraid.disclaimer.title")}
          </p>
          <p className="text-amber-700 dark:text-amber-400 mt-0.5">
            {t("faraid.disclaimer.text")}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="text-sm font-semibold">{t("faraid.estateDetails")}</h2>

          {/* Total Estate */}
          <div className="space-y-1">
            <Label htmlFor="total-estate" className="text-xs">
              <TermTooltip termKey="tooltip.totalEstate">
                {t("faraid.totalEstate")}
              </TermTooltip>
            </Label>
            <Input
              id="total-estate"
              type="text"
              inputMode="decimal"
              value={form.totalEstate}
              onChange={(e) => {
                setForm((f) => ({ ...f, totalEstate: formatInputValue(e.target.value, locale) }));
                setErrors((e2) => ({ ...e2, totalEstate: undefined }));
              }}
              placeholder={t("faraid.totalEstate.placeholder")}
              className={errors.totalEstate ? "border-destructive" : ""}
            />
            {errors.totalEstate && (
              <p className="text-xs text-destructive">{errors.totalEstate}</p>
            )}
          </div>

          {/* Debts */}
          <div className="space-y-1">
            <Label htmlFor="debts" className="text-xs">
              <TermTooltip termKey="tooltip.debts">
                {t("faraid.debts")}
              </TermTooltip>
            </Label>
            <Input
              id="debts"
              type="text"
              inputMode="decimal"
              value={form.debtsAndExpenses}
              onChange={(e) => {
                setForm((f) => ({ ...f, debtsAndExpenses: formatInputValue(e.target.value, locale) }));
                setErrors((e2) => ({ ...e2, debtsAndExpenses: undefined }));
              }}
              placeholder="0"
              className={errors.debtsAndExpenses ? "border-destructive" : ""}
            />
            {errors.debtsAndExpenses && (
              <p className="text-xs text-destructive">{errors.debtsAndExpenses}</p>
            )}
          </div>

          {/* Wasiyyah */}
          <div className="space-y-1">
            <Label htmlFor="wasiyyah" className="text-xs">
              <TermTooltip termKey="tooltip.wasiyyah">
                {t("faraid.wasiyyah")}
              </TermTooltip>
            </Label>
            <Input
              id="wasiyyah"
              type="text"
              inputMode="decimal"
              value={form.wasiyyah}
              onChange={(e) => {
                setForm((f) => ({ ...f, wasiyyah: formatInputValue(e.target.value, locale) }));
                setErrors((e2) => ({ ...e2, wasiyyah: undefined }));
              }}
              placeholder="0"
              className={errors.wasiyyah ? "border-destructive" : ""}
            />
            {errors.wasiyyah && (
              <p className="text-xs text-destructive">{errors.wasiyyah}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-3">
          <h2 className="text-sm font-semibold">{t("faraid.heirs")}</h2>
          {errors.heirs && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <Info className="w-3 h-3" /> {errors.heirs}
            </p>
          )}

          {/* Spouse toggles */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "hasHusband", labelKey: "faraid.husband", tooltipKey: "tooltip.husband" },
              { key: "hasWife", labelKey: "faraid.wife", tooltipKey: "tooltip.wife" },
              { key: "hasFather", labelKey: "faraid.father", tooltipKey: "tooltip.father" },
              { key: "hasMother", labelKey: "faraid.mother", tooltipKey: "tooltip.mother" },
            ].map(({ key, labelKey, tooltipKey }) => (
              <div key={key} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                <Label htmlFor={key} className="text-xs cursor-pointer">
                  <TermTooltip termKey={tooltipKey as any}>
                    {t(labelKey as any)}
                  </TermTooltip>
                </Label>
                <Switch
                  id={key}
                  checked={form[key as keyof FormState] as boolean}
                  onCheckedChange={(v) => {
                    setForm((f) => ({ ...f, [key]: v }));
                    setErrors((e2) => ({ ...e2, heirs: undefined }));
                  }}
                />
              </div>
            ))}
          </div>

          {/* Children counts */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "sons", labelKey: "faraid.sons", tooltipKey: "tooltip.sons" },
              { key: "daughters", labelKey: "faraid.daughters", tooltipKey: "tooltip.daughters" },
            ].map(({ key, labelKey, tooltipKey }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">
                  <TermTooltip termKey={tooltipKey as any}>
                    {t(labelKey as any)}
                  </TermTooltip>
                </Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, [key]: Math.max(0, (f[key as keyof FormState] as number) - 1) }));
                      setErrors((e2) => ({ ...e2, heirs: undefined }));
                    }}
                    className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted text-sm"
                  >
                    −
                  </button>
                  <span className="text-sm font-mono w-6 text-center">
                    {form[key as keyof FormState] as number}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, [key]: (f[key as keyof FormState] as number) + 1 }));
                      setErrors((e2) => ({ ...e2, heirs: undefined }));
                    }}
                    className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={calculate} className="w-full">
        {t("faraid.calculateDist")}
      </Button>

      {result && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <h2 className="text-sm font-semibold">{t("faraid.results")}</h2>
            <p className="text-xs text-muted-foreground">
              {t("faraid.netEstate")}: <span className="font-mono font-medium">{formatAmount(netEstate)}</span>
            </p>
            <div className="space-y-2">
              {result.map((heir) => (
                <div key={heir.key} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">{heir.labelKey}</p>
                    <p className="text-xs text-muted-foreground">{t("faraid.share")}: {heir.share}</p>
                  </div>
                  <p className="text-sm font-mono font-semibold">{formatAmount(heir.amount)}</p>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
              <span>{t("faraid.totalDistributed")}</span>
              <span className="font-mono">{formatAmount(result.reduce((s, h) => s + h.amount, 0))}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
