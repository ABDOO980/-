import { sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ensureSchema } from "../lib/ensure-schema";
import { sendPushToUser } from "../lib/push";
import { sanitizeNotifSettings } from "../lib/notif-settings";
import { sanitizeText } from "../lib/sanitize";
import { resolveUser } from "../middlewares/resolve-user";

const router: IRouter = Router();
router.use(resolveUser);

let ready: Promise<unknown> | null = null;
const ensureReady = () => (ready ??= ensureSchema().catch((error) => { ready = null; throw error; }));
const rowsOf = (result: unknown) => ((result as { rows?: Record<string, unknown>[] }).rows ?? []);

router.get("/notification-settings", async (req, res) => {
  await ensureReady();
  const rows = rowsOf(await db.execute(sql`SELECT settings FROM notification_settings WHERE user_id = ${req.userId!}`));
  res.json({ settings: sanitizeNotifSettings(rows[0]?.settings) });
});

router.put("/notification-settings", async (req, res) => {
  await ensureReady();
  const settings = sanitizeNotifSettings(req.body?.settings ?? req.body);
  await db.execute(sql`INSERT INTO notification_settings (user_id, settings) VALUES (${req.userId!}, ${JSON.stringify(settings)}::jsonb)
    ON CONFLICT (user_id) DO UPDATE SET settings = EXCLUDED.settings, updated_at = now()`);
  res.json({ settings });
});

// "Finish what you started": the app asks for one reminder a few hours later,
// and cancels it when the person completes the task.
router.post("/notification-followups", async (req, res) => {
  const tag = typeof req.body?.tag === "string" ? req.body.tag.slice(0, 80) : "";
  const title = typeof req.body?.title === "string" ? sanitizeText(req.body.title).slice(0, 100) : "";
  const body = typeof req.body?.body === "string" ? sanitizeText(req.body.body).slice(0, 300) : "";
  const url = typeof req.body?.url === "string" && req.body.url.startsWith("/") ? req.body.url.slice(0, 200) : "/";
  const delay = Math.min(720, Math.max(10, Number(req.body?.delayMinutes) || 180));
  if (!tag || !title || !body) {
    res.status(400).json({ message: "بيانات التذكير غير مكتملة." });
    return;
  }
  await ensureReady();
  await db.execute(sql`INSERT INTO notification_followups (user_id, tag, title, body, url, fire_at)
    VALUES (${req.userId!}, ${tag}, ${title}, ${body}, ${url}, now() + (${delay} * interval '1 minute'))
    ON CONFLICT (user_id, tag) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, url = EXCLUDED.url, fire_at = EXCLUDED.fire_at`);
  res.status(201).json({ ok: true });
});

router.delete("/notification-followups/:tag", async (req, res) => {
  await ensureReady();
  await db.execute(sql`DELETE FROM notification_followups WHERE user_id = ${req.userId!} AND tag = ${req.params.tag}`);
  res.status(204).end();
});

// Sends a notification right now, so the person can confirm it reaches them.
router.post("/notification-test", async (req, res) => {
  await sendPushToUser(req.userId!, { title: "تجربة تنبيهات سَكينة", body: "وصلتك الرسالة بنجاح. ستصلك تذكيراتك في أوقاتها بإذن الله.", url: "/notifications", tag: "sakeena-test" });
  res.json({ ok: true });
});

export default router;
