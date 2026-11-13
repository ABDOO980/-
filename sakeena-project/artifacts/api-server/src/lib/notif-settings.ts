// Per-user notification choices. The same shape is used by the web app
// (sakeena-pwa/src/lib/notif-settings.ts) — keep the two in sync.
export type NotifSettings = {
  master: boolean;
  prayerBefore: boolean; prayerNow: boolean;
  morningStart: boolean; catchFajr: boolean; beforeDuha: boolean;
  eveningStart: boolean; eveningEnd: boolean;
  qiyam: boolean; qiyamStrong: boolean; mulk: boolean;
  salawat: boolean; answerHour: boolean; kahf: boolean;
  monThu: boolean; whiteDays: boolean; arafah: boolean; ashura: boolean; eid: boolean;
  dailyLight: boolean; dailyLightTime: string; doses: number;
  streak: boolean; resume: boolean;
};

export const DEFAULT_NOTIF_SETTINGS: NotifSettings = {
  master: true,
  prayerBefore: true, prayerNow: true,
  morningStart: true, catchFajr: true, beforeDuha: true,
  eveningStart: true, eveningEnd: true,
  qiyam: true, qiyamStrong: false, mulk: false,
  salawat: true, answerHour: true, kahf: true,
  monThu: true, whiteDays: false, arafah: true, ashura: true, eid: true,
  dailyLight: true, dailyLightTime: "08:00", doses: 3,
  streak: true, resume: true,
};

const BOOLEAN_KEYS = Object.keys(DEFAULT_NOTIF_SETTINGS).filter((key) => typeof DEFAULT_NOTIF_SETTINGS[key as keyof NotifSettings] === "boolean") as (keyof NotifSettings)[];

export function sanitizeNotifSettings(input: unknown): NotifSettings {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const result: NotifSettings = { ...DEFAULT_NOTIF_SETTINGS };
  for (const key of BOOLEAN_KEYS) {
    if (typeof raw[key] === "boolean") (result as Record<string, unknown>)[key] = raw[key];
  }
  if (typeof raw.dailyLightTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.dailyLightTime)) result.dailyLightTime = raw.dailyLightTime;
  if (typeof raw.doses === "number" && [0, 3, 5, 8, 12].includes(raw.doses)) result.doses = raw.doses;
  return result;
}
