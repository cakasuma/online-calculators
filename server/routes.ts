import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertEventSchema } from "../shared/schema";

function getClientIp(req: Request): string | undefined {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]?.trim();
  if (Array.isArray(fwd)) return fwd[0];
  return req.socket.remoteAddress ?? undefined;
}

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const rateBucket = new Map<string, { count: number; reset: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = rateBucket.get(key);
  if (!bucket || bucket.reset < now) {
    rateBucket.set(key, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/leads", async (req, res) => {
    const ip = getClientIp(req) ?? "unknown";
    if (rateLimited(`lead:${ip}`)) {
      return res.status(429).json({ error: "Too many requests" });
    }

    const parsed = insertLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    try {
      const userAgent = req.headers["user-agent"]?.toString().slice(0, 500);
      const lead = await storage.createLead({ ...parsed.data, userAgent });
      return res.status(201).json({ id: lead.id, ok: true });
    } catch (err) {
      console.error("[lead] failed to persist", err);
      return res.status(500).json({ error: "Failed to save lead" });
    }
  });

  app.post("/api/events", async (req, res) => {
    const ip = getClientIp(req) ?? "unknown";
    if (rateLimited(`evt:${ip}`)) {
      return res.status(429).json({ error: "Too many requests" });
    }

    const parsed = insertEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    try {
      await storage.recordEvent(parsed.data);
      return res.status(204).end();
    } catch (err) {
      console.error("[event] failed to record", err);
      return res.status(500).json({ error: "Failed to record event" });
    }
  });

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
