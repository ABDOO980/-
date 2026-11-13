import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { logger } from "./logger";

// `strong` asks the device to keep the notification on screen with a firmer
// vibration (used for the night-prayer wake-up). `tag` replaces an earlier one.
export type PushPayload = { title: string; body: string; url?: string; tag?: string; strong?: boolean };

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@example.com";
  if (!publicKey || !privateKey) {
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

// Sends to every subscription belonging to a user. A subscription the push
// service reports as gone (410/404 — the user uninstalled, cleared data,
// etc.) is deleted so we stop wasting sends on it.
export async function sendPushToUser(userId: number, payload: PushPayload) {
  if (!ensureConfigured()) {
    logger.warn("VAPID keys not configured — skipping push send");
    return;
  }
  const subscriptions = await db.select().from(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.userId, userId));
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, sub.id));
        } else {
          logger.error({ error }, "push send failed");
        }
      }
    }),
  );
}

// Sends to every subscribed device (admin broadcast). Returns how many
// subscriptions were attempted.
export async function sendPushToAll(payload: PushPayload) {
  if (!ensureConfigured()) return 0;
  const users = await db.selectDistinct({ userId: pushSubscriptionsTable.userId }).from(pushSubscriptionsTable);
  for (const { userId } of users) await sendPushToUser(userId, payload);
  const all = await db.select({ id: pushSubscriptionsTable.id }).from(pushSubscriptionsTable);
  return all.length;
}
