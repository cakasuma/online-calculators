import {
  type InsertUser,
  type User,
  type InsertLead,
  type Lead,
  type InsertCalculationEvent,
  type CalculationEvent,
  users,
  leads,
  calculationEvents,
} from "../shared/schema";
import { getDb } from "./db";

export interface SalaryDistribution {
  sampleSize: number;
  /** ms since epoch — earliest event timestamp considered for the window. */
  windowStart: number;
  /** Percentile breakpoints in ringgit per month, sorted ascending. */
  breakpoints: { p: number; value: number }[];
}

export interface EmbedHost {
  /** eTLD+1 of the parent page hosting the embed. */
  host: string;
  /** Number of distinct embed_view events recorded from this host. */
  count: number;
  /** Earliest embed_view from this host, ms since epoch. */
  firstSeen: number;
  /** Latest embed_view from this host, ms since epoch. */
  lastSeen: number;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLead(lead: InsertLead): Promise<Lead>;
  recordEvent(event: InsertCalculationEvent): Promise<CalculationEvent>;
  /** Aggregate salary submissions over the recent window. Returns null when
   *  not enough data exists to draw meaningful percentiles. */
  getSalaryDistribution(): Promise<SalaryDistribution | null>;
  /** Aggregate embed_view events by parent host. Filters out hosts with
   *  fewer than the threshold to avoid one-off visits showing up. */
  getEmbedHosts(minCount?: number): Promise<EmbedHost[]>;
}

const EMBED_WINDOW_DAYS = 180;
const EMBED_DEFAULT_MIN_COUNT = 5;

// Defence-in-depth: even though /api/events sanitises parentHost on write,
// re-validate on read so legacy data (or any future code path that bypasses
// /api/events) cannot surface a malformed host to the partners page.
const SAFE_DOMAIN_RE = /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;
function isSafeDomain(s: string): boolean {
  const lower = s.toLowerCase().trim();
  if (!SAFE_DOMAIN_RE.test(lower)) return false;
  if (lower === "localhost" || lower === "hellokalku.com" || lower.endsWith(".hellokalku.com")) return false;
  if (/^[0-9]+(\.[0-9]+){0,3}$/.test(lower)) return false;
  return true;
}

const SALARY_PERCENTILES = [10, 25, 50, 75, 90, 99];
const SALARY_WINDOW_DAYS = 180;
const SALARY_MIN_SAMPLE = 20;

function computePercentiles(sortedAsc: number[]): { p: number; value: number }[] {
  const n = sortedAsc.length;
  return SALARY_PERCENTILES.map((p) => {
    if (n === 0) return { p, value: 0 };
    const rank = (p / 100) * (n - 1);
    const lo = Math.floor(rank);
    const hi = Math.ceil(rank);
    const value = lo === hi ? sortedAsc[lo] : sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (rank - lo);
    return { p, value: Math.round(value) };
  });
}

export class MemStorage implements IStorage {
  private users = new Map<number, User>();
  private leadsList: Lead[] = [];
  private events: CalculationEvent[] = [];
  private userId = 1;
  private leadId = 1;
  private eventId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createLead(input: InsertLead): Promise<Lead> {
    const lead: Lead = {
      id: this.leadId++,
      email: input.email,
      phone: input.phone ?? null,
      name: input.name ?? null,
      calculator: input.calculator,
      intent: input.intent,
      locale: input.locale ?? null,
      source: input.source ?? null,
      utm: input.utm ?? null,
      context: input.context ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: new Date(),
    };
    this.leadsList.push(lead);
    console.log(`[lead:memory] ${lead.calculator}/${lead.intent} ${lead.email}`);
    return lead;
  }

  async recordEvent(input: InsertCalculationEvent): Promise<CalculationEvent> {
    const event: CalculationEvent = {
      id: this.eventId++,
      calculator: input.calculator,
      event: input.event,
      sessionId: input.sessionId ?? null,
      locale: input.locale ?? null,
      path: input.path ?? null,
      payload: input.payload ?? null,
      createdAt: new Date(),
    };
    this.events.push(event);
    return event;
  }

  async getSalaryDistribution(): Promise<SalaryDistribution | null> {
    const windowStart = Date.now() - SALARY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const values: number[] = [];
    for (const e of this.events) {
      if (e.calculator !== "salary" || e.event !== "calculator_complete") continue;
      if (e.createdAt.getTime() < windowStart) continue;
      const v = (e.payload as Record<string, unknown> | null)?.monthlySalary;
      if (typeof v === "number" && v > 0 && v < 10_000_000) values.push(v);
    }
    if (values.length < SALARY_MIN_SAMPLE) return null;
    values.sort((a, b) => a - b);
    return {
      sampleSize: values.length,
      windowStart,
      breakpoints: computePercentiles(values),
    };
  }

  async getEmbedHosts(minCount = EMBED_DEFAULT_MIN_COUNT): Promise<EmbedHost[]> {
    const windowStart = Date.now() - EMBED_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const agg = new Map<string, { count: number; first: number; last: number }>();
    for (const e of this.events) {
      if (e.event !== "embed_view") continue;
      if (e.createdAt.getTime() < windowStart) continue;
      const host = (e.payload as Record<string, unknown> | null)?.parentHost;
      if (typeof host !== "string" || !host) continue;
      if (!isSafeDomain(host)) continue;
      const ts = e.createdAt.getTime();
      const cur = agg.get(host);
      if (cur) {
        cur.count += 1;
        cur.first = Math.min(cur.first, ts);
        cur.last = Math.max(cur.last, ts);
      } else {
        agg.set(host, { count: 1, first: ts, last: ts });
      }
    }
    const list: EmbedHost[] = [];
    for (const [host, v] of agg) {
      if (v.count < minCount) continue;
      list.push({ host, count: v.count, firstSeen: v.first, lastSeen: v.last });
    }
    list.sort((a, b) => b.count - a.count);
    return list;
  }
}

export class DbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const db = getDb();
    if (!db) return undefined;
    const { eq } = await import("drizzle-orm");
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = getDb();
    if (!db) return undefined;
    const { eq } = await import("drizzle-orm");
    const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return rows[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = getDb();
    if (!db) throw new Error("Database not configured");
    const [row] = await db.insert(users).values(insertUser).returning();
    return row;
  }

  async createLead(input: InsertLead): Promise<Lead> {
    const db = getDb();
    if (!db) throw new Error("Database not configured");
    const [row] = await db.insert(leads).values(input).returning();
    return row;
  }

  async recordEvent(input: InsertCalculationEvent): Promise<CalculationEvent> {
    const db = getDb();
    if (!db) throw new Error("Database not configured");
    const [row] = await db.insert(calculationEvents).values(input).returning();
    return row;
  }

  async getSalaryDistribution(): Promise<SalaryDistribution | null> {
    const db = getDb();
    if (!db) return null;
    const windowStart = new Date(Date.now() - SALARY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const { sql } = await import("drizzle-orm");
    // Use a CTE to extract monthlySalary once, then compute count + percentiles
    // in a single round trip. payload is jsonb; the value lives at $.monthlySalary.
    //
    // Guard the ::numeric cast with jsonb_typeof = 'number' — /api/events
    // accepts arbitrary JSON, so a single bad row (e.g. monthlySalary as a
    // string) would otherwise throw `invalid input syntax for type numeric`
    // and poison every percentile request until the row ages out of the
    // 180-day window.
    const percentileFractions = SALARY_PERCENTILES.map((p) => p / 100);
    const rows = await db.execute(sql`
      WITH sample AS (
        SELECT (payload->>'monthlySalary')::numeric AS v
        FROM ${calculationEvents}
        WHERE calculator = 'salary'
          AND event = 'calculator_complete'
          AND created_at >= ${windowStart}
          AND jsonb_typeof(payload->'monthlySalary') = 'number'
      )
      SELECT
        count(*) FILTER (WHERE v > 0 AND v < 10000000) AS sample_size,
        percentile_cont(ARRAY[${sql.raw(percentileFractions.join(","))}]::float[])
          WITHIN GROUP (ORDER BY v) AS breakpoints
      FROM sample
      WHERE v > 0 AND v < 10000000
    `);

    const row = (rows as unknown as { rows?: Array<Record<string, unknown>> }).rows?.[0]
      ?? (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!row) return null;

    const sampleSize = Number(row.sample_size ?? row.sampleSize ?? 0);
    if (sampleSize < SALARY_MIN_SAMPLE) return null;
    const raw = row.breakpoints as number[] | null;
    if (!raw) return null;
    return {
      sampleSize,
      windowStart: windowStart.getTime(),
      breakpoints: SALARY_PERCENTILES.map((p, i) => ({ p, value: Math.round(raw[i]) })),
    };
  }

  async getEmbedHosts(minCount = EMBED_DEFAULT_MIN_COUNT): Promise<EmbedHost[]> {
    const db = getDb();
    if (!db) return [];
    const windowStart = new Date(Date.now() - EMBED_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`
      SELECT
        payload->>'parentHost' AS host,
        count(*)::int AS cnt,
        EXTRACT(EPOCH FROM min(created_at)) * 1000 AS first_seen,
        EXTRACT(EPOCH FROM max(created_at)) * 1000 AS last_seen
      FROM ${calculationEvents}
      WHERE event = 'embed_view'
        AND created_at >= ${windowStart}
        AND jsonb_typeof(payload->'parentHost') = 'string'
        AND payload->>'parentHost' <> ''
      GROUP BY payload->>'parentHost'
      HAVING count(*) >= ${minCount}
      ORDER BY cnt DESC
    `);

    const data = (rows as unknown as { rows?: Array<Record<string, unknown>> }).rows
      ?? (rows as unknown as Array<Record<string, unknown>>);
    return data
      .map((r) => ({
        host: String(r.host ?? ""),
        count: Number(r.cnt ?? 0),
        firstSeen: Math.round(Number(r.first_seen ?? r.firstSeen ?? 0)),
        lastSeen: Math.round(Number(r.last_seen ?? r.lastSeen ?? 0)),
      }))
      .filter((r) => r.host.length > 0 && isSafeDomain(r.host));
  }
}

function createStorage(): IStorage {
  if (process.env.DATABASE_URL) {
    console.log("[storage] Using Postgres (DATABASE_URL set)");
    return new DbStorage();
  }
  console.log("[storage] Using in-memory storage (set DATABASE_URL to persist leads)");
  return new MemStorage();
}

export const storage = createStorage();
