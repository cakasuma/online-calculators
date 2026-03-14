import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import {
  Calculator,
  FlaskConical,
  Scale,
  Sun,
  Moon,
  History,
  Home as HomeIcon,
  X,
  Menu,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useHistory } from "@/hooks/use-history";
import { useLocaleState, LocaleContext } from "@/hooks/use-locale";
import { useLocale } from "@/hooks/use-locale";
import { HistoryPanel } from "@/components/HistoryPanel";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import type { TranslationKey } from "@/lib/i18n";

import HomePage from "@/pages/Home";
import NormalCalculator from "@/pages/NormalCalculator";
import ScientificCalculator from "@/pages/ScientificCalculator";
import FaraidCalculator from "@/pages/FaraidCalculator";
import NotFound from "@/pages/not-found";

const navItems: { href: string; labelKey: TranslationKey; icon: typeof HomeIcon }[] = [
  { href: "/", labelKey: "nav.home", icon: HomeIcon },
  { href: "/normal", labelKey: "nav.basic", icon: Calculator },
  { href: "/scientific", labelKey: "nav.scientific", icon: FlaskConical },
  { href: "/faraid", labelKey: "nav.faraid", icon: Scale },
];

function Layout() {
  const { theme, toggle } = useTheme();
  const history = useHistory();
  const { t } = useLocale();
  const [showHistory, setShowHistory] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [location] = useLocation();

  const handleCalculate = useCallback(
    (calculator: "normal" | "scientific" | "faraid") =>
      (expression: string, result: string) => {
        history.add(calculator, expression, result);
      },
    [history]
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="md:hidden p-1.5 rounded-md hover:bg-muted"
              data-testid="button-mobile-menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-label="Calculator logo"
                >
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <line x1="8" y1="6" x2="16" y2="6" />
                  <line x1="8" y1="10" x2="10" y2="10" />
                  <line x1="14" y1="10" x2="16" y2="10" />
                  <line x1="8" y1="14" x2="10" y2="14" />
                  <line x1="14" y1="14" x2="16" y2="14" />
                  <line x1="8" y1="18" x2="16" y2="18" />
                </svg>
              </div>
              <span className="text-sm font-semibold hidden sm:inline" data-testid="text-site-title">
                {t("site.title")}
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-md transition-colors ${
                showHistory ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
              }`}
              data-testid="button-toggle-history"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={toggle}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {showMobileNav && (
          <div className="md:hidden border-t bg-background px-4 py-2 space-y-1" data-testid="nav-mobile">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    onClick={() => setShowMobileNav(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main content area */}
      <div className="flex-1 flex">
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/normal">
              <NormalCalculator onCalculate={handleCalculate("normal")} />
            </Route>
            <Route path="/scientific">
              <ScientificCalculator onCalculate={handleCalculate("scientific")} />
            </Route>
            <Route path="/faraid">
              <FaraidCalculator onCalculate={handleCalculate("faraid")} />
            </Route>
            <Route component={NotFound} />
          </Switch>
        </main>

        {/* History sidebar */}
        {showHistory && (
          <aside className="w-72 lg:w-80 border-l bg-card/50 p-4 hidden md:block overflow-y-auto max-h-[calc(100vh-3rem)]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">{t("common.history")}</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 rounded hover:bg-muted"
                data-testid="button-close-history"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <HistoryPanel
              entries={history.entries}
              onClear={history.clear}
              onRemove={history.remove}
            />
          </aside>
        )}
      </div>

      {/* Mobile history drawer */}
      {showHistory && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHistory(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-l p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">{t("common.history")}</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1.5 rounded hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <HistoryPanel
              entries={history.entries}
              onClear={history.clear}
              onRemove={history.remove}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} amammustofa.com</span>
          <PerplexityAttribution />
        </div>
      </footer>

      {/* Vercel Analytics */}
      <Analytics />
    </div>
  );
}

function App() {
  const localeState = useLocaleState();

  return (
    <LocaleContext.Provider value={localeState}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <Layout />
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </LocaleContext.Provider>
  );
}

export default App;
