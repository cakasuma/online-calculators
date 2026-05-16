import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

const SUPPORTED_LOCALES = ["en", "ms", "id"] as const;
const DEFAULT_LOCALE = "en";

function registerAdsTxtRoute(app: Express) {
  app.get("/ads.txt", (_req, res) => {
    const adsPath = path.resolve(import.meta.dirname, "..", "client", "public", "ads.txt");
    res.sendFile(adsPath);
  });
}

function registerStaticSeoRoutes(app: Express, publicDir?: string) {
  // sitemap.xml + robots.txt come from prerender; in dev we serve a minimal stub
  // so crawlers checking these URLs don't 404 while iterating locally.
  app.get("/robots.txt", (_req, res) => {
    if (publicDir) {
      const file = path.join(publicDir, "robots.txt");
      if (fs.existsSync(file)) return res.sendFile(file);
    }
    res.type("text/plain").send(`User-agent: *\nAllow: /\n`);
  });
  app.get("/sitemap.xml", (_req, res) => {
    if (publicDir) {
      const file = path.join(publicDir, "sitemap.xml");
      if (fs.existsSync(file)) return res.sendFile(file);
    }
    res.status(404).type("text/plain").send("sitemap.xml is generated at build time");
  });
}

function hasLocalePrefix(reqPath: string): boolean {
  const first = reqPath.split("/").filter(Boolean)[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(first);
}

function detectLocaleFromHeader(acceptLanguage?: string): string {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const lower = acceptLanguage.toLowerCase();
  if (lower.includes("ms")) return "ms";
  if (lower.includes("id")) return "id";
  return DEFAULT_LOCALE;
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  registerAdsTxtRoute(app);
  registerStaticSeoRoutes(app);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    const reqPath = url.split("?")[0] || "/";

    if (reqPath !== "/" && !hasLocalePrefix(reqPath)) {
      const locale = detectLocaleFromHeader(req.headers["accept-language"] as string | undefined);
      const search = url.includes("?") ? url.slice(url.indexOf("?")) : "";
      return res.redirect(302, `/${locale}${reqPath}${search}`);
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  registerAdsTxtRoute(app);
  registerStaticSeoRoutes(app, distPath);
  app.use(express.static(distPath, { extensions: ["html"] }));

  app.get("*", (req, res) => {
    const reqPath = req.path || "/";

    // Redirect bare paths to the default locale so prerendered HTML can be served.
    if (reqPath !== "/" && !hasLocalePrefix(reqPath)) {
      const locale = detectLocaleFromHeader(req.headers["accept-language"] as string | undefined);
      return res.redirect(302, `/${locale}${reqPath}`);
    }

    // Try the prerendered index.html for this locale/path; otherwise fall back to the SPA shell.
    const candidate = path.join(distPath, reqPath, "index.html");
    if (fs.existsSync(candidate)) {
      return res.sendFile(candidate);
    }
    if (reqPath === "/") {
      const home = path.join(distPath, DEFAULT_LOCALE, "index.html");
      if (fs.existsSync(home)) return res.sendFile(home);
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
