import {
  Calculator,
  CircleDollarSign,
  FileText,
  FlaskConical,
  Landmark,
  PiggyBank,
  Scale,
  Sigma,
  Star,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "Finance" | "Math" | "Islamic" | "Documents";

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
];

export const navTools = ["/salary", "/epf-retirement", "/normal", "/scientific", "/faraid", "/zakat", "/wasiat"];

export const toolBrand = {
  name: "HelloKalku",
  tagline: "Smart calculators for everyday decisions",
};
