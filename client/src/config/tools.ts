import {
  Banknote,
  Calculator,
  Car,
  CircleDollarSign,
  FileText,
  FlaskConical,
  HeartPulse,
  Home,
  Landmark,
  PiggyBank,
  Receipt,
  Scale,
  Sigma,
  Star,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "Finance" | "Math" | "Islamic" | "Documents" | "Health";

export interface ToolMeta {
  slug: string;
  href: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  featured?: boolean;
  badge?: string;
}

export const toolCategories: { name: ToolCategory; description: string; icon: LucideIcon }[] = [
  { name: "Finance", description: "Income, tax, and wealth planning tools", icon: CircleDollarSign },
  { name: "Math", description: "Daily and advanced calculation helpers", icon: Sigma },
  { name: "Islamic", description: "Shariah-aware planning and guidance", icon: Landmark },
  { name: "Documents", description: "Guides and generators for legal paperwork", icon: FileText },
  { name: "Health", description: "Everyday body and fitness calculators", icon: HeartPulse },
];

export const tools: ToolMeta[] = [
  {
    slug: "salary-calculator",
    href: "/salary",
    name: "Salary Calculator (Malaysia)",
    description: "Estimate monthly take-home pay with EPF, SOCSO, EIS, and income tax deductions.",
    category: "Finance",
    icon: CircleDollarSign,
    featured: true,
    badge: "Popular",
  },
  {
    slug: "epf-calculator",
    href: "/epf-retirement",
    name: "EPF Retirement Projection",
    description: "Project your KWSP balance at retirement and compare against the Basic Savings target.",
    category: "Finance",
    icon: PiggyBank,
    featured: true,
    badge: "New",
  },
  {
    slug: "housing-loan-calculator",
    href: "/housing-loan",
    name: "Housing Loan Calculator (Malaysia)",
    description: "Monthly home loan repayment plus stamp duty, legal fees, and total upfront cash needed.",
    category: "Finance",
    icon: Home,
    featured: true,
    badge: "New",
  },
  {
    slug: "income-tax-calculator",
    href: "/income-tax",
    name: "Income Tax Calculator 2026",
    description: "Estimate your Malaysia income tax with reliefs, rebates, and effective rate for YA 2026.",
    category: "Finance",
    icon: Receipt,
    badge: "New",
  },
  {
    slug: "car-loan-calculator",
    href: "/car-loan",
    name: "Car Loan Calculator (Malaysia)",
    description: "Monthly hire purchase instalment from the flat rate, plus the true effective interest cost.",
    category: "Finance",
    icon: Car,
    badge: "New",
  },
  {
    slug: "fixed-deposit-calculator",
    href: "/fixed-deposit",
    name: "Fixed Deposit Calculator (Malaysia)",
    description: "Maturity value and interest earned on a fixed deposit, with auto-renewal compounding.",
    category: "Finance",
    icon: Banknote,
    badge: "New",
  },
  {
    slug: "normal-calculator",
    href: "/normal",
    name: "Basic Calculator",
    description: "Quick arithmetic for everyday calculations.",
    category: "Math",
    icon: Calculator,
  },
  {
    slug: "scientific-calculator",
    href: "/scientific",
    name: "Scientific Calculator",
    description: "Advanced functions including trigonometry, logs, and powers.",
    category: "Math",
    icon: FlaskConical,
  },
  {
    slug: "faraid-calculator",
    href: "/faraid",
    name: "Faraid Calculator",
    description: "Islamic inheritance share calculator with detailed heir distribution.",
    category: "Islamic",
    icon: Scale,
    featured: true,
  },
  {
    slug: "zakat-calculator",
    href: "/zakat",
    name: "Zakat Calculator",
    description: "Estimate annual zakat obligation across major zakatable asset classes.",
    category: "Islamic",
    icon: Star,
  },
  {
    slug: "wasiat-guide",
    href: "/wasiat",
    name: "Wasiat Guide",
    description: "Step-by-step Islamic will guidance with printable planning checklist.",
    category: "Documents",
    icon: FileText,
  },
  {
    slug: "bmi-calculator",
    href: "/bmi",
    name: "BMI Calculator (with BMR & Calories)",
    description: "Check your BMI, healthy weight range, BMR, and daily calorie needs (TDEE).",
    category: "Health",
    icon: HeartPulse,
    featured: true,
  },
];

export const navTools = [
  "/salary",
  "/epf-retirement",
  "/housing-loan",
  "/income-tax",
  "/car-loan",
  "/fixed-deposit",
  "/normal",
  "/scientific",
  "/faraid",
  "/zakat",
  "/wasiat",
  "/bmi",
];

export const toolBrand = {
  name: "HelloKalku",
  tagline: "Smart calculators for everyday decisions",
};
