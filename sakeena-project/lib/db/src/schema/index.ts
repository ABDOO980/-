import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const duaRequestsTable = pgTable(
  "dua_requests",
  {
    id: serial("id").primaryKey(),
    kind: varchar("kind", { length: 16 }).notNull(),
    beneficiaryName: varchar("beneficiary_name", { length: 120 }),
    prayerText: text("prayer_text").notNull(),
    normalizedKey: varchar("normalized_key", { length: 500 }).notNull(),
    supporterCount: integer("supporter_count").notNull().default(1),
    ameenCount: integer("ameen_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    turnStartAt: timestamp("turn_start_at", { withTimezone: true }).notNull(),
    turnEndAt: timestamp("turn_end_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    normalizedKeyUnique: unique("dua_requests_normalized_key_unique").on(table.normalizedKey),
  }),
);

export const duaAmeensTable = pgTable(
  "dua_ameens",
  {
    id: serial("id").primaryKey(),
    duaId: integer("dua_id").notNull(),
    visitorId: varchar("visitor_id", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    visitorDuaUnique: unique("dua_ameens_dua_visitor_unique").on(table.duaId, table.visitorId),
  }),
);

// --- Users ---------------------------------------------------------------
// Anonymous-first: every device gets a row keyed by deviceId (a UUID the
// client generates once and stores locally, same pattern already used for
// dua-wall's visitorId). email/passwordHash stay nullable so an anonymous
// user can later "claim" their row with real credentials without changing
// any foreign key elsewhere.
export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    deviceId: varchar("device_id", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    displayName: varchar("display_name", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    // Bumped (at most every few minutes) whenever the app talks to the API;
    // drives the evening "keep your streak" reminder and the admin stats.
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  },
  (table) => ({
    deviceIdUnique: unique("users_device_id_unique").on(table.deviceId),
    emailUnique: unique("users_email_unique").on(table.email),
  }),
);

// --- Quran bookmarks -------------------------------------------------------
export const bookmarksTable = pgTable(
  "bookmarks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    surahNumber: integer("surah_number").notNull(),
    ayahNumber: integer("ayah_number").notNull(),
    note: varchar("note", { length: 250 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userBookmarkUnique: unique("bookmarks_user_surah_ayah_unique").on(
      table.userId,
      table.surahNumber,
      table.ayahNumber,
    ),
  }),
);

// --- Khatmah (Quran read-through tracking) --------------------------------
export const khatmahTable = pgTable("khatmah", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 120 }).notNull().default("ختمتي"),
  lastSurahNumber: integer("last_surah_number").notNull().default(1),
  lastAyahNumber: integer("last_ayah_number").notNull().default(1),
  completedJuzCount: integer("completed_juz_count").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Personal preferences --------------------------------------------------
export const userPreferencesTable = pgTable("user_preferences", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  preferredReciter: varchar("preferred_reciter", { length: 80 }).notNull().default("mishary"),
  theme: varchar("theme", { length: 10 }).notNull().default("dark"),
  prayerCity: varchar("prayer_city", { length: 120 }),
  prayerCountry: varchar("prayer_country", { length: 120 }),
  prayerLat: varchar("prayer_lat", { length: 32 }),
  prayerLng: varchar("prayer_lng", { length: 32 }),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Favorite hadiths -------------------------------------------------------
export const favoriteHadithsTable = pgTable(
  "favorite_hadiths",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    hadithId: varchar("hadith_id", { length: 80 }).notNull(),
    hadithText: text("hadith_text").notNull(),
    source: varchar("source", { length: 160 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userHadithUnique: unique("favorite_hadiths_user_hadith_unique").on(table.userId, table.hadithId),
  }),
);

// --- Quiz progress -----------------------------------------------------------
export const quizProgressTable = pgTable(
  "quiz_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 60 }).notNull(),
    totalScore: integer("total_score").notNull().default(0),
    questionsAnswered: integer("questions_answered").notNull().default(0),
    correctAnswers: integer("correct_answers").notNull().default(0),
    bestStreak: integer("best_streak").notNull().default(0),
    lastPlayedAt: timestamp("last_played_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userCategoryUnique: unique("quiz_progress_user_category_unique").on(table.userId, table.category),
  }),
);

// --- Completed adhkar sessions ------------------------------------------------
export const completedAdhkarTable = pgTable("completed_adhkar", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  groupId: varchar("group_id", { length: 60 }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Admin-managed content: hadiths and quiz questions ------------------------
// Seeded once from the app's bundled content on first run (see
// api-server/src/lib/seed-content.ts); after that the admin panel is the
// source of truth and the client fetches from these tables instead of its
// own bundle.
export const hadithsTable = pgTable("hadiths", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  text: text("text").notNull(),
  source: varchar("source", { length: 160 }).notNull(),
  explanation: text("explanation").notNull().default(""),
  // "general" or "neglected-sunnah" (سنن وآداب صحيحة يغفل عنها كثيرون).
  category: varchar("category", { length: 40 }).notNull().default("general"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Fatwas -------------------------------------------------------------------
// Seeded with a small set of very well-known, uncontroversial rulings
// attributed to Sheikh Ibn Baz (see api-server/src/lib/seed-content.ts) as a
// starting point; the admin panel is the real source of truth going forward.
// `source` should always cite where the exact wording can be verified
// (e.g. binbaz.org.sa) since this is content attributed to a named scholar.
export const fatwasTable = pgTable("fatwas", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 60 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  source: varchar("source", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quizQuestionsTable = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 40 }).notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
  question: text("question").notNull(),
  choices: jsonb("choices").notNull(),
  correct: integer("correct").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Web Push subscriptions --------------------------------------------------
// One row per browser/device subscription (a user can have several — phone,
// laptop, etc). The scheduler in api-server/src/scheduler.ts reads these to
// deliver real OS-level notifications even when the app/tab is closed.
export const pushSubscriptionsTable = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: varchar("p256dh", { length: 200 }).notNull(),
    auth: varchar("auth", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    endpointUnique: unique("push_subscriptions_endpoint_unique").on(table.endpoint),
  }),
);

// --- Friday / weekly challenge -----------------------------------------------
// One row per ISO week (weekKey like "2026-W05"), lazily created the first
// time anyone asks for that week's challenge (see the weekly-challenge
// route) with a themed question set (Kahf / seerah / salawat) picked
// deterministically from a larger curated pool.
export const weeklyChallengesTable = pgTable(
  "weekly_challenges",
  {
    id: serial("id").primaryKey(),
    weekKey: varchar("week_key", { length: 10 }).notNull(),
    questions: jsonb("questions").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    weekKeyUnique: unique("weekly_challenges_week_key_unique").on(table.weekKey),
  }),
);

// One attempt per user per week — this is what the leaderboard ranks.
export const weeklyChallengeResultsTable = pgTable(
  "weekly_challenge_results",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    weekKey: varchar("week_key", { length: 10 }).notNull(),
    score: integer("score").notNull(),
    correctAnswers: integer("correct_answers").notNull(),
    totalQuestions: integer("total_questions").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userWeekUnique: unique("weekly_challenge_results_user_week_unique").on(table.userId, table.weekKey),
  }),
);

// --- Family / group quiz rooms ------------------------------------------------
// Durable room record (code, host, roster). The live, moment-to-moment state
// of a round in progress — current question index, countdown, who has
// buzzed in — is intentionally NOT stored here: it lives in the Socket.io
// server's memory (see api-server/src/realtime/quiz-rooms.ts) because it is
// ephemeral and needs to broadcast instantly, not round-trip the database.
export const quizRoomsTable = pgTable(
  "quiz_rooms",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 6 }).notNull(),
    hostUserId: integer("host_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 60 }).notNull().default("fiqh"),
    status: varchar("status", { length: 20 }).notNull().default("lobby"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    codeUnique: unique("quiz_rooms_code_unique").on(table.code),
  }),
);

export const quizRoomParticipantsTable = pgTable(
  "quiz_room_participants",
  {
    id: serial("id").primaryKey(),
    roomId: integer("room_id").notNull().references(() => quizRoomsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    nickname: varchar("nickname", { length: 60 }).notNull(),
    score: integer("score").notNull().default(0),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    roomUserUnique: unique("quiz_room_participants_room_user_unique").on(table.roomId, table.userId),
  }),
);

// --- Shared real-time dhikr counters ------------------------------------------
// One row per communal counter (e.g. "hawqala", "salawat-friday"). periodKey
// is null for a counter that never resets (Hawqala); for one that resets on
// a schedule (the Friday salawat counter resets every ISO week) it holds the
// key of the period the current `count` belongs to — the increment route
// checks it against the live period and resets to 0 first if it's stale.
export const groupCountersTable = pgTable("group_counters", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 40 }).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  count: integer("count").notNull().default(0),
  target: integer("target"),
  periodKey: varchar("period_key", { length: 20 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  keyUnique: unique("group_counters_key_unique").on(table.key),
}));

// --- Group / family dua submissions -------------------------------------------
// Distinct from dua_requests/dua_ameens above (the rotating "دعاء لمن تحب"
// wall): this is a moderation-friendly log of every dua ever submitted
// through that feature, so the admin panel has something durable to review
// and hide, independent of the wall's own rotation/expiry logic.
export const groupDuasTable = pgTable("group_duas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 16 }).notNull(),
  beneficiaryName: varchar("beneficiary_name", { length: 120 }),
  prayerText: text("prayer_text").notNull(),
  hidden: boolean("hidden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Group khatmah (shared Quran read-through) --------------------------------
// A creator starts a group khatmah and shares its join code; each member who
// joins claims one or more of the 30 juz to read. groupKhatmahClaimsTable
// enforces one claimant per juz per khatmah so the whole Quran gets split up
// without two people reading the same portion.
export const groupKhatmahTable = pgTable(
  "group_khatmah",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 8 }).notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    creatorUserId: integer("creator_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    codeUnique: unique("group_khatmah_code_unique").on(table.code),
  }),
);

export const groupKhatmahClaimsTable = pgTable(
  "group_khatmah_claims",
  {
    id: serial("id").primaryKey(),
    groupKhatmahId: integer("group_khatmah_id").notNull().references(() => groupKhatmahTable.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    nickname: varchar("nickname", { length: 60 }).notNull(),
    juzNumber: integer("juz_number").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    khatmahJuzUnique: unique("group_khatmah_claims_khatmah_juz_unique").on(table.groupKhatmahId, table.juzNumber),
  }),
);
export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 80 }).notNull(),
  body: text("body").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
