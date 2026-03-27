import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the database
  // (currently using in-memory storage, which will reset on server restart)

  app.get("/api/metal-prices", async (req, res) => {
    try {
      const currency = (req.query.currency as string) || "MYR";

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

      const silverUsdOz = silverData.chart.result[0].meta.regularMarketPrice;
      const goldUsdOz = goldData.chart.result[0].meta.regularMarketPrice;
      const fxRate = fxData.rates[currency] ?? 1;

      const silverPerGram = parseFloat((silverUsdOz / 31.1035 * fxRate).toFixed(4));
      const goldPerGram = parseFloat((goldUsdOz / 31.1035 * fxRate).toFixed(2));

      res.json({ silverPerGram, goldPerGram, currency, fxRate });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch metal prices" });
    }
  });

  return createServer(app);
}
