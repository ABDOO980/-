import { and, desc, eq, isNotNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, usersTable, weeklyChallengeResultsTable, weeklyChallengesTable } from "@workspace/db";
import { resolveUser } from "../middlewares/resolve-user";
import { currentWeekKey, pickWeeklyQuestions, type WeeklyQuestion } from "../lib/weekly-questions";

const router: IRouter = Router();
router.use(resolveUser);

async function getOrCreateThisWeek() {
  const weekKey = currentWeekKey();
  const existing = await db.select().from(weeklyChallengesTable).where(eq(weeklyChallengesTable.weekKey, weekKey)).limit(1);
  if (existing[0]) return existing[0];
  try {
    const inserted = await db
      .insert(weeklyChallengesTable)
      .values({ weekKey, questions: pickWeeklyQuestions(weekKey) })
      .returning();
    return inserted[0];
  } catch {
    // another request created it a moment ago — just read it back
    const raced = await db.select().from(weeklyChallengesTable).where(eq(weeklyChallengesTable.weekKey, weekKey)).limit(1);
    return raced[0];
  }
}

router.get("/weekly-challenge", async (req, res) => {
  const challenge = await getOrCreateThisWeek();
  const myResult = await db
    .select()
    .from(weeklyChallengeResultsTable)
    .where(and(eq(weeklyChallengeResultsTable.userId, req.userId!), eq(weeklyChallengeResultsTable.weekKey, challenge.weekKey)))
    .limit(1);

  // Hide the correct-answer index unless the user has already played this
  // week's round — otherwise submitting after seeing your own past result
  // would be trivial.
  const questions = (challenge.questions as WeeklyQuestion[]).map((q) =>
    myResult[0] ? q : { question: q.question, choices: q.choices },
  );
  res.json({ weekKey: challenge.weekKey, questions, alreadyPlayed: Boolean(myResult[0]), myResult: myResult[0] ?? null });
});

router.post("/weekly-challenge/submit", async (req, res) => {
  const me = await db.select({ displayName: usersTable.displayName }).from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!me[0]?.displayName?.trim()) {
    res.status(400).json({ message: "اكتب اسمك أولًا ليظهر في لوحة المتصدرين." });
    return;
  }
  const challenge = await getOrCreateThisWeek();
  const answers = Array.isArray(req.body?.answers) ? (req.body.answers as number[]) : null;
  if (!answers) {
    res.status(400).json({ message: "الإجابات مطلوبة." });
    return;
  }
  const questions = challenge.questions as WeeklyQuestion[];
  const correctAnswers = questions.reduce((count, q, index) => (answers[index] === q.correct ? count + 1 : count), 0);
  const score = correctAnswers * 20;

  try {
    const inserted = await db
      .insert(weeklyChallengeResultsTable)
      .values({ userId: req.userId!, weekKey: challenge.weekKey, score, correctAnswers, totalQuestions: questions.length })
      .returning();
    res.status(201).json({ result: inserted[0] });
  } catch {
    res.status(409).json({ message: "لقد شاركت في منافسة هذا الأسبوع من قبل." });
  }
});

router.get("/weekly-challenge/leaderboard", async (req, res) => {
  const weekKey = typeof req.query.week === "string" ? req.query.week : currentWeekKey();
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const rows = await db
    .select({
      score: weeklyChallengeResultsTable.score,
      correctAnswers: weeklyChallengeResultsTable.correctAnswers,
      completedAt: weeklyChallengeResultsTable.completedAt,
      displayName: usersTable.displayName,
      userId: weeklyChallengeResultsTable.userId,
    })
    .from(weeklyChallengeResultsTable)
    .innerJoin(usersTable, eq(usersTable.id, weeklyChallengeResultsTable.userId))
    .where(and(eq(weeklyChallengeResultsTable.weekKey, weekKey), isNotNull(usersTable.displayName)))
    .orderBy(desc(weeklyChallengeResultsTable.score))
    .limit(limit);

  const leaderboard = rows.map((row, index) => ({
    rank: index + 1,
    displayName: row.displayName ?? `مشارك ${String(row.userId).padStart(4, "0")}`,
    score: row.score,
    correctAnswers: row.correctAnswers,
    isMe: row.userId === req.userId,
  }));
  res.json({ weekKey, leaderboard });
});

export default router;
