// Stripped-down router used when the user lands on /embed/<calculator>.
// Renders ONE calculator with no global header, no nav, no footer, no
// LeadCapture cards, no sidebars. A small "Powered by HelloKalku" chip
// stays at the bottom for attribution.
//
// Height changes are posted to the parent window via postMessage so partners
// can auto-resize their iframe without a hardcoded height. A matching helper
// script (public/embed.js) is provided for partners to drop in.

import { Switch, Route, Router } from "wouter";
import { useEffect, useRef } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useLocaleState, LocaleContext } from "@/hooks/use-locale";
import { useLocale } from "@/hooks/use-locale";
import { isLocale, type Locale } from "@/lib/i18n";

import SalaryCalculator from "@/pages/SalaryCalculator";
import NormalCalculator from "@/pages/NormalCalculator";
import ScientificCalculator from "@/pages/ScientificCalculator";
import FaraidCalculator from "@/pages/FaraidCalculator";
import ZakatCalculator from "@/pages/ZakatCalculator";

interface EmbedFrameProps {
  children: React.ReactNode;
}

function EmbedFrame({ children }: EmbedFrameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Notify the parent window of our content height whenever it changes so
  // partners can resize the iframe in real time. We post a structured object
  // including the calculator slug and origin info so a single message handler
  // on the partner side can disambiguate multiple embeds.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const post = () => {
      const height = el.scrollHeight;
      try {
        window.parent?.postMessage(
          {
            type: "hellokalku-resize",
            source: "hellokalku-embed",
            height,
            path: window.location.pathname,
          },
          "*",
        );
      } catch {
        /* same-origin only or parent gone — ignore */
      }
    };
    post();
    const ro = new ResizeObserver(post);
    ro.observe(el);
    // Also re-post on initial paint, font swap, async data loads.
    const id = window.setInterval(post, 1500);
    return () => {
      ro.disconnect();
      window.clearInterval(id);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-[100px] bg-background text-foreground"
      data-embed="hellokalku"
    >
      {children}
      <EmbedFooter />
    </div>
  );
}

function EmbedFooter() {
  const { locale } = useLocale();
  return (
    <div className="border-t mt-6 px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
      <span>
        Powered by{" "}
        <a
          href={`https://hellokalku.com/${locale}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground hover:text-primary underline-offset-2 hover:underline"
        >
          HelloKalku
        </a>
      </span>
      <span className="opacity-60">hellokalku.com</span>
    </div>
  );
}

// Reads ?locale=ms / ?locale=id from the iframe URL so partners can pin a
// language without round-tripping through our locale switcher.
function localeFromQuery(): Locale | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const candidate = params.get("locale");
    return isLocale(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function EmbedRoutes() {
  return (
    <Router base="/embed">
      <Switch>
        <Route path="/salary">
          <EmbedFrame>
            <div className="p-3">
              <SalaryCalculator />
            </div>
          </EmbedFrame>
        </Route>
        <Route path="/normal">
          <EmbedFrame>
            <div className="p-3">
              <NormalCalculator onCalculate={() => undefined} />
            </div>
          </EmbedFrame>
        </Route>
        <Route path="/scientific">
          <EmbedFrame>
            <div className="p-3">
              <ScientificCalculator onCalculate={() => undefined} />
            </div>
          </EmbedFrame>
        </Route>
        <Route path="/faraid">
          <EmbedFrame>
            <div className="p-3">
              <FaraidCalculator onCalculate={() => undefined} />
            </div>
          </EmbedFrame>
        </Route>
        <Route path="/zakat">
          <EmbedFrame>
            <div className="p-3">
              <ZakatCalculator />
            </div>
          </EmbedFrame>
        </Route>
        <Route>
          <EmbedFrame>
            <div className="p-6 text-sm text-muted-foreground">
              Unknown embed. Try{" "}
              <code className="font-mono">/embed/salary</code>,{" "}
              <code className="font-mono">/embed/zakat</code>, or{" "}
              <code className="font-mono">/embed/faraid</code>.
            </div>
          </EmbedFrame>
        </Route>
      </Switch>
    </Router>
  );
}

export default function EmbedApp() {
  // The embed app uses the same i18n state machine as the main app but seeds
  // the locale from a `?locale=` query param when supplied, so partners can
  // pin language without our header switcher.
  const localeState = useLocaleState();
  useEffect(() => {
    const fromQuery = localeFromQuery();
    if (fromQuery && fromQuery !== localeState.locale) {
      localeState.setLocale(fromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleContext.Provider value={localeState}>
        <EmbedRoutes />
      </LocaleContext.Provider>
    </QueryClientProvider>
  );
}
