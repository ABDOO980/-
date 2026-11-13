import { eq, sql } from "drizzle-orm";
import { db, pushSubscriptionsTable, userPreferencesTable, usersTable } from "@workspace/db";
import { ayat, shortAdhkar } from "./lib/daily-bank";
import { hadithForDate } from "./lib/hadiths";
import { DEFAULT_NOTIF_SETTINGS, sanitizeNotifSettings, type NotifSettings } from "./lib/notif-settings";
import { sendPushToUser, type PushPayload } from "./lib/push";
import { logger } from "./lib/logger";

type PrayerName = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
type Timings = Record<PrayerName, string>;
type Place = { timings: Timings; tz: string; dateKey: string };

const PRAYER_NAME_AR: Record<PrayerName, string> = {
  Fajr: "الفجر", Sunrise: "الشروق", Dhuhr: "الظهر", Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء",
};

const PRAYER_BENEFIT: Record<PrayerName, string> = {
  Fajr: "«من صلى الصبح في جماعة فهو في ذمة الله» (رواه مسلم)",
  Sunrise: "«صلاة الضحى صدقة عن كل مفصل من مفاصل الجسد» (رواه مسلم)",
  Dhuhr: "«رحم الله امرأً صلى قبل الظهر أربعًا وبعدها أربعًا» (رواه الترمذي)",
  Asr: "«من صلى البردين دخل الجنة» (متفق عليه)",
  Maghrib: "«الصلاة على وقتها من أحب الأعمال إلى الله» (متفق عليه)",
  Isha: "«من صلى العشاء في جماعة فكأنما قام نصف الليل» (رواه مسلم)",
};

const toMinutes = (time: string) => {
  const match = time.match(/(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
};
const wrap = (minutes: number) => ((Math.round(minutes) % 1440) + 1440) % 1440;

// ---- time in the person's own time zone --------------------------------------

function localParts(tz: string, at = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, weekday: "long" })
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  return { dateKey: `${parts.year}-${parts.month}-${parts.day}`, minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute), weekday: parts.weekday };
}

function hijriDate(tz: string, at = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { timeZone: tz, day: "numeric", month: "numeric", year: "numeric" }).formatToParts(at);
    const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    return { day: read("day"), month: read("month") };
  } catch {
    return { day: 0, month: 0 };
  }
}

const dayNumber = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86_400_000);
};

// ---- prayer times (by coordinates when the app has shared them) ---------------

const placeCache = new Map<string, Place>();

async function getPlace(prefs: typeof userPreferencesTable.$inferSelect | undefined): Promise<Place | null> {
  const lat = Number(prefs?.prayerLat);
  const lng = Number(prefs?.prayerLng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && prefs?.prayerLat && prefs?.prayerLng;
  const city = prefs?.prayerCity || "Cairo";
  const country = prefs?.prayerCountry || "Egypt";
  const key = hasCoords ? `${lat.toFixed(2)},${lng.toFixed(2)}` : `${city}|${country}`;

  const cached = placeCache.get(key);
  const expectedDate = localParts(cached?.tz ?? "UTC").dateKey;
  if (cached && cached.dateKey === expectedDate) return cached;

  try {
    const [year, month, day] = expectedDate.split("-");
    const stamp = `${day}-${month}-${year}`;
    const method = cached?.tz === "Asia/Riyadh" ? 4 : 5;
    const url = hasCoords
      ? `https://api.aladhan.com/v1/timings/${stamp}?latitude=${lat}&longitude=${lng}&method=${method}`
      : `https://api.aladhan.com/v1/timingsByCity/${stamp}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
    const response = await fetch(url);
    if (!response.ok) return cached ?? null;
    const data = (await response.json()) as { data?: { timings?: Record<string, string>; meta?: { timezone?: string } } };
    const raw = data.data?.timings;
    if (!raw) return cached ?? null;
    const place: Place = {
      timings: { Fajr: raw.Fajr, Sunrise: raw.Sunrise, Dhuhr: raw.Dhuhr, Asr: raw.Asr, Maghrib: raw.Maghrib, Isha: raw.Isha },
      tz: data.data?.meta?.timezone || cached?.tz || "Africa/Cairo",
      dateKey: expectedDate,
    };
    placeCache.set(key, place);
    return place;
  } catch (error) {
    logger.error({ error }, "failed to fetch prayer timings for scheduler");
    return cached ?? null;
  }
}

// ---- sent-today bookkeeping (in memory: a restart can at worst repeat one) ----

const sent = new Set<string>();
function once(dateKey: string, key: string) {
  const id = `${dateKey}|${key}`;
  if (sent.has(id)) return false;
  if (sent.size > 50_000) sent.clear();
  sent.add(id);
  return true;
}

// ---- content ------------------------------------------------------------------

function dailyLightPayload(dateKey: string): PushPayload {
  const day = dayNumber(dateKey);
  const mode = day % 3;
  if (mode === 0) {
    const ayah = ayat[day % ayat.length];
    return { title: "آية اليوم", body: `﴿${ayah.text}﴾ — ${ayah.ref}`, url: "/", tag: "daily-light" };
  }
  if (mode === 1) {
    const hadith = hadithForDate(dateKey);
    return { title: "حديث اليوم", body: `«${hadith.text}» (${hadith.source})`, url: `/hadith?id=${hadith.id}`, tag: "daily-light" };
  }
  return { title: "ذكر اليوم", body: shortAdhkar[day % shortAdhkar.length], url: "/adhkar", tag: "daily-light" };
}

// ---- one pass over every subscribed person -----------------------------------

async function loadSettings(): Promise<Map<number, NotifSettings>> {
  const result = await db.execute(sql`SELECT user_id, settings FROM notification_settings`);
  const rows = (result as unknown as { rows: { user_id: number; settings: unknown }[] }).rows ?? [];
  return new Map(rows.map((row) => [row.user_id, sanitizeNotifSettings(row.settings)]));
}

async function sendDueFollowups(settingsByUser: Map<number, NotifSettings>) {
  const result = await db.execute(sql`DELETE FROM notification_followups WHERE fire_at <= now() RETURNING user_id, title, body, url, tag`);
  const rows = (result as unknown as { rows: { user_id: number; title: string; body: string; url: string; tag: string }[] }).rows ?? [];
  for (const row of rows) {
    const settings = settingsByUser.get(row.user_id) ?? DEFAULT_NOTIF_SETTINGS;
    if (!settings.master || !settings.resume) continue;
    await sendPushToUser(row.user_id, { title: row.title, body: row.body, url: row.url, tag: row.tag });
  }
}

async function tick() {
  const subscribed = await db.selectDistinct({ userId: pushSubscriptionsTable.userId }).from(pushSubscriptionsTable);
  if (subscribed.length === 0) return;
  const settingsByUser = await loadSettings();
  await sendDueFollowups(settingsByUser);

  for (const { userId } of subscribed) {
    const settings = settingsByUser.get(userId) ?? DEFAULT_NOTIF_SETTINGS;
    const prefRows = await db.select().from(userPreferencesTable).where(eq(userPreferencesTable.userId, userId)).limit(1);
    const prefs = prefRows[0];
    if (!settings.master || prefs?.notificationsEnabled === false) continue;

    const place = await getPlace(prefs);
    if (!place) continue;
    const { dateKey, minutes, weekday } = localParts(place.tz);
    const hijri = hijriDate(place.tz);
    const t = place.timings;
    const F = toMinutes(t.Fajr), S = toMinutes(t.Sunrise), D = toMinutes(t.Dhuhr), A = toMinutes(t.Asr), M = toMinutes(t.Maghrib), I = toMinutes(t.Isha);
    const at = (target: number) => minutes === wrap(target);
    const send = (key: string, payload: PushPayload) => once(dateKey, `${userId}-${key}`) ? sendPushToUser(userId, payload) : undefined;

    // Salah: a heads-up before, and the call itself.
    for (const name of ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as PrayerName[]) {
      const time = toMinutes(t[name]);
      const arabic = PRAYER_NAME_AR[name];
      if (settings.prayerBefore && at(time - 10)) await send(`${name}-before`, { title: `بعد عشر دقائق: صلاة ${arabic}`, body: `تهيّأ وتوضّأ واستعد لصلاة ${arabic}`, url: "/", tag: `prayer-${name}` });
      if (settings.prayerNow && at(time)) await send(`${name}-now`, { title: `حان وقت صلاة ${arabic}`, body: PRAYER_BENEFIT[name], url: "/", tag: `prayer-${name}` });
    }

    // Morning and evening adhkar windows.
    if (settings.morningStart && at(F + 15)) await send("morning-start", { title: "أذكار الصباح", body: "افتتح يومك بأذكار الصباح، فهي حصنك بإذن الله.", url: "/adhkar/morning", tag: "adhkar-morning" });
    if (settings.catchFajr && at(S - 30)) {
      // Only nudge people who have not opened the app since Fajr.
      const row = (await db.select({ lastSeenAt: usersTable.lastSeenAt }).from(usersTable).where(eq(usersTable.id, userId)).limit(1))[0];
      const seen = row?.lastSeenAt ? localParts(place.tz, row.lastSeenAt) : null;
      if (!seen || seen.dateKey !== dateKey || seen.minutes < F) {
        await send("catch-fajr", { title: "قبل الشروق بنصف ساعة", body: "إن فاتتك صلاة الفجر فبادر بها قبل أن تطلع الشمس، ثم أذكار الصباح.", url: "/adhkar/morning", tag: "catch-fajr" });
      }
    }
    if (settings.beforeDuha && at(D - 30)) await send("duha", { title: "فرصة الضحى", body: "قبل الظهر بنصف ساعة: ركعتان من الضحى تكفيك صدقة عن كل مفصل في جسدك.", url: "/", tag: "duha" });
    if (settings.eveningStart && at(A + 15)) await send("evening-start", { title: "أذكار المساء", body: "ابدأ أذكار المساء؛ وقتها بعد العصر حتى المغرب.", url: "/adhkar/evening", tag: "adhkar-evening" });
    if (settings.eveningEnd && at(M - 20)) await send("evening-end", { title: "قبل الغروب", body: "اقترب المغرب، أتمّ أذكار المساء قبل انقضاء وقتها.", url: "/adhkar/evening", tag: "adhkar-evening-end" });

    // The night.
    const night = wrap(F - M);
    const lastThird = wrap(F - night / 3);
    if ((settings.qiyam || settings.qiyamStrong) && at(lastThird)) {
      await send("qiyam", {
        title: "الثلث الأخير من الليل",
        body: "«ينزل ربنا كل ليلة إلى السماء الدنيا حين يبقى ثلث الليل الآخر: من يدعوني فأستجيب له» (متفق عليه)",
        url: "/", tag: "qiyam", strong: settings.qiyamStrong,
      });
    }
    if (settings.mulk && at(I + 90)) await send("mulk", { title: "قبل أن تنام", body: "اقرأ سورة الملك؛ فقد كان النبي ﷺ لا ينام حتى يقرأها.", url: "/quran/67", tag: "mulk" });

    // Friday and its eve.
    const isFriday = weekday === "Friday";
    if (settings.salawat && ((weekday === "Thursday" && at(M + 5)) || (isFriday && at(D - 60)))) {
      await send("salawat", { title: "أكثروا من الصلاة على النبي ﷺ", body: "«أكثروا من الصلاة عليّ يوم الجمعة وليلة الجمعة». اللهم صلِّ وسلّم على نبينا محمد.", url: "/", tag: "salawat" });
    }
    if (settings.kahf && isFriday && at(F + 30)) await send("kahf", { title: "سورة الكهف", body: "اليوم الجمعة، اجعل لك نصيبًا من سورة الكهف قبل أن ينتهي يومك.", url: "/quran/18", tag: "kahf" });
    if (settings.answerHour && isFriday && at(M - 60)) await send("answer-hour", { title: "ساعة الإجابة", body: "هذه آخر ساعة من يوم الجمعة، فأكثر من الدعاء.", url: "/", tag: "answer-hour" });

    // Occasions (Hijri calendar).
    if (settings.monThu && (weekday === "Sunday" || weekday === "Wednesday") && at(M + 45)) {
      await send("monthu", { title: "صيام الغد سُنّة", body: `غدًا ${weekday === "Sunday" ? "الاثنين" : "الخميس"}، تُعرض الأعمال فيه، فانوِ الصيام من الليلة.`, url: "/worship/fasting", tag: "monthu" });
    }
    if (settings.whiteDays && [12, 13, 14].includes(hijri.day) && at(M + 45)) await send("white", { title: "الأيام البيض", body: "غدًا من الأيام البيض (١٣ و١٤ و١٥)، فانوِ الصيام من الليلة.", url: "/worship/fasting", tag: "white-days" });
    if (settings.arafah && hijri.month === 12 && ((hijri.day === 8 && at(M + 30)) || (hijri.day === 9 && at(F + 60)))) {
      await send("arafah", { title: "يوم عرفة", body: hijri.day === 8 ? "غدًا يوم عرفة، وصيامه لغير الحاج يكفّر سنتين." : "اليوم يوم عرفة، أكثر من الدعاء والذكر.", url: "/adhkar/hajj", tag: "arafah" });
    }
    if (settings.ashura && hijri.month === 1 && (hijri.day === 8 || hijri.day === 9) && at(M + 30)) {
      await send("ashura", { title: "عاشوراء", body: hijri.day === 8 ? "غدًا التاسع من المحرم، فصُم معه العاشر." : "غدًا عاشوراء، وصيامه يكفّر سنة ماضية.", url: "/worship/fasting", tag: "ashura" });
    }
    if (settings.eid && ((hijri.month === 10 && hijri.day === 1) || (hijri.month === 12 && hijri.day === 10)) && at(F + 10)) {
      await send("eid", { title: "كل عام وأنتم بخير", body: "الله أكبر الله أكبر الله أكبر، لا إله إلا الله، والله أكبر الله أكبر ولله الحمد.", url: "/", tag: "eid" });
    }

    // Light of the day, and dhikr doses spread across the day.
    if (settings.dailyLight && at(toMinutes(settings.dailyLightTime))) await send("daily-light", dailyLightPayload(dateKey));
    if (settings.doses > 0) {
      for (let i = 0; i < settings.doses; i += 1) {
        const slot = settings.doses === 1 ? 12 * 60 : 9 * 60 + Math.round((i * 12 * 60) / (settings.doses - 1));
        if (at(slot)) await send(`dose-${i}`, { title: "نفحة ذكر", body: shortAdhkar[(dayNumber(dateKey) * settings.doses + i) % shortAdhkar.length], url: "/adhkar", tag: `dose-${i}` });
      }
    }

    // Streak: only for someone who opened the app yesterday but not yet today.
    if (settings.streak && at(20 * 60 + 30)) {
      const row = (await db.select({ lastSeenAt: usersTable.lastSeenAt }).from(usersTable).where(eq(usersTable.id, userId)).limit(1))[0];
      if (row?.lastSeenAt) {
        const lastKey = localParts(place.tz, row.lastSeenAt).dateKey;
        const yesterdayKey = localParts(place.tz, new Date(Date.now() - 86_400_000)).dateKey;
        if (lastKey === yesterdayKey) await send("streak", { title: "حافظ على سلسلتك", body: "لم تفتح سَكينة اليوم بعد. صفحة من القرآن أو أذكار المساء تكفي لتواصل رحلتك.", url: "/", tag: "streak" });
      }
    }
  }
}

export function startNotificationScheduler() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    logger.warn("VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not set — push scheduler will not send anything");
  }
  setInterval(() => {
    tick().catch((error) => logger.error({ error }, "notification scheduler tick failed"));
  }, 30_000);
  logger.info("notification scheduler started");
}
