import type { TranslationKey } from "@/lib/i18n";
import {
  Banknote,
  Calculator,
  Car,
  FileText,
  FlaskConical,
  HeartPulse,
  Landmark,
  PiggyBank,
  Receipt,
  Scale,
  Star,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; labelKey: TranslationKey; icon: LucideIcon };
export type NavGroup = { labelKey: TranslationKey; items: NavItem[] };

// Single source of truth for the calculator navigation. Drives the desktop
// top-nav dropdowns, the mobile slide-in drawer, AND the footer columns, so
// these surfaces stay in sync — add a calculator here and it shows everywhere.
export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.groupFinance",
    items: [
      { href: "/salary", labelKey: "nav.salary", icon: Wallet },
      { href: "/epf-retirement", labelKey: "nav.epf", icon: PiggyBank },
      { href: "/housing-loan", labelKey: "nav.housing", icon: Landmark },
      { href: "/income-tax", labelKey: "nav.tax", icon: Receipt },
      { href: "/car-loan", labelKey: "nav.carloan", icon: Car },
      { href: "/fixed-deposit", labelKey: "nav.fd", icon: Banknote },
    ],
  },
  {
    labelKey: "nav.groupMath",
    items: [
      { href: "/normal", labelKey: "nav.basic", icon: Calculator },
      { href: "/scientific", labelKey: "nav.scientific", icon: FlaskConical },
    ],
  },
  {
    labelKey: "nav.groupIslamic",
    items: [
      { href: "/faraid", labelKey: "nav.faraid", icon: Scale },
      { href: "/zakat", labelKey: "nav.zakat", icon: Star },
      { href: "/wasiat", labelKey: "nav.wasiat", icon: FileText },
    ],
  },
  {
    labelKey: "nav.groupHealth",
    items: [
      { href: "/bmi", labelKey: "nav.bmi", icon: HeartPulse },
    ],
  },
];
