import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the database
  // (currently using in-memory storage, which will reset on server restart)

  app.get("/api/metal-prices", async (req, res) => {
    const currency = (req.query.currency as string) || "MYR";

    // ── Primary source: GoldPrice.org (spot prices) ──────────────────────────
    try {
      const [gpRes, fxRes] = await Promise.all([
        fetch(`https://data-asg.goldprice.org/dbXRates/USD`, {
          headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
        }),
        fetch("https://open.er-api.com/v6/latest/USD")
      ]);

      const [gpData, fxData] = await Promise.all([gpRes.json(), fxRes.json()]);

      const metalPriceItem = gpData?.items?.[0];
      const goldUsdOz: number | undefined = metalPriceItem?.xauPrice;
      const silverUsdOz: number | undefined = metalPriceItem?.xagPrice;
      const fxRate: number = fxData?.rates?.[currency] ?? 1;

      if (typeof goldUsdOz === "number" && goldUsdOz > 0 && typeof silverUsdOz === "number" && silverUsdOz > 0) {
        const silverPerGram = parseFloat((silverUsdOz / 31.1035 * fxRate).toFixed(4));
        const goldPerGram = parseFloat((goldUsdOz / 31.1035 * fxRate).toFixed(2));
        return res.json({
          silverPerGram,
          goldPerGram,
          currency,
          fxRate,
          source: "GoldPrice.org",
          sourceUrl: "https://goldprice.org",
        });
      }
    } catch (err) {
      // log so the fallback can be diagnosed in production
      console.error("GoldPrice.org fetch failed:", err);
      // fall through to Yahoo Finance fallback
    }

    // ── Fallback source: Yahoo Finance ────────────────────────────────────────
    try {
      const [silverRes, goldRes, fxRes] = await Promise.all([
        fetch("https://query1.finance.yahoo.com/v8/finance/chart/SI%3DF?interval=1d&range=1d", {
          headers: { "User-Agent": "Mozilla/5.0" }
        }),
        fetch("https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d", {
          headers: { "User-Agent": "Mozilla/5.0" }
        }),
        fetch("https://open.er-api.com/v6/latest/USD")
      ]);

      const [silverData, goldData, fxData] = await Promise.all([
        silverRes.json(),
        goldRes.json(),
        fxRes.json()
      ]);

      const silverUsdOz: number | undefined = silverData?.chart?.result?.[0]?.meta?.regularMarketPrice;
      const goldUsdOz: number | undefined = goldData?.chart?.result?.[0]?.meta?.regularMarketPrice;
      const fxRate: number = fxData?.rates?.[currency] ?? 1;

      if (!silverUsdOz || !goldUsdOz || silverUsdOz <= 0 || goldUsdOz <= 0) {
        return res.status(500).json({ error: "Invalid metal price data received" });
      }

      const silverPerGram = parseFloat((silverUsdOz / 31.1035 * fxRate).toFixed(4));
      const goldPerGram = parseFloat((goldUsdOz / 31.1035 * fxRate).toFixed(2));

      return res.json({
        silverPerGram,
        goldPerGram,
        currency,
        fxRate,
        source: "Yahoo Finance",
        sourceUrl: "https://finance.yahoo.com",
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch metal prices" });
    }
  });

  return createServer(app);
}
