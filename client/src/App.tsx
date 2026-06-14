import { Switch, Route, Router, Link, useLocation } from "wouter";
import type { TranslationKey } from "@/lib/i18n";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { routes as seoRoutes, canonicalUrl } from "@/config/seo";
import { CalculatorContent } from "@/components/CalculatorContent";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import {
  Calculator,
  ChevronDown,
  FlaskConical,
  Scale,
  Sun,
  Moon,
  History,
  Home as HomeIcon,
  X,
  Menu,
  FileText,
  PiggyBank,
  Star,
  Wallet,
  BookOpen,
  Github,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useHistory } from "@/hooks/use-history";
import { useLocaleState, LocaleContext } from "@/hooks/use-locale";
import { useLocale } from "@/hooks/use-locale";
import { HistoryPanel } from "@/components/HistoryPanel";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { AdSlot } from "@/components/AdSlot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tools, toolBrand } from "@/config/tools";
import { initAnalytics, track } from "@/lib/analytics";

import HomePage from "@/pages/Home";
import NormalCalculator from "@/pages/NormalCalculator";
import ScientificCalculator from "@/pages/ScientificCalculator";
import FaraidCalculator from "@/pages/FaraidCalculator";
import WasiatGuide from "@/pages/WasiatGuide";
import ZakatCalculator from "@/pages/ZakatCalculator";
import SalaryCalculator from "@/pages/SalaryCalculator";
import EpfCalculator from "@/pages/EpfCalculator";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Partners from "@/pages/Partners";
import TermsOfUse from "@/pages/TermsOfUse";
import Blog from "@/pages/Blog";
import BlogArticle from "@/pages/BlogArticle";
import NotFound from "@/pages/not-found";

type NavItem = { href: string; labelKey: TranslationKey; icon: typeof HomeIcon };
type NavGroup = { labelKey: TranslationKey; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.groupFinance",
    items: [
      { href: "/salary", labelKey: "nav.salary", icon: Wallet },
      { href: "/epf-retirement", labelKey: "nav.epf", icon: PiggyBank },
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
];

const FOOTER_COLS = [
  {
    heading: "Finance",
    links: [
      { label: "Salary Calculator", href: "/salary" },
      { label: "EPF Retirement", href: "/epf-retirement" },
    ],
  },
  {
    heading: "Islamic Finance",
    links: [
      { label: "Faraid Calculator", href: "/faraid" },
      { label: "Zakat Calculator", href: "/zakat" },
      { label: "Wasiat Guide", href: "/wasiat" },
    ],
  },
  {
    heading: "Math",
    links: [
      { label: "Basic Calculator", href: "/normal" },
      { label: "Scientific Calculator", href: "/scientific" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Guides", href: "/blog" },
      { label: "Partners", href: "/partners" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
    ],
  },
];

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "";
const adsenseSlotTop = import.meta.env.VITE_ADSENSE_SLOT_TOP?.trim() || "";
const adsenseEnabled = import.meta.env.PROD && Boolean(adsenseClient);

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLinkTag(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function Layout() {
  const { theme, toggle } = useTheme();
  const history = useHistory();
  const { t, locale } = useLocale();
  const [showHistory, setShowHistory] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [location] = useLocation();

  useEffect(() => { initAnalytics(); }, []);

  // Close mobile nav on route change
  useEffect(() => { setShowMobileNav(false); }, [location]);

  useEffect(() => {
    if (/^\/blog\/.+/.test(location)) {
      track("pageview", { path: location });
      return;
    }
    const route = seoRoutes.find((r) => r.path === location) ?? seoRoutes[0];
    const copy = route.copy[locale] ?? route.copy.en;
    document.title = copy.title;
    document.documentElement.lang = locale;
    setMetaTag("name", "description", copy.description);
    if (copy.keywords) setMetaTag("name", "keywords", copy.keywords);
    const canonical = canonicalUrl(locale, route.path);
    setLinkTag("canonical", canonical);
    for (const alt of SUPPORTED_LOCALES) {
      setLinkTag("alternate", canonicalUrl(alt, route.path), alt);
    }
    setLinkTag("alternate", canonicalUrl("en", route.path), "x-default");
    setMetaTag("property", "og:title", copy.title);
    setMetaTag("property", "og:description", copy.description);
    setMetaTag("property", "og:url", canonical);
    setMetaTag("property", "og:type", route.slug === "home" ? "website" : "article");
    const ogLocale = locale === "ms" ? "ms_MY" : locale === "id" ? "id_ID" : "en_US";
    setMetaTag("property", "og:locale", ogLocale);
    setMetaTag("name", "twitter:title", copy.title);
    setMetaTag("name", "twitter:description", copy.description);
    track("pageview", { path: location });
  }, [location, locale]);

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
    (calculator: "normal" | "scientific" | "faraid" | "salary" | "zakat" | "epf") =>
      (expression: string, result: string, url?: string) => {
        history.add(calculator, expression, result, url);
      },
    [history],
  );

  return (
    <div className={`min-h-screen flex flex-col${location === "/faraid" ? " theme-faraid" : ""}`}>
      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 safe-area-top hk-nav">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 h-[60px] flex items-center justify-between gap-3">

          {/* Left: hamburger (mobile) + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="md:hidden p-2 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors"
              aria-label={t("a11y.navToggle")}
              aria-expanded={showMobileNav}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-2 group shrink-0">
              {/* Brand logo icon */}
              <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center shrink-0">
                <span className="text-white font-extrabold text-[13px] leading-none">HK</span>
              </div>
              <span className="hidden sm:block text-[17px] font-bold text-foreground" data-testid="text-site-title">
                {toolBrand.name}
              </span>
            </Link>
          </div>

          {/* Centre: desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center" data-testid="nav-desktop">
            <Link href="/">
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                location === "/"
                  ? "bg-[#eff6ff] text-[#2563eb] font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}>
                {t("nav.home")}
              </span>
            </Link>

            <Link href="/blog">
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                location.startsWith("/blog")
                  ? "bg-[#eff6ff] text-[#2563eb] font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}>
                <BookOpen className="w-3.5 h-3.5" />
                Guides
              </span>
            </Link>

            {NAV_GROUPS.map((group) => {
              const isGroupActive = group.items.some((item) => item.href === location);
              return (
                <DropdownMenu key={group.labelKey}>
                  <DropdownMenuTrigger asChild>
                    <button className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer outline-none ${
                      isGroupActive
                        ? "bg-[#eff6ff] text-[#2563eb] font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}>
                      {t(group.labelKey)}
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[180px]">
                    {group.items.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href}>
                          <span className={`flex items-center gap-2 w-full cursor-pointer ${item.href === location ? "text-[#2563eb]" : ""}`}>
                            <item.icon className="w-4 h-4 shrink-0" />
                            {t(item.labelKey)}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </nav>

          {/* Right: locale + history + dark mode */}
          <div className="flex items-center gap-1 shrink-0">
            <LocaleSwitcher />
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg border transition-colors text-sm font-medium ${
                showHistory
                  ? "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]"
                  : "hover:bg-muted text-muted-foreground border-border"
              }`}
              aria-label={t("a11y.historyToggle")}
              aria-expanded={showHistory}
              data-testid="button-toggle-history"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={toggle}
              className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors"
              aria-label={theme === "dark" ? t("a11y.themeToggle.light") : t("a11y.themeToggle.dark")}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer overlay */}
        {showMobileNav && (
          <div className="md:hidden fixed inset-0 z-50 top-[60px] flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowMobileNav(false)}
              aria-hidden="true"
            />
            {/* Slide-in panel from right */}
            <div className="hk-mobile-drawer absolute right-0 top-0 bottom-0 w-72 bg-background border-l border-border overflow-y-auto p-4" id="mobile-nav" data-testid="nav-mobile">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Menu</span>
                <button
                  onClick={() => setShowMobileNav(false)}
                  className="p-1.5 rounded-lg hover:bg-muted"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <Link href="/">
                <span className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors mb-1 ${
                  location === "/" ? "bg-[#eff6ff] text-[#2563eb] font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}>
                  <HomeIcon className="w-4 h-4" />
                  {t("nav.home")}
                </span>
              </Link>

              <Link href="/blog">
                <span className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors mb-1 ${
                  location.startsWith("/blog") ? "bg-[#eff6ff] text-[#2563eb] font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}>
                  <BookOpen className="w-4 h-4" />
                  Guides
                </span>
              </Link>

              {NAV_GROUPS.map((group) => (
                <div key={group.labelKey} className="mt-4">
                  <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    {t(group.labelKey)}
                  </p>
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <span className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors mb-0.5 ${
                        item.href === location ? "bg-[#eff6ff] text-[#2563eb] font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}>
                        <item.icon className="w-4 h-4" />
                        {t(item.labelKey)}
                      </span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex w-full min-w-0">
        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-full overflow-x-hidden pb-20 md:pb-8 lg:pb-8">
          <AdSlot id="global-top-ad" client={adsenseClient} slot={adsenseSlotTop} enabled={adsenseEnabled} className="mb-4" />
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/salary">
              <SalaryCalculator onCalculate={handleCalculate("salary")} />
              <CalculatorContent slug="salary" />
            </Route>
            <Route path="/epf-retirement">
              <EpfCalculator onCalculate={handleCalculate("epf")} />
              <CalculatorContent slug="epf" />
            </Route>
            <Route path="/normal">
              <NormalCalculator onCalculate={handleCalculate("normal")} />
              <CalculatorContent slug="normal" />
            </Route>
            <Route path="/scientific">
              <ScientificCalculator onCalculate={handleCalculate("scientific")} />
              <CalculatorContent slug="scientific" />
            </Route>
            <Route path="/faraid">
              <FaraidCalculator onCalculate={handleCalculate("faraid")} />
              <CalculatorContent slug="faraid" />
            </Route>
            <Route path="/wasiat">
              <WasiatGuide />
              <CalculatorContent slug="wasiat" />
            </Route>
            <Route path="/zakat">
              <ZakatCalculator onCalculate={handleCalculate("zakat")} />
              <CalculatorContent slug="zakat" />
            </Route>
            <Route path="/blog" component={Blog} />
            <Route path="/blog/:slug">
              {(params: { slug?: string }) => <BlogArticle slug={params?.slug ?? ""} />}
            </Route>
            <Route path="/partners" component={Partners} />
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

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t safe-area-bottom"
        aria-label={t("a11y.navToggle")}
      >
        <div className="grid grid-cols-5 h-14">
          {([
            { href: "/", icon: HomeIcon, labelKey: "nav.home" as TranslationKey },
            { href: "/salary", icon: Wallet, labelKey: "nav.salary" as TranslationKey },
            { href: "/faraid", icon: Scale, labelKey: "nav.faraid" as TranslationKey },
            { href: "/normal", icon: Calculator, labelKey: "nav.basic" as TranslationKey },
          ] as { href: string; icon: typeof HomeIcon; labelKey: TranslationKey }[]).map(({ href, icon: Icon, labelKey }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href}>
                <span className={`flex flex-col items-center justify-center gap-0.5 h-14 w-full cursor-pointer transition-colors ${
                  isActive ? "text-[#2563eb]" : "text-muted-foreground"
                }`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium leading-none">{t(labelKey)}</span>
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex flex-col items-center justify-center gap-0.5 h-14 w-full cursor-pointer transition-colors ${
              showHistory ? "text-[#2563eb]" : "text-muted-foreground"
            }`}
            aria-label={t("a11y.historyToggle")}
            aria-expanded={showHistory}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{t("common.history")}</span>
          </button>
        </div>
      </nav>

      {/* ── FOOTER (redesigned) ── */}
      <footer className="hk-footer pb-20 md:pb-0 safe-area-bottom">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-12 md:py-16">
          {/* Top row: brand + 4-col links */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center shrink-0">
                  <span className="text-white font-extrabold text-[13px] leading-none">HK</span>
                </div>
                <span className="text-white font-bold text-[16px]">{toolBrand.name}</span>
              </div>
              <p className="text-[13px] text-white/45 leading-relaxed max-w-[200px]">
                {t("brand.tagline")}
              </p>
              <p className="text-[12px] text-white/30 mt-3">
                {t("footer.builtBy")}{" "}
                <a
                  href="https://amammustofa.com"
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="text-white/50 hover:text-white transition-colors underline underline-offset-2"
                >
                  amammustofa.com
                </a>
              </p>
            </div>

            {/* Link columns */}
            {FOOTER_COLS.map((col) => (
              <div key={col.heading}>
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3">{col.heading}</p>
                {col.links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <span className="block text-[13px] text-white/55 hover:text-white transition-colors cursor-pointer mb-2">
                      {link.label}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom row: copyright + locale switcher */}
          <div className="border-t border-white/8 mt-10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[12px] text-white/30">
              © {new Date().getFullYear()} {toolBrand.name}. Free to use.
            </p>
            <div className="flex items-center gap-3">
              {/* Re-use the existing LocaleSwitcher but it renders in dark context */}
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </footer>

      <Analytics />
    </div>
  );
}

function LocaleAwareRouter({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  return <Router base={`/${locale}`}>{children}</Router>;
}

function App() {
  const localeState = useLocaleState();

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleContext.Provider value={localeState}>
        <TooltipProvider>
          <Toaster />
          <LocaleAwareRouter>
            <Layout />
          </LocaleAwareRouter>
        </TooltipProvider>
      </LocaleContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
