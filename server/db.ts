import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../shared/schema";

let cached: { client: ReturnType<typeof postgres>; db: PostgresJsDatabase<typeof schema> } | null = null;

export function getDb(): PostgresJsDatabase<typeof schema> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!cached) {
    const client = postgres(url, { prepare: false, max: 5 });
    cached = { client, db: drizzle(client, { schema }) };
  }
  return cached.db;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
