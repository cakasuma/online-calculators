import { pgTable, text, serial, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const CALCULATOR_KEYS = [
  "faraid",
  "wasiat",
  "zakat",
  "salary",
  "normal",
  "scientific",
] as const;

export const LEAD_INTENTS = [
  "consult",
  "reminder",
  "partner",
  "newsletter",
  "report",
] as const;

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    phone: text("phone"),
    name: text("name"),
    calculator: text("calculator").notNull(),
    intent: text("intent").notNull(),
    locale: text("locale"),
    source: text("source"),
    utm: jsonb("utm").$type<Record<string, string>>(),
    context: jsonb("context").$type<Record<string, unknown>>(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    calculatorIdx: index("leads_calculator_idx").on(table.calculator),
    createdAtIdx: index("leads_created_at_idx").on(table.createdAt),
  }),
);

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export const insertLeadSchema = z.object({
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
  name: z.string().max(120).optional(),
  calculator: z.enum(CALCULATOR_KEYS),
  intent: z.enum(LEAD_INTENTS),
  locale: z.string().max(8).optional(),
  source: z.string().max(120).optional(),
  utm: z.record(z.string()).optional(),
  context: z.record(z.unknown()).optional(),
});

export const calculationEvents = pgTable(
  "calculation_events",
  {
    id: serial("id").primaryKey(),
    calculator: text("calculator").notNull(),
    event: text("event").notNull(),
    sessionId: text("session_id"),
    locale: text("locale"),
    path: text("path"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    calculatorEventIdx: index("events_calculator_event_idx").on(table.calculator, table.event),
    createdAtIdx: index("events_created_at_idx").on(table.createdAt),
  }),
);

export type CalculationEvent = typeof calculationEvents.$inferSelect;
export type InsertCalculationEvent = typeof calculationEvents.$inferInsert;

export const insertEventSchema = z.object({
  calculator: z.enum(CALCULATOR_KEYS),
  event: z.string().min(1).max(60),
  sessionId: z.string().max(80).optional(),
  locale: z.string().max(8).optional(),
  path: z.string().max(200).optional(),
  payload: z.record(z.unknown()).optional(),
});
