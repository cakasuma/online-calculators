import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });

const ddl = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT,
  calculator TEXT NOT NULL,
  intent TEXT NOT NULL,
  locale TEXT,
  source TEXT,
  utm JSONB,
  context JSONB,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS leads_calculator_idx ON leads(calculator);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at);

CREATE TABLE IF NOT EXISTS calculation_events (
  id SERIAL PRIMARY KEY,
  calculator TEXT NOT NULL,
  event TEXT NOT NULL,
  session_id TEXT,
  locale TEXT,
  path TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS events_calculator_event_idx ON calculation_events(calculator, event);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON calculation_events(created_at);
`;

try {
  await sql.unsafe(ddl);
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('users', 'leads', 'calculation_events')
    ORDER BY table_name
  `;
  console.log("Tables present:", tables.map((t) => t.table_name).join(", "));
} catch (err) {
  console.error("Migration failed:", err);
  process.exit(1);
} finally {
  await sql.end();
}
