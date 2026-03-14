import { Link } from "wouter";
import { Calculator, FlaskConical, Scale, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const tools = [
  {
    title: "Basic Calculator",
    description: "Standard arithmetic operations — addition, subtraction, multiplication, and division.",
    icon: Calculator,
    href: "/normal",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    title: "Scientific Calculator",
    description: "Trigonometric functions, logarithms, powers, factorials, and more.",
    icon: FlaskConical,
    href: "/scientific",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    title: "Faraid Calculator",
    description: "Simplified Islamic inheritance distribution — prototype for basic estate scenarios.",
    icon: Scale,
    href: "/faraid",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto" data-testid="page-home">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Online Calculators</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Free browser-based calculators with history saved locally.
        </p>
      </div>

      <div className="grid gap-3">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="group cursor-pointer border-card-border hover:border-primary/30 transition-colors" data-testid={`card-${tool.href.slice(1)}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${tool.bg} flex items-center justify-center flex-shrink-0`}>
                  <tool.icon className={`w-5 h-5 ${tool.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold">{tool.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tool.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
