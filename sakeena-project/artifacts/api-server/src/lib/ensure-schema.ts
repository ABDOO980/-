import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { logger } from "./logger";
import { SCHEMA_SQL } from "./schema-sql";

// Creates any missing tables on startup, so a fresh database works without
// running a separate migration command (important for one-click hosting).
const EXTRA_SQL = `
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id integer PRIMARY KEY,
  settings jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notification_followups (
  id serial PRIMARY KEY,
  user_id integer NOT NULL,
  tag varchar(80) NOT NULL,
  title varchar(100) NOT NULL,
  body varchar(300) NOT NULL,
  url varchar(200) NOT NULL DEFAULT '/',
  fire_at timestamptz NOT NULL,
  UNIQUE (user_id, tag)
);
`;

export async function ensureSchema() {
  await db.execute(sql.raw(SCHEMA_SQL));
  await db.execute(sql.raw(EXTRA_SQL));
  logger.info("database schema verified");
}
