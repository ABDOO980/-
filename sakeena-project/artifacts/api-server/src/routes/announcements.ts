import { desc, eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { announcementsTable, db } from "@workspace/db";

const router: IRouter = Router();

let tableReady: Promise<unknown> | null = null;
export function ensureAnnouncementsTable() {
  tableReady ??= db.execute(sql`CREATE TABLE IF NOT EXISTS announcements (
    id serial PRIMARY KEY,
    title varchar(80) NOT NULL,
    body text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`).catch((error) => { tableReady = null; throw error; });
  return tableReady;
}

// The newest announcement the admin has left switched on (or null).
router.get("/announcements/active", async (_req, res) => {
  try {
    await ensureAnnouncementsTable();
    const rows = await db.select().from(announcementsTable).where(eq(announcementsTable.active, true)).orderBy(desc(announcementsTable.id)).limit(1);
    res.json({ announcement: rows[0] ?? null });
  } catch {
    res.json({ announcement: null });
  }
});

export default router;
