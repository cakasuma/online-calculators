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
import { toolBrand } from "@/config/tools";
import { initAnalytics, track } from "@/lib/analytics";

import HomePage from "@/pages/Home";
import NormalCalculator from "@/pages/NormalCalculator";
import ScientificCalculator from "@/pages/ScientificCalculator";
import FaraidCalculator from "@/pages/FaraidCalculator";
import WasiatGuide from "@/pages/WasiatGuide";
import ZakatCalculator from "@/pages/ZakatCalculator";
import SalaryCalculator from "@/pages/SalaryCalculator";
import EpfCalculator from "@/pages/EpfCalculator";
import HousingLoanCalculator from "@/pages/HousingLoanCalculator";
import IncomeTaxCalculator from "@/pages/IncomeTaxCalculator";
import BmiCalculator from "@/pages/BmiCalculator";
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

type FooterLink = { labelKey?: TranslationKey; label?: string; href: string };
type FooterCol = { heading: string; links: FooterLink[] };

const FOOTER_COLS: FooterCol[] = [
  {
    heading: "Finance",
    links: [
      { labelKey: "nav.salary", href: "/salary" },
      { labelKey: "nav.epf", href: "/epf-retirement" },
    ],
  },
  {
    heading: "Islamic",
    links: [
      { labelKey: "nav.faraid", href: "/faraid" },
      { labelKey: "nav.zakat", href: "/zakat" },
      { labelKey: "nav.wasiat", href: "/wasiat" },
    ],
  },
  {
    heading: "Math",
    links: [
      { labelKey: "nav.basic", href: "/normal" },
      { labelKey: "nav.scientific", href: "/scientific" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { label: "Guides", href: "/blog" },
      { labelKey: "footer.partners", href: "/partners" },
      { labelKey: "footer.privacy", href: "/privacy" },
      { labelKey: "footer.terms", href: "/terms" },
    ],
  },
];

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "";
const adsenseSlotTop = import.meta.env.VITE_ADSENSE_SLOT_TOP?.trim() || "";
const adsenseEnabled = import.meta.env.PROD && Boolean(adsenseClient);

/** Padded, centred wrapper for pages that are NOT full-bleed redesigns
 *  (static/legal pages, 404). Restores the old contained layout now that
 *  <main> is layout-neutral. */
function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="hk-container py-6 md:py-10 max-w-[900px]">{children}</div>;
}

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

  useEffect(() => {
    initAnalytics();
  }, []);

  // Close the mobile nav drawer whenever the route changes
  useEffect(() => {
    setShowMobileNav(false);
  }, [location]);

  useEffect(() => {
    // Blog article pages manage their own meta tags via the BlogArticle component
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
    (calculator: "normal" | "scientific" | "faraid" | "salary" | "zakat" | "epf" | "housing" | "tax" | "bmi") =>
      (expression: string, result: string, url?: string) => {
        history.add(calculator, expression, result, url);
      },
    [history],
  );

  return (
    <div className={`min-h-screen flex flex-col${location === "/faraid" ? " theme-faraid" : ""}`}>
      {/* ── NAV (60px, sticky, blurred) ── */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border safe-area-top">
        <div className="hk-container h-[60px] flex items-center justify-between gap-3">
          {/* Left: hamburger (mobile) + logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowMobileNav(true)}
              className="md:hidden p-2 -ml-1 rounded-lg hover:bg-muted text-foreground transition-colors"
              aria-label={t("a11y.navToggle")}
              aria-expanded={showMobileNav}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center shrink-0">
                <span className="text-white font-extrabold text-[13px] leading-none tracking-tight">HK</span>
              </span>
              <span className="text-[17px] font-bold text-foreground" data-testid="text-site-title">
                {toolBrand.name}
              </span>
            </Link>
          </div>

          {/* Centre: desktop nav */}
          <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
            <Link href="/">
              <span className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                location === "/" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}>
                {t("nav.home")}
              </span>
            </Link>
            <Link href="/blog">
              <span className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                location.startsWith("/blog") ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}>
                Guides
              </span>
            </Link>
            {NAV_GROUPS.map((group) => {
              const isGroupActive = group.items.some((item) => item.href === location);
              return (
                <DropdownMenu key={group.labelKey}>
                  <DropdownMenuTrigger asChild>
                    <button className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer outline-none ${
                      isGroupActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}>
                      {t(group.labelKey)}
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[180px]">
                    {group.items.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href}>
                          <span className={`flex items-center gap-2 w-full cursor-pointer ${item.href === location ? "text-primary" : ""}`}>
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

          {/* Right: locale + history + theme */}
          <div className="flex items-center gap-1.5">
            <LocaleSwitcher />
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg border transition-colors ${
                showHistory ? "bg-primary/10 text-primary border-primary/30" : "border-border hover:bg-muted text-muted-foreground"
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
      </header>

      {/* ── MOBILE NAV DRAWER (slide-in from right) ── */}
      {showMobileNav && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileNav(false)} aria-hidden="true" />
          <div className="hk-drawer absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-background border-l border-border overflow-y-auto p-4" id="mobile-nav" data-testid="nav-mobile">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu</span>
              <button onClick={() => setShowMobileNav(false)} className="p-1.5 rounded-lg hover:bg-muted" aria-label={t("a11y.navToggle")}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <Link href="/">
              <span className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors mb-0.5 ${
                location === "/" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}>
                <HomeIcon className="w-4 h-4" />
                {t("nav.home")}
              </span>
            </Link>
            <Link href="/blog">
              <span className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors mb-0.5 ${
                location.startsWith("/blog") ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
                      item.href === location ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
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

      {/* ── MAIN (layout-neutral; redesigned pages are full-bleed) ── */}
      <main className="flex-1 min-w-0 w-full pb-16 md:pb-0">
        {/* Global top ad — only mounts in production when a slot is configured,
            so the full-bleed hero stays flush under the nav everywhere else. */}
        {adsenseEnabled && adsenseSlotTop && (
          <div className="hk-container pt-4">
            <AdSlot id="global-top-ad" client={adsenseClient} slot={adsenseSlotTop} enabled={adsenseEnabled} className="mb-2" />
          </div>
        )}
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
          <Route path="/housing-loan">
            <HousingLoanCalculator onCalculate={handleCalculate("housing")} />
            <CalculatorContent slug="housing" />
          </Route>
          <Route path="/income-tax">
            <IncomeTaxCalculator onCalculate={handleCalculate("tax")} />
            <CalculatorContent slug="tax" />
          </Route>
          <Route path="/bmi">
            <BmiCalculator onCalculate={handleCalculate("bmi")} />
            <CalculatorContent slug="bmi" />
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
          <Route path="/partners"><PageContainer><Partners /></PageContainer></Route>
          <Route path="/privacy"><PageContainer><PrivacyPolicy /></PageContainer></Route>
          <Route path="/terms"><PageContainer><TermsOfUse /></PageContainer></Route>
          <Route><PageContainer><NotFound /></PageContainer></Route>
        </Switch>
      </main>

      {/* ── HISTORY (right-side overlay drawer, all sizes) ── */}
      {showHistory && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHistory(false)} aria-hidden="true" />
          <div className="hk-drawer absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-l border-border p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">{t("common.history")}</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 rounded-lg hover:bg-muted" data-testid="button-close-history">
                <X className="w-5 h-5" />
              </button>
            </div>
            <HistoryPanel entries={history.entries} onClear={history.clear} onRemove={history.remove} />
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom"
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
                <span
                  className={`flex flex-col items-center justify-center gap-0.5 h-14 w-full cursor-pointer transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium leading-none">{t(labelKey)}</span>
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex flex-col items-center justify-center gap-0.5 h-14 w-full cursor-pointer transition-colors ${
              showHistory ? "text-primary" : "text-muted-foreground"
            }`}
            aria-label={t("a11y.historyToggle")}
            aria-expanded={showHistory}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{t("common.history")}</span>
          </button>
        </div>
      </nav>

      {/* ── FOOTER (dark, brand + 4 link cols + locale row) ── */}
      <footer className="hk-why text-white pb-20 md:pb-0 safe-area-bottom">
        <div className="hk-container py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center shrink-0">
                  <span className="text-white font-extrabold text-[13px] leading-none tracking-tight">HK</span>
                </span>
                <span className="text-white font-bold text-[16px]">{toolBrand.name}</span>
              </div>
              <p className="text-[13px] text-white/45 leading-relaxed max-w-[220px]">{t("brand.tagline")}</p>
              <p className="text-[12px] text-white/30 mt-3">
                {t("footer.builtBy")}{" "}
                <a href="https://amammustofa.com" target="_blank" rel="noopener noreferrer me"
                  className="text-white/55 hover:text-white transition-colors underline underline-offset-2">
                  amammustofa.com
                </a>
              </p>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.heading}>
                <p className="text-[11px] font-bold text-white/35 uppercase tracking-widest mb-3.5">{col.heading}</p>
                {col.links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <span className="block text-[13px] text-white/55 hover:text-white transition-colors cursor-pointer mb-2.5">
                      {link.labelKey ? t(link.labelKey) : link.label}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[12px] text-white/35">
              © {new Date().getFullYear()} {toolBrand.name}. Free to use.
            </p>
            <LocaleSwitcher />
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
