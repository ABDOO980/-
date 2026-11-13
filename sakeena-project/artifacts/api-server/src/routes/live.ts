import { sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";

const router: IRouter = Router();

export const LIVE_KEYS = { makkah: "live_makkah", madinah: "live_madinah" } as const;

let ready: Promise<unknown> | null = null;
export function ensureSettingsTable() {
  ready ??= db.execute(sql`CREATE TABLE IF NOT EXISTS app_settings (
    key varchar(60) PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`).catch((error) => { ready = null; throw error; });
  return ready;
}

export async function readLiveStreams() {
  await ensureSettingsTable();
  const result = await db.execute(sql`SELECT key, value FROM app_settings WHERE key IN (${LIVE_KEYS.makkah}, ${LIVE_KEYS.madinah})`);
  const rows = (result as unknown as { rows: { key: string; value: string }[] }).rows ?? [];
  const find = (key: string) => rows.find((row) => row.key === key)?.value || null;
  return { makkah: find(LIVE_KEYS.makkah), madinah: find(LIVE_KEYS.madinah) };
}

export async function saveLiveStream(key: string, value: string) {
  await ensureSettingsTable();
  if (!value) {
    await db.execute(sql`DELETE FROM app_settings WHERE key = ${key}`);
    return;
  }
  await db.execute(sql`INSERT INTO app_settings (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`);
}

// Links to the live streams of the two Holy Mosques, as set by the admin.
router.get("/live-streams", async (_req, res) => {
  try {
    res.json({ streams: await readLiveStreams() });
  } catch {
    res.json({ streams: { makkah: null, madinah: null } });
  }
});

export default router;
