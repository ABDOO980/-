import { count, desc, eq, gte } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { announcementsTable, db, fatwasTable, groupCountersTable, groupDuasTable, hadithsTable, pushSubscriptionsTable, quizQuestionsTable, quizRoomsTable, usersTable, weeklyChallengeResultsTable } from "@workspace/db";
import { ensureAnnouncementsTable } from "./announcements";
import { LIVE_KEYS, readLiveStreams, saveLiveStream } from "./live";
import { sendPushToAll } from "../lib/push";
import { sanitizeText } from "../lib/sanitize";
import { adminAuthLimiter, requireAdmin } from "../middlewares/require-admin";

const router: IRouter = Router();
router.use("/admin", adminAuthLimiter, requireAdmin);

router.get("/admin/duas", async (req, res) => {
  const includeHidden = req.query.includeHidden === "true";
  const rows = await db
    .select()
    .from(groupDuasTable)
    .orderBy(desc(groupDuasTable.createdAt))
    .limit(200);
  res.json({ duas: includeHidden ? rows : rows.filter((row) => !row.hidden) });
});

router.patch("/admin/duas/:id/hide", async (req, res) => {
  const id = Number(req.params.id);
  const hidden = req.body?.hidden !== false;
  const updated = await db.update(groupDuasTable).set({ hidden }).where(eq(groupDuasTable.id, id)).returning();
  if (!updated[0]) {
    res.status(404).json({ message: "الدعاء غير موجود." });
    return;
  }
  res.json({ dua: updated[0] });
});

router.get("/admin/counters", async (_req, res) => {
  const rows = await db.select().from(groupCountersTable);
  res.json({ counters: rows });
});

router.patch("/admin/counters/:key", async (req, res) => {
  const count = Number(req.body?.count);
  if (!Number.isInteger(count) || count < 0) {
    res.status(400).json({ message: "قيمة العداد غير صالحة." });
    return;
  }
  const updated = await db
    .update(groupCountersTable)
    .set({ count, updatedAt: new Date() })
    .where(eq(groupCountersTable.key, req.params.key))
    .returning();
  if (!updated[0]) {
    res.status(404).json({ message: "العداد غير موجود." });
    return;
  }
  res.json({ counter: updated[0] });
});

router.get("/admin/stats", async (_req, res) => {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [users] = await db.select({ value: count() }).from(usersTable);
  const [activeDay] = await db.select({ value: count() }).from(usersTable).where(gte(usersTable.lastSeenAt, dayAgo));
  const [activeWeek] = await db.select({ value: count() }).from(usersTable).where(gte(usersTable.lastSeenAt, weekAgo));
  const [subs] = await db.select({ value: count() }).from(pushSubscriptionsTable);
  const [duas] = await db.select({ value: count() }).from(groupDuasTable);
  const [rooms] = await db.select({ value: count() }).from(quizRoomsTable);
  const [weekly] = await db.select({ value: count() }).from(weeklyChallengeResultsTable);
  res.json({
    users: users.value,
    activeLast24h: activeDay.value,
    activeLast7d: activeWeek.value,
    pushSubscriptions: subs.value,
    duasSubmitted: duas.value,
    quizRoomsCreated: rooms.value,
    weeklyChallengeEntries: weekly.value,
  });
});

// Broadcast a push notification to every subscribed device.
router.post("/admin/broadcast", async (req, res) => {
  const title = typeof req.body?.title === "string" ? sanitizeText(req.body.title).slice(0, 80) : "";
  const body = typeof req.body?.body === "string" ? sanitizeText(req.body.body).slice(0, 300) : "";
  const url = typeof req.body?.url === "string" && req.body.url.startsWith("/") ? req.body.url.slice(0, 200) : "/";
  if (!title || !body) {
    res.status(400).json({ message: "العنوان والنص مطلوبان." });
    return;
  }
  const sent = await sendPushToAll({ title, body, url });
  res.json({ sentToSubscriptions: sent });
});

// --- In-app announcements (shown as a banner on the home screen) --------------

router.get("/admin/announcements", async (_req, res) => {
  await ensureAnnouncementsTable();
  const rows = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.id)).limit(50);
  res.json({ announcements: rows });
});

router.post("/admin/announcements", async (req, res) => {
  const title = typeof req.body?.title === "string" ? sanitizeText(req.body.title).slice(0, 80) : "";
  const body = typeof req.body?.body === "string" ? sanitizeText(req.body.body).slice(0, 500) : "";
  if (!title || !body) {
    res.status(400).json({ message: "العنوان والنص مطلوبان." });
    return;
  }
  await ensureAnnouncementsTable();
  const inserted = await db.insert(announcementsTable).values({ title, body }).returning();
  res.status(201).json({ announcement: inserted[0] });
});

router.patch("/admin/announcements/:id", async (req, res) => {
  const id = Number(req.params.id);
  await ensureAnnouncementsTable();
  const updated = await db.update(announcementsTable).set({ active: Boolean(req.body?.active) }).where(eq(announcementsTable.id, id)).returning();
  res.json({ announcement: updated[0] ?? null });
});

router.delete("/admin/announcements/:id", async (req, res) => {
  await ensureAnnouncementsTable();
  await db.delete(announcementsTable).where(eq(announcementsTable.id, Number(req.params.id)));
  res.json({ ok: true });
});

// --- Live streams of the Haramain (YouTube links) -------------------------------

function cleanStreamUrl(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, 300);
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

router.put("/admin/live-streams", async (req, res) => {
  const makkah = cleanStreamUrl(req.body?.makkah);
  const madinah = cleanStreamUrl(req.body?.madinah);
  if (makkah === null || madinah === null) {
    res.status(400).json({ message: "الرابط غير صالح. استخدم رابطًا يبدأ بـ https://" });
    return;
  }
  await saveLiveStream(LIVE_KEYS.makkah, makkah);
  await saveLiveStream(LIVE_KEYS.madinah, madinah);
  res.json({ streams: await readLiveStreams() });
});

// --- Hadiths CRUD -----------------------------------------------------------
router.post("/admin/hadiths", async (req, res) => {
  const title = sanitizeText(String(req.body?.title ?? "")).slice(0, 120);
  const text = sanitizeText(String(req.body?.text ?? "")).slice(0, 2000);
  const source = sanitizeText(String(req.body?.source ?? "")).slice(0, 160);
  const explanation = sanitizeText(String(req.body?.explanation ?? "")).slice(0, 2000);
  const category = typeof req.body?.category === "string" ? sanitizeText(req.body.category).slice(0, 40) || "general" : "general";
  if (!title || !text || !source) {
    res.status(400).json({ message: "العنوان والنص والمصدر مطلوبون." });
    return;
  }
  const inserted = await db.insert(hadithsTable).values({ title, text, source, explanation, category }).returning();
  res.status(201).json({ hadith: inserted[0] });
});

router.patch("/admin/hadiths/:id", async (req, res) => {
  const patch: Record<string, string> = {};
  for (const field of ["title", "text", "source", "explanation", "category"] as const) {
    if (typeof req.body?.[field] === "string") patch[field] = sanitizeText(req.body[field]).slice(0, field === "title" ? 120 : field === "source" ? 160 : field === "category" ? 40 : 2000);
  }
  const updated = await db.update(hadithsTable).set({ ...patch, updatedAt: new Date() }).where(eq(hadithsTable.id, Number(req.params.id))).returning();
  if (!updated[0]) { res.status(404).json({ message: "الحديث غير موجود." }); return; }
  res.json({ hadith: updated[0] });
});

router.delete("/admin/hadiths/:id", async (req, res) => {
  await db.delete(hadithsTable).where(eq(hadithsTable.id, Number(req.params.id)));
  res.status(204).end();
});

// --- Quiz questions CRUD -----------------------------------------------------
router.post("/admin/quiz-questions", async (req, res) => {
  const category = sanitizeText(String(req.body?.category ?? "")).slice(0, 40);
  const difficulty = sanitizeText(String(req.body?.difficulty ?? "")).slice(0, 20);
  const question = sanitizeText(String(req.body?.question ?? "")).slice(0, 500);
  const choices = Array.isArray(req.body?.choices) ? req.body.choices.map((c: unknown) => sanitizeText(String(c)).slice(0, 200)) : [];
  const correct = Number(req.body?.correct);
  if (!category || !difficulty || !question || choices.length < 2 || !Number.isInteger(correct) || correct < 0 || correct >= choices.length) {
    res.status(400).json({ message: "بيانات السؤال غير مكتملة أو غير صالحة." });
    return;
  }
  const inserted = await db.insert(quizQuestionsTable).values({ category, difficulty, question, choices, correct }).returning();
  res.status(201).json({ question: inserted[0] });
});

router.patch("/admin/quiz-questions/:id", async (req, res) => {
  const patch: Record<string, unknown> = {};
  if (typeof req.body?.category === "string") patch.category = sanitizeText(req.body.category).slice(0, 40);
  if (typeof req.body?.difficulty === "string") patch.difficulty = sanitizeText(req.body.difficulty).slice(0, 20);
  if (typeof req.body?.question === "string") patch.question = sanitizeText(req.body.question).slice(0, 500);
  if (Array.isArray(req.body?.choices)) patch.choices = req.body.choices.map((c: unknown) => sanitizeText(String(c)).slice(0, 200));
  if (Number.isInteger(Number(req.body?.correct))) patch.correct = Number(req.body.correct);
  const updated = await db.update(quizQuestionsTable).set({ ...patch, updatedAt: new Date() }).where(eq(quizQuestionsTable.id, Number(req.params.id))).returning();
  if (!updated[0]) { res.status(404).json({ message: "السؤال غير موجود." }); return; }
  res.json({ question: updated[0] });
});

router.delete("/admin/quiz-questions/:id", async (req, res) => {
  await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.id, Number(req.params.id)));
  res.status(204).end();
});

router.get("/admin/hadiths", async (_req, res) => {
  res.json({ hadiths: await db.select().from(hadithsTable).orderBy(hadithsTable.id) });
});

router.get("/admin/quiz-questions", async (_req, res) => {
  res.json({ questions: await db.select().from(quizQuestionsTable).orderBy(quizQuestionsTable.id) });
});

// --- Fatwas CRUD --------------------------------------------------------------
router.get("/admin/fatwas", async (_req, res) => {
  res.json({ fatwas: await db.select().from(fatwasTable).orderBy(fatwasTable.id) });
});

router.post("/admin/fatwas", async (req, res) => {
  const category = sanitizeText(String(req.body?.category ?? "")).slice(0, 60);
  const question = sanitizeText(String(req.body?.question ?? "")).slice(0, 500);
  const answer = sanitizeText(String(req.body?.answer ?? "")).slice(0, 3000);
  const source = sanitizeText(String(req.body?.source ?? "")).slice(0, 200);
  if (!category || !question || !answer || !source) {
    res.status(400).json({ message: "كل الحقول مطلوبة، بما فيها المصدر." });
    return;
  }
  const inserted = await db.insert(fatwasTable).values({ category, question, answer, source }).returning();
  res.status(201).json({ fatwa: inserted[0] });
});

router.patch("/admin/fatwas/:id", async (req, res) => {
  const patch: Record<string, string> = {};
  for (const field of ["category", "question", "answer", "source"] as const) {
    if (typeof req.body?.[field] === "string") patch[field] = sanitizeText(req.body[field]).slice(0, field === "answer" ? 3000 : field === "source" ? 200 : 500);
  }
  const updated = await db.update(fatwasTable).set({ ...patch, updatedAt: new Date() }).where(eq(fatwasTable.id, Number(req.params.id))).returning();
  if (!updated[0]) { res.status(404).json({ message: "الفتوى غير موجودة." }); return; }
  res.json({ fatwa: updated[0] });
});

router.delete("/admin/fatwas/:id", async (req, res) => {
  await db.delete(fatwasTable).where(eq(fatwasTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;
