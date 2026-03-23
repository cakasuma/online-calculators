import { useState, useCallback, useEffect } from "react";
import { AlertTriangle, Info, Printer, Users, BookOpen, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/hooks/use-locale";
import { TermTooltip } from "@/components/TermTooltip";
import { AdSlot } from "@/components/AdSlot";
import { formatInputValue, formatCurrency } from "@/lib/i18n";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  onCalculate: (expression: string, result: string) => void;
}

// ─── Currencies ───────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "MYR", symbol: "RM" },
  { code: "IDR", symbol: "Rp" },
  { code: "USD", symbol: "$" },
  { code: "SAR", symbol: "﷼" },
  { code: "SGD", symbol: "S$" },
  { code: "GBP", symbol: "£" },
];

// ─── Chart colours ────────────────────────────────────────────────────────────
const CHART_COLORS = [
  "#0EA5E9", "#8B5CF6", "#10B981", "#F97316",
  "#EC4899", "#F59E0B", "#6366F1", "#06B6D4",
  "#EF4444", "#84CC16",
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormState {
  totalEstate: string;
  debtsAndExpenses: string;
  wasiyyah: string;
  currency: string;
  hasHusband: boolean;
  numberOfWives: number;
  hasFather: boolean;
  hasPaternalGrandfather: boolean;
  hasPaternalGrandmother: boolean;
  hasMother: boolean;
  hasMaternalGrandmother: boolean;
  sons: number;
  daughters: number;
  grandsons: number;
  granddaughters: number;
  fullBrothers: number;
  fullSisters: number;
  paternalBrothers: number;
  paternalSisters: number;
  maternalBrothers: number;
  maternalSisters: number;
  hasConsanguineMale: boolean;
}

interface ComputedHeir {
  key: string;
  nameKey: string;
  nameNum?: number;
  share: string;
  fraction: number;
  amount: number;
  percentage: number;
  type: "fixed" | "asabah" | "fixed+asabah";
}

interface BlockedHeir {
  nameKey: string;
  blockedByKey: string;
}

interface DistributionResult {
  heirs: ComputedHeir[];
  blockedHeirs: BlockedHeir[];
  netEstate: number;
  hasAwl: boolean;
  awlFactor: number;
  undistributed: number;
  hasUmariyyatain: boolean;
}

interface ValidationErrors {
  totalEstate?: string;
  debtsAndExpenses?: string;
  wasiyyah?: string;
  heirs?: string;
}

// ─── Initial form ─────────────────────────────────────────────────────────────
const initialForm: FormState = {
  totalEstate: "",
  debtsAndExpenses: "",
  wasiyyah: "",
  currency: "MYR",
  hasHusband: false,
  numberOfWives: 0,
  hasFather: false,
  hasPaternalGrandfather: false,
  hasPaternalGrandmother: false,
  hasMother: false,
  hasMaternalGrandmother: false,
  sons: 0,
  daughters: 0,
  grandsons: 0,
  granddaughters: 0,
  fullBrothers: 0,
  fullSisters: 0,
  paternalBrothers: 0,
  paternalSisters: 0,
  maternalBrothers: 0,
  maternalSisters: 0,
  hasConsanguineMale: false,
};

// ─── Calculation engine ───────────────────────────────────────────────────────
function computeDistribution(form: FormState, net: number): DistributionResult {
  const heirs: ComputedHeir[] = [];
  const blockedHeirs: BlockedHeir[] = [];
  const notes: string[] = [];

  const hasChildren = form.sons > 0 || form.daughters > 0;
  const hasGrandchildren = form.grandsons > 0 || form.granddaughters > 0;
  const hasDescendants = hasChildren || hasGrandchildren;
  const hasSpouse = form.hasHusband || form.numberOfWives > 0;

  // Spouse fraction (for umariyyatain)
  const spouseFraction = form.hasHusband
    ? hasChildren ? 1 / 4 : 1 / 2
    : form.numberOfWives > 0
    ? hasChildren ? 1 / 8 : 1 / 4
    : 0;

  // Blocking rules
  const grandfatherBlocked = form.hasFather;
  const paternalGrandmotherBlocked = form.hasMother || form.hasFather || form.hasPaternalGrandfather;
  const maternalGrandmotherBlocked = form.hasMother;
  const grandsonsBlocked = form.sons > 0;
  const granddaughtersBlocked = form.sons > 0 || (form.daughters >= 2 && form.grandsons === 0);
  const fullSiblingsBlocked =
    form.hasFather || form.hasPaternalGrandfather || form.sons > 0 || form.grandsons > 0;
  // For backward compat, keep old name as alias
  const siblingsBlocked = fullSiblingsBlocked;
  const paternalSiblingsBlocked = fullSiblingsBlocked || form.fullBrothers > 0;
  const maternalSiblingsBlocked =
    hasDescendants || form.hasFather || form.hasPaternalGrandfather;
  const consanguineBlocked =
    paternalSiblingsBlocked || form.paternalBrothers > 0;

  // Track blocked heirs
  if (form.hasPaternalGrandfather && grandfatherBlocked) {
    blockedHeirs.push({ nameKey: "faraid.grandfather", blockedByKey: "faraid.blocked.father" });
  }
  if (form.hasPaternalGrandmother && paternalGrandmotherBlocked) {
    const pgmBlockerKey = form.hasMother
      ? "faraid.blocked.mother"
      : form.hasFather
      ? "faraid.blocked.father"
      : "faraid.blocked.grandfather";
    blockedHeirs.push({ nameKey: "faraid.paternalGrandmother", blockedByKey: pgmBlockerKey });
  }
  if (form.hasMaternalGrandmother && maternalGrandmotherBlocked) {
    blockedHeirs.push({ nameKey: "faraid.maternalGrandmother", blockedByKey: "faraid.blocked.mother" });
  }
  if (form.grandsons > 0 && grandsonsBlocked) {
    blockedHeirs.push({ nameKey: "faraid.grandsons", blockedByKey: "faraid.blocked.sons" });
  }
  if (form.granddaughters > 0 && granddaughtersBlocked) {
    const gdBlockerKey = form.sons > 0 ? "faraid.blocked.sons" : "faraid.blocked.daughters";
    blockedHeirs.push({ nameKey: "faraid.granddaughters", blockedByKey: gdBlockerKey });
  }
  if ((form.fullBrothers > 0 || form.fullSisters > 0) && siblingsBlocked) {
    const blockerKey = form.hasFather
      ? "faraid.blocked.father"
      : form.hasPaternalGrandfather
      ? "faraid.blocked.grandfather"
      : form.grandsons > 0
      ? "faraid.blocked.grandsons"
      : "faraid.blocked.sons";
    if (form.fullBrothers > 0)
      blockedHeirs.push({ nameKey: "faraid.fullBrothers", blockedByKey: blockerKey });
    if (form.fullSisters > 0)
      blockedHeirs.push({ nameKey: "faraid.fullSisters", blockedByKey: blockerKey });
  }
  if ((form.paternalBrothers > 0 || form.paternalSisters > 0) && paternalSiblingsBlocked) {
    const pbBlockerKey = form.hasFather
      ? "faraid.blocked.father"
      : form.hasPaternalGrandfather
      ? "faraid.blocked.grandfather"
      : form.sons > 0 || form.grandsons > 0
      ? "faraid.blocked.sons"
      : "faraid.blocked.fullBrothers";
    if (form.paternalBrothers > 0)
      blockedHeirs.push({ nameKey: "faraid.paternalBrothers", blockedByKey: pbBlockerKey });
    if (form.paternalSisters > 0)
      blockedHeirs.push({ nameKey: "faraid.paternalSisters", blockedByKey: pbBlockerKey });
  }
  if ((form.maternalBrothers > 0 || form.maternalSisters > 0) && maternalSiblingsBlocked) {
    const mbBlockerKey = form.hasFather
      ? "faraid.blocked.father"
      : form.hasPaternalGrandfather
      ? "faraid.blocked.grandfather"
      : "faraid.blocked.sons";
    if (form.maternalBrothers > 0)
      blockedHeirs.push({ nameKey: "faraid.maternalBrothers", blockedByKey: mbBlockerKey });
    if (form.maternalSisters > 0)
      blockedHeirs.push({ nameKey: "faraid.maternalSisters", blockedByKey: mbBlockerKey });
  }

  // ── Fixed-share heirs ──
  type FixedEntry = { key: string; nameKey: string; nameNum?: number; frac: number; share: string };
  const fixedEntries: FixedEntry[] = [];

  // Husband
  if (form.hasHusband) {
    const frac = hasChildren ? 1 / 4 : 1 / 2;
    fixedEntries.push({ key: "husband", nameKey: "faraid.husband", frac, share: hasChildren ? "1/4" : "1/2" });
  }

  // Wives
  if (form.numberOfWives > 0) {
    const totalFrac = hasChildren ? 1 / 8 : 1 / 4;
    const baseShare = hasChildren ? "1/8" : "1/4";
    if (form.numberOfWives === 1) {
      fixedEntries.push({ key: "wife_1", nameKey: "faraid.wife", frac: totalFrac, share: baseShare });
    } else {
      const perWife = totalFrac / form.numberOfWives;
      for (let i = 0; i < form.numberOfWives; i++) {
        fixedEntries.push({
          key: `wife_${i + 1}`,
          nameKey: "faraid.wife",
          nameNum: i + 1,
          frac: perWife,
          share: `${baseShare} ÷ ${form.numberOfWives}`,
        });
      }
    }
  }

  // Father
  let fatherIsAsabah = false;
  if (form.hasFather) {
    if (hasChildren) {
      fixedEntries.push({ key: "father", nameKey: "faraid.father", frac: 1 / 6, share: "1/6" });
    } else {
      fatherIsAsabah = true;
    }
  }

  // Paternal Grandfather (not blocked)
  let grandfatherIsAsabah = false;
  if (form.hasPaternalGrandfather && !grandfatherBlocked) {
    if (hasChildren) {
      fixedEntries.push({ key: "grandfather", nameKey: "faraid.grandfather", frac: 1 / 6, share: "1/6" });
    } else {
      grandfatherIsAsabah = true;
    }
  }

  // Mother
  let hasUmariyyatain = false;
  if (form.hasMother) {
    const totalSiblings = form.fullBrothers + form.fullSisters;
    let frac: number;
    let shareKey: string;
    if (hasChildren || totalSiblings >= 2) {
      frac = 1 / 6;
      shareKey = "1/6";
    } else if (form.hasFather && hasSpouse && !hasChildren) {
      frac = (1 - spouseFraction) / 3;
      shareKey = "REMAINDER_THIRD";
      hasUmariyyatain = true;
    } else {
      frac = 1 / 3;
      shareKey = "1/3";
    }
    fixedEntries.push({ key: "mother", nameKey: "faraid.mother", frac, share: shareKey });
  }

  // Daughters only (no sons) → fixed shares
  if (form.daughters > 0 && form.sons === 0) {
    const totalFrac = form.daughters === 1 ? 1 / 2 : 2 / 3;
    const perDaughter = totalFrac / form.daughters;
    const shareLabel =
      form.daughters === 1
        ? "1/2"
        : form.daughters === 2
        ? "1/3 each (2/3 total)"
        : `2/3 ÷ ${form.daughters}`;
    for (let i = 0; i < form.daughters; i++) {
      fixedEntries.push({
        key: `daughter_${i}`,
        nameKey: "faraid.daughter",
        nameNum: form.daughters === 1 ? undefined : i + 1,
        frac: perDaughter,
        share: shareLabel,
      });
    }
  }

  // Sisters only (no brothers, not blocked, no children)
  if (
    !siblingsBlocked &&
    form.fullSisters > 0 &&
    form.fullBrothers === 0 &&
    !hasChildren
  ) {
    const totalFrac = form.fullSisters === 1 ? 1 / 2 : 2 / 3;
    const perSister = totalFrac / form.fullSisters;
    const shareLabel =
      form.fullSisters === 1
        ? "1/2"
        : form.fullSisters === 2
        ? "1/3 each (2/3 total)"
        : `2/3 ÷ ${form.fullSisters}`;
    for (let i = 0; i < form.fullSisters; i++) {
      fixedEntries.push({
        key: `sister_${i}`,
        nameKey: "faraid.fullSister",
        nameNum: form.fullSisters === 1 ? undefined : i + 1,
        frac: perSister,
        share: shareLabel,
      });
    }
  }

  // Grandmothers — share 1/6 between unblocked grandmothers
  const activePGM = form.hasPaternalGrandmother && !paternalGrandmotherBlocked;
  const activeMGM = form.hasMaternalGrandmother && !maternalGrandmotherBlocked;
  const activeGrandmothers = (activePGM ? 1 : 0) + (activeMGM ? 1 : 0);
  if (activeGrandmothers > 0) {
    const perGM = (1 / 6) / activeGrandmothers;
    const gmShare = activeGrandmothers === 2 ? "1/12" : "1/6";
    if (activePGM)
      fixedEntries.push({ key: "paternalGrandmother", nameKey: "faraid.paternalGrandmother", frac: perGM, share: gmShare });
    if (activeMGM)
      fixedEntries.push({ key: "maternalGrandmother", nameKey: "faraid.maternalGrandmother", frac: perGM, share: gmShare });
  }

  // Granddaughters (DS) — fixed share when no grandsons and not blocked
  if (form.granddaughters > 0 && !granddaughtersBlocked && form.grandsons === 0) {
    if (form.daughters === 1 && form.sons === 0) {
      // Complementary 1/6 to bring total daughters tier to 2/3
      const perGD = (1 / 6) / form.granddaughters;
      const gdShare = form.granddaughters === 1 ? "1/6" : `1/6 ÷ ${form.granddaughters}`;
      for (let i = 0; i < form.granddaughters; i++) {
        fixedEntries.push({
          key: `granddaughter_${i}`,
          nameKey: "faraid.granddaughter",
          nameNum: form.granddaughters === 1 ? undefined : i + 1,
          frac: perGD,
          share: gdShare,
        });
      }
    } else if (form.daughters === 0 && form.sons === 0) {
      // Standalone: 1 GD → 1/2; 2+ → 2/3
      const totalFrac = form.granddaughters === 1 ? 1 / 2 : 2 / 3;
      const perGD = totalFrac / form.granddaughters;
      const gdShare =
        form.granddaughters === 1
          ? "1/2"
          : form.granddaughters === 2
          ? "1/3 each (2/3 total)"
          : `2/3 ÷ ${form.granddaughters}`;
      for (let i = 0; i < form.granddaughters; i++) {
        fixedEntries.push({
          key: `granddaughter_${i}`,
          nameKey: "faraid.granddaughter",
          nameNum: form.granddaughters === 1 ? undefined : i + 1,
          frac: perGD,
          share: gdShare,
        });
      }
    }
  }

  // Paternal Sisters (PS) — fixed share when no paternal brothers, not blocked, no children
  if (!paternalSiblingsBlocked && form.paternalSisters > 0 && form.paternalBrothers === 0 && !hasChildren && !hasGrandchildren) {
    if (form.fullSisters === 1 && form.fullBrothers === 0) {
      // Complementary 1/6 alongside 1 full sister
      const perPS = (1 / 6) / form.paternalSisters;
      const psShare = form.paternalSisters === 1 ? "1/6" : `1/6 ÷ ${form.paternalSisters}`;
      for (let i = 0; i < form.paternalSisters; i++) {
        fixedEntries.push({
          key: `paternalSister_${i}`,
          nameKey: "faraid.paternalSister",
          nameNum: form.paternalSisters === 1 ? undefined : i + 1,
          frac: perPS,
          share: psShare,
        });
      }
    } else if (form.fullSisters === 0 && form.fullBrothers === 0) {
      // Standalone: 1 PS → 1/2; 2+ → 2/3
      const totalFrac = form.paternalSisters === 1 ? 1 / 2 : 2 / 3;
      const perPS = totalFrac / form.paternalSisters;
      const psShare =
        form.paternalSisters === 1
          ? "1/2"
          : form.paternalSisters === 2
          ? "1/3 each (2/3 total)"
          : `2/3 ÷ ${form.paternalSisters}`;
      for (let i = 0; i < form.paternalSisters; i++) {
        fixedEntries.push({
          key: `paternalSister_${i}`,
          nameKey: "faraid.paternalSister",
          nameNum: form.paternalSisters === 1 ? undefined : i + 1,
          frac: perPS,
          share: psShare,
        });
      }
    }
  }

  // Maternal siblings (MB + MS) — fixed 1/6 (one) or 1/3 (two+), split equally
  if (!maternalSiblingsBlocked) {
    const totalMaternalSiblings = form.maternalBrothers + form.maternalSisters;
    if (totalMaternalSiblings > 0) {
      const poolFrac = totalMaternalSiblings === 1 ? 1 / 6 : 1 / 3;
      const perSibling = poolFrac / totalMaternalSiblings;
      const mShare = totalMaternalSiblings === 1 ? (poolFrac === 1 / 6 ? "1/6" : "1/3") : `${totalMaternalSiblings === 2 ? "1/3" : "1/3"} ÷ ${totalMaternalSiblings}`;
      for (let i = 0; i < form.maternalBrothers; i++) {
        fixedEntries.push({
          key: `maternalBrother_${i}`,
          nameKey: "faraid.maternalBrother",
          nameNum: form.maternalBrothers === 1 ? undefined : i + 1,
          frac: perSibling,
          share: mShare,
        });
      }
      for (let i = 0; i < form.maternalSisters; i++) {
        fixedEntries.push({
          key: `maternalSister_${i}`,
          nameKey: "faraid.maternalSister",
          nameNum: form.maternalSisters === 1 ? undefined : i + 1,
          frac: perSibling,
          share: mShare,
        });
      }
    }
  }

  // ── Awl check ─────────────────────────────────────────────────────────────
  const fixedTotal = fixedEntries.reduce((s, e) => s + e.frac, 0);
  const hasAwl = fixedTotal > 1 + 1e-9;
  const awlFactor = hasAwl ? fixedTotal : 1;

  // Build fixed ComputedHeirs
  for (const e of fixedEntries) {
    const effectiveFrac = e.frac / awlFactor;
    const amount = net * effectiveFrac;
    heirs.push({
      key: e.key,
      nameKey: e.nameKey,
      nameNum: e.nameNum,
      share: e.share + (hasAwl ? ` (REDUCED)` : ""),
      fraction: effectiveFrac,
      amount,
      percentage: effectiveFrac * 100,
      type: "fixed",
    });
  }

  // ── Asabah (residual) ─────────────────────────────────────────────────────
  const fixedAmountTotal = heirs.reduce((s, h) => s + h.amount, 0);
  let remaining = net - fixedAmountTotal;

  if (form.sons > 0) {
    // Sons + daughters share remainder 2:1
    const totalParts = form.sons * 2 + form.daughters;
    for (let i = 0; i < form.sons; i++) {
      const amount = (remaining * 2) / totalParts;
      heirs.push({
        key: `son_${i}`,
        nameKey: "faraid.son",
        nameNum: form.sons === 1 ? undefined : i + 1,
        share: "asabah (2:1)",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    for (let i = 0; i < form.daughters; i++) {
      const amount = remaining / totalParts;
      heirs.push({
        key: `daughter_asabah_${i}`,
        nameKey: "faraid.daughter",
        nameNum: form.daughters === 1 ? undefined : i + 1,
        share: "asabah (1:2)",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    remaining = 0;
  } else if (form.grandsons > 0 && !grandsonsBlocked) {
    // Grandsons + granddaughters share remainder 2:1
    const gdAsabah = !granddaughtersBlocked ? form.granddaughters : 0;
    const totalParts = form.grandsons * 2 + gdAsabah;
    for (let i = 0; i < form.grandsons; i++) {
      const amount = (remaining * 2) / totalParts;
      heirs.push({
        key: `grandson_${i}`,
        nameKey: "faraid.grandson",
        nameNum: form.grandsons === 1 ? undefined : i + 1,
        share: "asabah (2:1)",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    if (gdAsabah > 0) {
      for (let i = 0; i < gdAsabah; i++) {
        const amount = remaining / totalParts;
        heirs.push({
          key: `granddaughter_asabah_${i}`,
          nameKey: "faraid.granddaughter",
          nameNum: gdAsabah === 1 ? undefined : i + 1,
          share: "asabah (1:2)",
          fraction: amount / net,
          amount,
          percentage: (amount / net) * 100,
          type: "asabah",
        });
      }
    }
    remaining = 0;
  } else if (hasChildren && form.hasFather && form.daughters > 0) {
    // Daughters (fixed) + father gets residual (tasib)
    if (remaining > 0.001) {
      const fatherIdx = heirs.findIndex((h) => h.key === "father");
      if (fatherIdx >= 0) {
        heirs[fatherIdx].amount += remaining;
        heirs[fatherIdx].fraction = heirs[fatherIdx].amount / net;
        heirs[fatherIdx].percentage = heirs[fatherIdx].fraction * 100;
        heirs[fatherIdx].share = "SIXTH_PLUS_RESIDUAL";
        heirs[fatherIdx].type = "fixed+asabah";
      }
      remaining = 0;
    }
  } else if (fatherIsAsabah) {
    heirs.push({
      key: "father_asabah",
      nameKey: "faraid.father",
      share: "asabah",
      fraction: remaining / net,
      amount: remaining,
      percentage: (remaining / net) * 100,
      type: "asabah",
    });
    remaining = 0;
  } else if (grandfatherIsAsabah) {
    heirs.push({
      key: "grandfather_asabah",
      nameKey: "faraid.grandfather",
      share: "asabah",
      fraction: remaining / net,
      amount: remaining,
      percentage: (remaining / net) * 100,
      type: "asabah",
    });
    remaining = 0;
  } else if (!siblingsBlocked && form.fullBrothers > 0) {
    // Brothers + sisters as asabah (2:1)
    const totalParts = form.fullBrothers * 2 + form.fullSisters;
    for (let i = 0; i < form.fullBrothers; i++) {
      const amount = (remaining * 2) / totalParts;
      heirs.push({
        key: `brother_${i}`,
        nameKey: "faraid.fullBrother",
        nameNum: form.fullBrothers === 1 ? undefined : i + 1,
        share: "asabah (2:1)",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    for (let i = 0; i < form.fullSisters; i++) {
      const amount = remaining / totalParts;
      heirs.push({
        key: `sister_asabah_${i}`,
        nameKey: "faraid.fullSister",
        nameNum: form.fullSisters === 1 ? undefined : i + 1,
        share: "asabah (1:2)",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    remaining = 0;
  } else if (!siblingsBlocked && form.fullSisters > 0 && form.fullBrothers === 0 && form.daughters > 0) {
    // Sisters become asabah bil-ghair when daughters exist without sons
    for (let i = 0; i < form.fullSisters; i++) {
      const amount = remaining / form.fullSisters;
      heirs.push({
        key: `sister_asabah_${i}`,
        nameKey: "faraid.fullSister",
        nameNum: form.fullSisters === 1 ? undefined : i + 1,
        share: "asabah bil-ghair",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    remaining = 0;
  } else if (!paternalSiblingsBlocked && form.paternalBrothers > 0) {
    // Paternal brothers + paternal sisters as asabah (2:1)
    const totalParts = form.paternalBrothers * 2 + form.paternalSisters;
    for (let i = 0; i < form.paternalBrothers; i++) {
      const amount = (remaining * 2) / totalParts;
      heirs.push({
        key: `paternalBrother_${i}`,
        nameKey: "faraid.paternalBrother",
        nameNum: form.paternalBrothers === 1 ? undefined : i + 1,
        share: "asabah (2:1)",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    for (let i = 0; i < form.paternalSisters; i++) {
      const amount = remaining / totalParts;
      heirs.push({
        key: `paternalSister_asabah_${i}`,
        nameKey: "faraid.paternalSister",
        nameNum: form.paternalSisters === 1 ? undefined : i + 1,
        share: "asabah (1:2)",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    remaining = 0;
  } else if (!paternalSiblingsBlocked && form.paternalSisters > 0 && form.paternalBrothers === 0 && (form.daughters > 0 || form.granddaughters > 0)) {
    // Paternal sisters become asabah bil-ghair when daughters/granddaughters exist
    for (let i = 0; i < form.paternalSisters; i++) {
      const amount = remaining / form.paternalSisters;
      heirs.push({
        key: `paternalSister_asabah_${i}`,
        nameKey: "faraid.paternalSister",
        nameNum: form.paternalSisters === 1 ? undefined : i + 1,
        share: "asabah bil-ghair",
        fraction: amount / net,
        amount,
        percentage: (amount / net) * 100,
        type: "asabah",
      });
    }
    remaining = 0;
  } else if (!consanguineBlocked && form.hasConsanguineMale) {
    heirs.push({
      key: "consanguineMale",
      nameKey: "faraid.consanguineMale",
      share: "asabah",
      fraction: remaining / net,
      amount: remaining,
      percentage: (remaining / net) * 100,
      type: "asabah",
    });
    remaining = 0;
  }

  const undistributed = remaining > 0.001 ? remaining : 0;

  return { heirs, blockedHeirs, netEstate: net, hasAwl, awlFactor, undistributed, hasUmariyyatain };
}

// ─── Counter component ────────────────────────────────────────────────────────
function Counter({
  value,
  onChange,
  max = 20,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted text-sm font-medium"
      >
        −
      </button>
      <span className="text-sm font-mono w-6 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted text-sm font-medium"
      >
        +
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FaraidCalculator({ onCalculate }: Props) {
  const { t, locale } = useLocale();
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<DistributionResult | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showRefs, setShowRefs] = useState(false);

  // Auto-set currency when locale changes
  useEffect(() => {
    setForm((f) => ({ ...f, currency: locale === "id" ? "IDR" : "MYR" }));
  }, [locale]);

  const currencySymbol = CURRENCIES.find((c) => c.code === form.currency)?.symbol ?? "RM";

  // Translate heir name (key + optional number suffix)
  const heirName = (heir: ComputedHeir) => {
    const base = t(heir.nameKey as any);
    return heir.nameNum !== undefined ? `${base} ${heir.nameNum}` : base;
  };

  // Translate share sentinel tokens injected by computeDistribution
  const translateShare = (share: string) =>
    share
      .replace("REMAINDER_THIRD", t("faraid.share.thirdOfRemainder"))
      .replace("SIXTH_PLUS_RESIDUAL", t("faraid.share.sixthPlusResidual"))
      .replace("(REDUCED)", `(${t("faraid.share.reduced")})`);


  function parseInput(val: string): number {
    if (!val || val.trim() === "") return 0;
    const cleaned =
      locale === "id"
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
    const net = estate - debts;
    if (form.wasiyyah.trim() && (isNaN(wasiyyah) || wasiyyah < 0)) {
      errs.wasiyyah = t("validation.positiveNumber");
    } else if (wasiyyah > net / 3) {
      errs.wasiyyah = t("validation.wasiyyahExceeds");
    }

    const hasHeirs =
      form.hasHusband ||
      form.numberOfWives > 0 ||
      form.hasFather ||
      form.hasPaternalGrandfather ||
      form.hasPaternalGrandmother ||
      form.hasMother ||
      form.hasMaternalGrandmother ||
      form.sons > 0 ||
      form.daughters > 0 ||
      form.grandsons > 0 ||
      form.granddaughters > 0 ||
      form.fullBrothers > 0 ||
      form.fullSisters > 0 ||
      form.paternalBrothers > 0 ||
      form.paternalSisters > 0 ||
      form.maternalBrothers > 0 ||
      form.maternalSisters > 0 ||
      form.hasConsanguineMale;
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

    const dist = computeDistribution(form, net);
    setResult(dist);

    const expr = `Faraid (${form.currency}): ${form.totalEstate}`;
    const res = `Net: ${formatAmount(net)} | ${dist.heirs.length} heirs`;
    onCalculate(expr, res);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, locale, onCalculate]);

  const formatAmount = (n: number) => `${currencySymbol} ${formatCurrency(n, locale)}`;

  function handlePrint() {
    window.print();
  }

  function handleShareWhatsApp() {
    if (!result) return;
    const lines = [
      `*Faraid Distribution Results*`,
      `Net Estate: ${formatAmount(result.netEstate)}`,
      ``,
      ...result.heirs.map(
        (h) => `• ${heirName(h)}: ${formatAmount(h.amount)} (${h.percentage.toFixed(1)}%)`
      ),
    ];
    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, heirs: undefined }));
  }

  const estate = parseInput(form.totalEstate);
  const debts = parseInput(form.debtsAndExpenses);
  const wasiyyah = parseInput(form.wasiyyah);
  const liveNet = Math.max(0, estate - debts - wasiyyah);

  return (
    <div className="max-w-2xl mx-auto space-y-4 print:space-y-3">
      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm print:hidden">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-300">
            {t("faraid.disclaimer.title")}
          </p>
          <p className="text-amber-700 dark:text-amber-400 mt-0.5 text-xs">
            {t("faraid.disclaimer.text")}
          </p>
        </div>
      </div>

      {/* Quranic & Hadith References */}
      <Card className="print:hidden">
        <CardContent className="pt-3 pb-3">
          <button
            type="button"
            onClick={() => setShowRefs((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-medium hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              {t("faraid.references.title")}
            </span>
            {showRefs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showRefs && (
            <div className="mt-3 space-y-3 border-t pt-3">
              {[
                { citationKey: "faraid.references.quran411", textKey: "faraid.references.quran411.text" },
                { citationKey: "faraid.references.quran412", textKey: "faraid.references.quran412.text" },
                { citationKey: "faraid.references.quran4176", textKey: "faraid.references.quran4176.text" },
                { citationKey: "faraid.references.hadith", textKey: "faraid.references.hadith.text" },
              ].map(({ citationKey, textKey }) => (
                <div key={citationKey} className="space-y-1">
                  <p className="text-[11px] font-semibold text-primary">
                    {t(citationKey as any)}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t(textKey as any)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currency selector */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">{t("faraid.currency")}:</span>
            <div className="flex flex-wrap gap-1.5">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setField("currency", c.code)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.currency === c.code
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.code} ({c.symbol})
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estate Details */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="text-sm font-semibold">{t("faraid.estateDetails")}</h2>

          <div className="space-y-1">
            <Label htmlFor="total-estate" className="text-xs">
              <TermTooltip termKey="tooltip.totalEstate">{t("faraid.totalEstate")}</TermTooltip>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                {currencySymbol}
              </span>
              <Input
                id="total-estate"
                type="text"
                inputMode="decimal"
                value={form.totalEstate}
                onChange={(e) => {
                  setForm((f) => ({ ...f, totalEstate: formatInputValue(e.target.value, locale) }));
                  setErrors((er) => ({ ...er, totalEstate: undefined }));
                }}
                placeholder={locale === "id" ? "cth. 100.000" : "e.g. 100,000"}
                className={`pl-9 ${errors.totalEstate ? "border-destructive" : ""}`}
              />
            </div>
            {errors.totalEstate && (
              <p className="text-xs text-destructive">{errors.totalEstate}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="debts" className="text-xs">
              <TermTooltip termKey="tooltip.debts">{t("faraid.debts")}</TermTooltip>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                {currencySymbol}
              </span>
              <Input
                id="debts"
                type="text"
                inputMode="decimal"
                value={form.debtsAndExpenses}
                onChange={(e) => {
                  setForm((f) => ({ ...f, debtsAndExpenses: formatInputValue(e.target.value, locale) }));
                  setErrors((er) => ({ ...er, debtsAndExpenses: undefined }));
                }}
                placeholder="0"
                className={`pl-9 ${errors.debtsAndExpenses ? "border-destructive" : ""}`}
              />
            </div>
            {errors.debtsAndExpenses && (
              <p className="text-xs text-destructive">{errors.debtsAndExpenses}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="wasiyyah" className="text-xs">
              <TermTooltip termKey="tooltip.wasiyyah">{t("faraid.wasiyyah")}</TermTooltip>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                {currencySymbol}
              </span>
              <Input
                id="wasiyyah"
                type="text"
                inputMode="decimal"
                value={form.wasiyyah}
                onChange={(e) => {
                  setForm((f) => ({ ...f, wasiyyah: formatInputValue(e.target.value, locale) }));
                  setErrors((er) => ({ ...er, wasiyyah: undefined }));
                }}
                placeholder="0"
                className={`pl-9 ${errors.wasiyyah ? "border-destructive" : ""}`}
              />
            </div>
            {errors.wasiyyah && (
              <p className="text-xs text-destructive">{errors.wasiyyah}</p>
            )}
          </div>

          {/* Live estate breakdown */}
          {estate > 0 && (
            <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs">
              <p className="font-medium text-xs">{t("faraid.estateBreakdown")}</p>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("faraid.totalEstate")}</span>
                <span className="font-mono">{formatAmount(estate)}</span>
              </div>
              {debts > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>− {t("faraid.debts")}</span>
                  <span className="font-mono text-destructive">−{formatAmount(debts)}</span>
                </div>
              )}
              {wasiyyah > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>− {t("faraid.wasiyyah")}</span>
                  <span className="font-mono text-destructive">−{formatAmount(wasiyyah)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-1.5">
                <span>{t("faraid.netEstate")}</span>
                <span className="font-mono text-primary">{formatAmount(liveNet)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Heirs */}
      <Card>
        <CardContent className="pt-5 space-y-5">
          <h2 className="text-sm font-semibold">{t("faraid.heirs")}</h2>
          {errors.heirs && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <Info className="w-3 h-3" /> {errors.heirs}
            </p>
          )}

          {/* Spouse */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("faraid.spouseSection")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Husband */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                <Label htmlFor="hasHusband" className="text-xs cursor-pointer">
                  <TermTooltip termKey="tooltip.husband">{t("faraid.husband")}</TermTooltip>
                </Label>
                <Switch
                  id="hasHusband"
                  checked={form.hasHusband}
                  onCheckedChange={(v) => {
                    setField("hasHusband", v);
                    if (v) setField("numberOfWives", 0);
                  }}
                />
              </div>

              {/* Wives count */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                <Label className="text-xs">
                  <TermTooltip termKey="tooltip.numberOfWives">{t("faraid.numberOfWives")}</TermTooltip>
                </Label>
                <Counter
                  value={form.numberOfWives}
                  max={4}
                  onChange={(n) => {
                    setField("numberOfWives", n);
                    if (n > 0) setField("hasHusband", false);
                  }}
                />
              </div>
            </div>
            {form.hasHusband && form.numberOfWives > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <Info className="w-3 h-3" /> {t("faraid.spouseBothError")}
              </p>
            )}
          </section>

          {/* Parents */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("faraid.parentsSection")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: "hasFather", labelKey: "faraid.father", tooltipKey: "tooltip.father" },
                { key: "hasMother", labelKey: "faraid.mother", tooltipKey: "tooltip.mother" },
              ].map(({ key, labelKey, tooltipKey }) => (
                <div key={key} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                  <Label htmlFor={key} className="text-xs cursor-pointer">
                    <TermTooltip termKey={tooltipKey as any}>{t(labelKey as any)}</TermTooltip>
                  </Label>
                  <Switch
                    id={key}
                    checked={form[key as keyof FormState] as boolean}
                    onCheckedChange={(v) => setField(key as keyof FormState, v as any)}
                  />
                </div>
              ))}

              {/* Paternal Grandfather */}
              <div
                className={`flex items-center justify-between p-2.5 rounded-lg border bg-card ${
                  form.hasFather ? "opacity-50" : ""
                }`}
              >
                <Label htmlFor="hasPaternalGrandfather" className="text-xs cursor-pointer flex-1">
                  <TermTooltip termKey="tooltip.grandfather">{t("faraid.grandfather")}</TermTooltip>
                  {form.hasFather && (
                    <span className="ml-2 text-muted-foreground text-[10px]">
                      ({t("faraid.blockedNote")} {t("faraid.blocked.father")})
                    </span>
                  )}
                </Label>
                <Switch
                  id="hasPaternalGrandfather"
                  checked={form.hasPaternalGrandfather}
                  disabled={form.hasFather}
                  onCheckedChange={(v) => setField("hasPaternalGrandfather", v)}
                />
              </div>

              {/* Paternal Grandmother (MF) */}
              {(() => {
                const pgmBlocked = form.hasMother || form.hasFather || form.hasPaternalGrandfather;
                const pgmBlockerKey = form.hasMother
                  ? "faraid.blocked.mother"
                  : form.hasFather
                  ? "faraid.blocked.father"
                  : "faraid.blocked.grandfather";
                return (
                  <div className={`flex items-center justify-between p-2.5 rounded-lg border bg-card ${pgmBlocked ? "opacity-50" : ""}`}>
                    <Label htmlFor="hasPaternalGrandmother" className="text-xs cursor-pointer flex-1">
                      <TermTooltip termKey="tooltip.paternalGrandmother">{t("faraid.paternalGrandmother")}</TermTooltip>
                      {pgmBlocked && (
                        <span className="ml-2 text-muted-foreground text-[10px]">
                          ({t("faraid.blockedNote")} {t(pgmBlockerKey as any)})
                        </span>
                      )}
                    </Label>
                    <Switch
                      id="hasPaternalGrandmother"
                      checked={form.hasPaternalGrandmother}
                      disabled={pgmBlocked}
                      onCheckedChange={(v) => setField("hasPaternalGrandmother", v)}
                    />
                  </div>
                );
              })()}

              {/* Maternal Grandmother (MM) */}
              {(() => {
                const mgmBlocked = form.hasMother;
                return (
                  <div className={`flex items-center justify-between p-2.5 rounded-lg border bg-card ${mgmBlocked ? "opacity-50" : ""}`}>
                    <Label htmlFor="hasMaternalGrandmother" className="text-xs cursor-pointer flex-1">
                      <TermTooltip termKey="tooltip.maternalGrandmother">{t("faraid.maternalGrandmother")}</TermTooltip>
                      {mgmBlocked && (
                        <span className="ml-2 text-muted-foreground text-[10px]">
                          ({t("faraid.blockedNote")} {t("faraid.blocked.mother")})
                        </span>
                      )}
                    </Label>
                    <Switch
                      id="hasMaternalGrandmother"
                      checked={form.hasMaternalGrandmother}
                      disabled={mgmBlocked}
                      onCheckedChange={(v) => setField("hasMaternalGrandmother", v)}
                    />
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Children */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("faraid.childrenSection")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "sons", labelKey: "faraid.sons", tooltipKey: "tooltip.sons" },
                { key: "daughters", labelKey: "faraid.daughters", tooltipKey: "tooltip.daughters" },
              ].map(({ key, labelKey, tooltipKey }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">
                    <TermTooltip termKey={tooltipKey as any}>{t(labelKey as any)}</TermTooltip>
                  </Label>
                  <Counter
                    value={form[key as keyof FormState] as number}
                    onChange={(n) => setField(key as keyof FormState, n as any)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Grandchildren */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("faraid.grandchildrenSection")}
            </p>
            {form.sons > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3 flex-shrink-0" />
                {t("faraid.siblingsBlockedBy")} {t("faraid.blocked.sons")}.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "grandsons", labelKey: "faraid.grandsons", tooltipKey: "tooltip.grandsons", blocked: form.sons > 0 },
                { key: "granddaughters", labelKey: "faraid.granddaughters", tooltipKey: "tooltip.granddaughters", blocked: form.sons > 0 || (form.daughters >= 2 && form.grandsons === 0) },
              ].map(({ key, labelKey, tooltipKey, blocked }) => (
                <div key={key} className={`space-y-1 ${blocked ? "opacity-50" : ""}`}>
                  <Label className="text-xs">
                    <TermTooltip termKey={tooltipKey as any}>{t(labelKey as any)}</TermTooltip>
                  </Label>
                  <Counter
                    value={form[key as keyof FormState] as number}
                    onChange={(n) => setField(key as keyof FormState, n as any)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Siblings */}
          <section className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("faraid.siblingsSection")}
            </p>

            {/* Full siblings */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground">{t("faraid.fullSiblingsSection")}</p>
              {(form.hasFather || form.hasPaternalGrandfather || form.sons > 0 || form.grandsons > 0) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  {t("faraid.siblingsBlockedBy")}{" "}
                  {form.hasFather
                    ? t("faraid.blocked.father")
                    : form.hasPaternalGrandfather
                    ? t("faraid.blocked.grandfather")
                    : form.grandsons > 0
                    ? t("faraid.blocked.grandsons")
                    : t("faraid.blocked.sons")}
                  .
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: "fullBrothers", labelKey: "faraid.fullBrothers", tooltipKey: "tooltip.fullBrothers" },
                  { key: "fullSisters", labelKey: "faraid.fullSisters", tooltipKey: "tooltip.fullSisters" },
                ].map(({ key, labelKey, tooltipKey }) => (
                  <div
                    key={key}
                    className={`space-y-1 ${
                      form.hasFather || form.hasPaternalGrandfather || form.sons > 0 || form.grandsons > 0 ? "opacity-50" : ""
                    }`}
                  >
                    <Label className="text-xs">
                      <TermTooltip termKey={tooltipKey as any}>{t(labelKey as any)}</TermTooltip>
                    </Label>
                    <Counter
                      value={form[key as keyof FormState] as number}
                      onChange={(n) => setField(key as keyof FormState, n as any)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Paternal siblings (half, father's side) */}
            {(() => {
              const psBlocked = form.hasFather || form.hasPaternalGrandfather || form.sons > 0 || form.grandsons > 0 || form.fullBrothers > 0;
              return (
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">{t("faraid.paternalSiblingsSection")}</p>
                  {psBlocked && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3 flex-shrink-0" />
                      {t("faraid.siblingsBlockedBy")}{" "}
                      {form.hasFather
                        ? t("faraid.blocked.father")
                        : form.hasPaternalGrandfather
                        ? t("faraid.blocked.grandfather")
                        : form.sons > 0 || form.grandsons > 0
                        ? t("faraid.blocked.sons")
                        : t("faraid.blocked.fullBrothers")}
                      .
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: "paternalBrothers", labelKey: "faraid.paternalBrothers", tooltipKey: "tooltip.paternalBrothers" },
                      { key: "paternalSisters", labelKey: "faraid.paternalSisters", tooltipKey: "tooltip.paternalSisters" },
                    ].map(({ key, labelKey, tooltipKey }) => (
                      <div key={key} className={`space-y-1 ${psBlocked ? "opacity-50" : ""}`}>
                        <Label className="text-xs">
                          <TermTooltip termKey={tooltipKey as any}>{t(labelKey as any)}</TermTooltip>
                        </Label>
                        <Counter
                          value={form[key as keyof FormState] as number}
                          onChange={(n) => setField(key as keyof FormState, n as any)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Maternal siblings (uterine) */}
            {(() => {
              const mbBlocked = form.sons > 0 || form.daughters > 0 || form.grandsons > 0 || form.granddaughters > 0 || form.hasFather || form.hasPaternalGrandfather;
              const mbBlockerKey = form.hasFather
                ? "faraid.blocked.father"
                : form.hasPaternalGrandfather
                ? "faraid.blocked.grandfather"
                : "faraid.blocked.sons";
              return (
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">{t("faraid.maternalSiblingsSection")}</p>
                  {mbBlocked && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3 flex-shrink-0" />
                      {t("faraid.siblingsBlockedBy")} {t(mbBlockerKey as any)}.
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: "maternalBrothers", labelKey: "faraid.maternalBrothers", tooltipKey: "tooltip.maternalBrothers" },
                      { key: "maternalSisters", labelKey: "faraid.maternalSisters", tooltipKey: "tooltip.maternalSisters" },
                    ].map(({ key, labelKey, tooltipKey }) => (
                      <div key={key} className={`space-y-1 ${mbBlocked ? "opacity-50" : ""}`}>
                        <Label className="text-xs">
                          <TermTooltip termKey={tooltipKey as any}>{t(labelKey as any)}</TermTooltip>
                        </Label>
                        <Counter
                          value={form[key as keyof FormState] as number}
                          onChange={(n) => setField(key as keyof FormState, n as any)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </section>

          {/* Other Relatives */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("faraid.otherRelativesSection")}
            </p>
            {/* Consanguine male */}
            {(() => {
              const cBlocked = form.hasFather || form.hasPaternalGrandfather || form.sons > 0 || form.grandsons > 0 || form.fullBrothers > 0 || form.paternalBrothers > 0;
              return (
                <div className={`flex items-center justify-between p-2.5 rounded-lg border bg-card ${cBlocked ? "opacity-50" : ""}`}>
                  <Label htmlFor="hasConsanguineMale" className="text-xs cursor-pointer flex-1">
                    <TermTooltip termKey="tooltip.consanguineMale">{t("faraid.consanguineMale")}</TermTooltip>
                  </Label>
                  <Switch
                    id="hasConsanguineMale"
                    checked={form.hasConsanguineMale}
                    disabled={cBlocked}
                    onCheckedChange={(v) => setField("hasConsanguineMale", v)}
                  />
                </div>
              );
            })()}
            {/* Distant Kindred note */}
            <p className="text-[11px] text-muted-foreground flex items-start gap-1">
              <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
              {t("faraid.distantKindredNote")}
            </p>
          </section>
        </CardContent>
      </Card>

      {/* Ad slot — above calculate button */}
      <AdSlot id="ad-above-calculate" variant="banner" className="print:hidden" />

      <Button onClick={calculate} className="w-full" size="lg">
        {t("faraid.calculateDist")}
      </Button>

      {/* Results */}
      {result && (
        <>
          <Card className="print:shadow-none overflow-hidden">
            <CardHeader className="pb-2 print:pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-base">{t("faraid.results")}</CardTitle>
                <div className="flex gap-2 print:hidden flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="gap-1.5 text-xs">
                    <Share2 className="w-3.5 h-3.5" />
                    {t("faraid.shareResults")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
                    <Printer className="w-3.5 h-3.5" />
                    {t("faraid.printResults")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Net estate summary */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex flex-wrap justify-between items-center gap-1">
                <span className="text-sm font-medium">{t("faraid.netEstate")}</span>
                <span className="font-mono font-bold text-primary">{formatAmount(result.netEstate)}</span>
              </div>

              {/* Notes */}
              {result.hasAwl && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-orange-800 dark:text-orange-300">{t("faraid.awlNote")}</span>
                </div>
              )}
              {result.hasUmariyyatain && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs">
                  <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-blue-800 dark:text-blue-300">{t("faraid.umariyyatainNote")}</span>
                </div>
              )}

              {/* Heirs table */}
              <div className="space-y-1.5">
                {result.heirs.map((heir, idx) => (
                  <div
                    key={heir.key}
                    className="p-2.5 rounded-lg bg-muted/40 space-y-1 overflow-hidden"
                  >
                    {/* Row 1: name + percentage */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                        <span className="text-xs font-medium leading-tight truncate">{heirName(heir)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                        {heir.percentage.toFixed(1)}%
                      </span>
                    </div>
                    {/* Row 2: share badge + amount */}
                    <div className="flex items-center justify-between gap-2 pl-[18px] flex-wrap">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {translateShare(heir.share)}
                      </Badge>
                      <span className="text-xs font-mono font-semibold">
                        {formatAmount(heir.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Blocked heirs */}
              {result.blockedHeirs.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("faraid.blockedHeirs")}
                  </p>
                  {result.blockedHeirs.map((b, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-1 p-2 rounded-lg bg-muted/20 border border-dashed opacity-60"
                    >
                      <span className="text-xs text-muted-foreground line-through">{t(b.nameKey as any)}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {t("faraid.blockedNote")}: {t(b.blockedByKey as any)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Undistributed */}
              {result.undistributed > 0 && (
                <div className="p-2.5 rounded-lg bg-muted/30 border border-dashed space-y-1">
                  <div className="flex flex-wrap justify-between text-xs gap-1">
                    <span className="text-muted-foreground">{t("faraid.undistributed")}</span>
                    <span className="font-mono font-medium">{formatAmount(result.undistributed)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t("faraid.undistributedNote")}</p>
                </div>
              )}

              {/* Total distributed */}
              <div className="pt-1 border-t flex flex-wrap justify-between text-xs gap-1">
                <span className="text-muted-foreground font-medium">{t("faraid.totalDistributed")}</span>
                <span className="font-mono font-semibold">
                  {formatAmount(result.heirs.reduce((s, h) => s + h.amount, 0))}
                </span>
              </div>

              {/* Pie chart */}
              {result.heirs.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium mb-2">{t("faraid.distribution")}</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={result.heirs.map((h) => ({ name: heirName(h), value: h.amount }))}
                          cx="50%"
                          cy="45%"
                          outerRadius={70}
                          dataKey="value"
                        >
                          {result.heirs.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => [formatAmount(value), t("faraid.chart.amount")]}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: "11px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Consultation CTA */}
          <Card className="border-primary/20 bg-primary/5 print:hidden">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t("faraid.consultCTA.title")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t("faraid.consultCTA.text")}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" asChild>
                <a href="https://www.google.com/search?q=certified+faraid+consultant" target="_blank" rel="noopener noreferrer">
                  <Users className="w-3.5 h-3.5" />
                  {t("faraid.consultCTA.button")}
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Ad slot — after results */}
          <AdSlot id="ad-after-results" variant="rectangle" className="print:hidden" />
        </>
      )}
    </div>
  );
}
