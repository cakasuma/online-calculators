import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import type { Locale, TranslationKey } from "@/lib/i18n";
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
  FileText,
  Star,
  Wallet,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useHistory } from "@/hooks/use-history";
import { useLocaleState, LocaleContext } from "@/hooks/use-locale";
import { useLocale } from "@/hooks/use-locale";
import { HistoryPanel } from "@/components/HistoryPanel";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { AdSlot } from "@/components/AdSlot";
import { tools, toolBrand } from "@/config/tools";
import { initAnalytics, track } from "@/lib/analytics";

import HomePage from "@/pages/Home";
import NormalCalculator from "@/pages/NormalCalculator";
import ScientificCalculator from "@/pages/ScientificCalculator";
import FaraidCalculator from "@/pages/FaraidCalculator";
import WasiatGuide from "@/pages/WasiatGuide";
import ZakatCalculator from "@/pages/ZakatCalculator";
import SalaryCalculator from "@/pages/SalaryCalculator";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfUse from "@/pages/TermsOfUse";
import NotFound from "@/pages/not-found";

const SUPPORTED_LOCALES: Locale[] = ["en", "id"];

function getCurrentUrlLang(): Locale {
  try {
    const hash = window.location.hash;
    const path = hash.startsWith("#/") ? hash.slice(2) : "";
    const first = path.split("/")[0] as Locale;
    if (SUPPORTED_LOCALES.includes(first)) return first;
  } catch {
    /* noop */
  }
  try {
    const saved = localStorage.getItem("calc_locale") as Locale;
    if (SUPPORTED_LOCALES.includes(saved)) return saved;
  } catch {
    /* noop */
  }
  const nav = navigator.language?.toLowerCase() || "";
  return nav.startsWith("id") || nav.startsWith("ms") ? "id" : "en";
}

function useLocalizedHashLocation(): [string, (to: string) => void] {
  const [hashPath, setHashPath] = useHashLocation();
  const segments = hashPath.split("/").filter(Boolean);
  const hasLangPrefix = segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0] as Locale);
  const cleanPath = hasLangPrefix ? "/" + segments.slice(1).join("/") || "/" : hashPath;

  const navigate = (to: string) => {
    const lang = getCurrentUrlLang();
    setHashPath("/" + lang + (to === "/" ? "" : to));
  };

  return [cleanPath || "/", navigate];
}

const navItems: { href: string; labelKey: TranslationKey; icon: typeof HomeIcon }[] = [
  { href: "/", labelKey: "nav.home", icon: HomeIcon },
  { href: "/salary", labelKey: "nav.salary", icon: Wallet },
  { href: "/normal", labelKey: "nav.basic", icon: Calculator },
  { href: "/scientific", labelKey: "nav.scientific", icon: FlaskConical },
  { href: "/faraid", labelKey: "nav.faraid", icon: Scale },
  { href: "/zakat", labelKey: "nav.zakat", icon: Star },
  { href: "/wasiat", labelKey: "nav.wasiat", icon: FileText },
];

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "";
const adsenseSlotTop = import.meta.env.VITE_ADSENSE_SLOT_TOP?.trim() || "";
const adsenseEnabled = import.meta.env.PROD && Boolean(adsenseClient);

const routeSeo: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Online Calculators for Malaysia | HelloKalku",
    description:
      "Free calculators for salary, scientific math, faraid inheritance, zakat, and wasiat planning for Malaysia.",
  },
  "/salary": {
    title: "Malaysia Salary Calculator | HelloKalku",
    description: "Estimate take-home pay with EPF, SOCSO, EIS, and PCB deductions for Malaysia.",
  },
  "/normal": {
    title: "Basic Calculator Online | HelloKalku",
    description: "Use a fast basic calculator for daily arithmetic with local history storage.",
  },
  "/scientific": {
    title: "Scientific Calculator Online | HelloKalku",
    description: "Solve advanced math equations with trigonometry, logarithms, powers, and constants.",
  },
  "/faraid": {
    title: "Faraid Calculator (Islamic Inheritance) | HelloKalku",
    description: "Calculate inheritance shares using simplified faraid logic and heir distribution guidance.",
  },
  "/zakat": {
    title: "Zakat Calculator Malaysia | HelloKalku",
    description: "Estimate yearly zakat obligations based on your assets and liabilities.",
  },
  "/wasiat": {
    title: "Wasiat Guide & Checklist | HelloKalku",
    description: "Plan a practical Islamic will workflow with a printable checklist and action steps.",
  },
  "/privacy": {
    title: "Privacy Policy | HelloKalku",
    description: "Read how HelloKalku handles privacy, analytics, and advertising data across calculator tools.",
  },
  "/terms": {
    title: "Terms of Use | HelloKalku",
    description: "Review HelloKalku terms, service scope, and user responsibilities.",
  },
};

function Layout() {
  const { theme, toggle } = useTheme();
  const history = useHistory();
  const { t } = useLocale();
  const [showHistory, setShowHistory] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const seo = routeSeo[location] ?? routeSeo["/"];
    document.title = seo.title;

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute("content", seo.description);
    }

    track("pageview", { path: location });
  }, [location]);

  useEffect(() => {
    if (!adsenseEnabled) return;
    let accountMeta = document.querySelector('meta[name="google-adsense-account"]');
    if (!accountMeta) {
      accountMeta = document.createElement("meta");
      accountMeta.setAttribute("name", "google-adsense-account");
      document.head.appendChild(accountMeta);
    }
    accountMeta.setAttribute("content", adsenseClient);

    const existing = document.querySelector(`script[data-adsense-client="${adsenseClient}"]`);
    if (existing) return;

    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.adsenseClient = adsenseClient;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`;
    document.head.appendChild(script);
  }, [adsenseEnabled]);

  const handleCalculate = useCallback(
    (calculator: "normal" | "scientific" | "faraid") =>
      (expression: string, result: string) => {
        history.add(calculator, expression, result);
      },
    [history],
  );

  return (
    <div className={`min-h-screen flex flex-col${location === "/faraid" ? " theme-faraid" : ""}`}>
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="md:hidden p-2.5 rounded-lg hover:bg-muted active:bg-muted/80"
              aria-label={t("a11y.navToggle")}
              aria-expanded={showMobileNav}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Calculator className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold block leading-tight" data-testid="text-site-title">
                  {toolBrand.name}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">hellokalku.com</span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
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
              className={`p-2.5 rounded-lg transition-colors ${
                showHistory ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
              }`}
              aria-label={t("a11y.historyToggle")}
              aria-expanded={showHistory}
              data-testid="button-toggle-history"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={toggle}
              className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground"
              aria-label={theme === "dark" ? t("a11y.themeToggle.light") : t("a11y.themeToggle.dark")}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {showMobileNav && <div className="md:hidden fixed inset-0 z-40 top-14" onClick={() => setShowMobileNav(false)} aria-hidden="true" />}

        {showMobileNav && (
          <div className="md:hidden border-t bg-background px-4 py-3 space-y-1 relative z-50" id="mobile-nav" data-testid="nav-mobile">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    onClick={() => setShowMobileNav(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium cursor-pointer transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <div className="flex-1 flex">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-full overflow-x-hidden">
          <AdSlot id="global-top-ad" client={adsenseClient} slot={adsenseSlotTop} enabled={adsenseEnabled} className="mb-4" />
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/salary" component={SalaryCalculator} />
            <Route path="/normal">
              <NormalCalculator onCalculate={handleCalculate("normal")} />
            </Route>
            <Route path="/scientific">
              <ScientificCalculator onCalculate={handleCalculate("scientific")} />
            </Route>
            <Route path="/faraid">
              <FaraidCalculator onCalculate={handleCalculate("faraid")} />
            </Route>
            <Route path="/wasiat" component={WasiatGuide} />
            <Route path="/zakat" component={ZakatCalculator} />
            <Route path="/privacy" component={PrivacyPolicy} />
            <Route path="/terms" component={TermsOfUse} />
            <Route component={NotFound} />
          </Switch>
        </main>

        {showHistory && (
          <aside className="w-72 lg:w-80 border-l bg-card/50 p-4 hidden md:block overflow-y-auto max-h-[calc(100vh-3rem)]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">{t("common.history")}</h2>
              <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg hover:bg-muted" data-testid="button-close-history">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <HistoryPanel entries={history.entries} onClear={history.clear} onRemove={history.remove} />
          </aside>
        )}
      </div>

      {showHistory && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHistory(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-l p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">{t("common.history")}</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <HistoryPanel entries={history.entries} onClear={history.clear} onRemove={history.remove} />
          </div>
        </div>
      )}

      <footer className="border-t py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">{toolBrand.name}</span>
            <p>{t("brand.tagline")}</p>
            <p className="mt-1">
              {t("footer.builtBy")}{" "}
              <a
                href="https://amammustofa.com"
                target="_blank"
                rel="noopener noreferrer me"
                className="text-primary hover:underline underline-offset-2"
              >
                amammustofa.com
              </a>
            </p>
          </div>
          <nav className="flex items-center gap-3 flex-wrap justify-center" aria-label={t("footer.quickLinks")}>
            {tools.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className="hover:text-foreground transition-colors cursor-pointer">{t(`tools.${item.slug}.name` as any)}</span>
              </Link>
            ))}
            <Link href="/privacy">
              <span className="hover:text-foreground transition-colors cursor-pointer">{t("footer.privacy")}</span>
            </Link>
            <Link href="/terms">
              <span className="hover:text-foreground transition-colors cursor-pointer">{t("footer.terms")}</span>
            </Link>
          </nav>
        </div>
      </footer>

      <Analytics />
    </div>
  );
}

function App() {
  const localeState = useLocaleState();

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleContext.Provider value={localeState}>
        <TooltipProvider>
          <Toaster />
          <Router hook={useLocalizedHashLocation}>
            <Layout />
          </Router>
        </TooltipProvider>
      </LocaleContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
