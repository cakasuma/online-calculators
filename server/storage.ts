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

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLead(lead: InsertLead): Promise<Lead>;
  recordEvent(event: InsertCalculationEvent): Promise<CalculationEvent>;
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
