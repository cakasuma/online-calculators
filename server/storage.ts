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

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLead(lead: InsertLead): Promise<Lead>;
  recordEvent(event: InsertCalculationEvent): Promise<CalculationEvent>;
  /** Aggregate salary submissions over the recent window. Returns null when
   *  not enough data exists to draw meaningful percentiles. */
  getSalaryDistribution(): Promise<SalaryDistribution | null>;
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
    const percentileFractions = SALARY_PERCENTILES.map((p) => p / 100);
    const rows = await db.execute(sql`
      WITH sample AS (
        SELECT (payload->>'monthlySalary')::numeric AS v
        FROM ${calculationEvents}
        WHERE calculator = 'salary'
          AND event = 'calculator_complete'
          AND created_at >= ${windowStart}
          AND payload ? 'monthlySalary'
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
