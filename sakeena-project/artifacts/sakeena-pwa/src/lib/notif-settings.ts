import { apiFetch } from '@/lib/api-client';
import { readStorage, writeStorage } from '@/lib/sakeena';

// Same shape as the server's lib/notif-settings.ts — keep the two in sync.
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
  master: false,
  prayerBefore: true, prayerNow: true,
  morningStart: true, catchFajr: true, beforeDuha: true,
  eveningStart: true, eveningEnd: true,
  qiyam: true, qiyamStrong: false, mulk: false,
  salawat: true, answerHour: true, kahf: true,
  monThu: true, whiteDays: false, arafah: true, ashura: true, eid: true,
  dailyLight: true, dailyLightTime: '08:00', doses: 3,
  streak: true, resume: true,
};

const KEY = 'sakeena.notif-settings.v1';
export const loadNotifSettings = (): NotifSettings => ({ ...DEFAULT_NOTIF_SETTINGS, ...readStorage<Partial<NotifSettings>>(KEY, {}) });
export const storeNotifSettings = (settings: NotifSettings) => writeStorage(KEY, settings);
export const pushNotifSettings = (settings: NotifSettings) => apiFetch('/notification-settings', { method: 'PUT', body: JSON.stringify({ settings }) });
export const pullNotifSettings = () => apiFetch<{ settings: NotifSettings }>('/notification-settings').then((r) => r.settings);

// "Finish what you started": ask the server for one reminder a few hours from now.
export async function scheduleFollowup(input: { tag: string; title: string; body: string; url: string; delayMinutes?: number }) {
  const settings = loadNotifSettings();
  if (!settings.master || !settings.resume) return;
  try { await apiFetch('/notification-followups', { method: 'POST', body: JSON.stringify({ delayMinutes: 180, ...input }) }); } catch { /* best effort */ }
}
export async function cancelFollowup(tag: string) {
  if (!loadNotifSettings().master) return;
  try { await apiFetch(`/notification-followups/${encodeURIComponent(tag)}`, { method: 'DELETE' }); } catch { /* best effort */ }
}
