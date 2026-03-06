import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sendAlertEmail } from "@/lib/email";
import { notificationChannel } from "@/lib/schema";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://noblinks.com";

interface AlertNotifyOptions {
  organizationId: string;
  alertId: string;
  alertName: string;
  machine: string;
  severity: string;
  threshold: number;
  status: "firing" | "resolved";
  /** Legacy: org-level notification email (still honoured alongside channels) */
  legacyEmail?: string | null;
}

type ChannelConfig = { email?: string; webhookUrl?: string };

async function sendSlackNotification(
  webhookUrl: string,
  opts: AlertNotifyOptions
): Promise<void> {
  const isFiring = opts.status === "firing";
  const color = isFiring ? "#ef4444" : "#22c55e";
  const statusLabel = isFiring ? ":red_circle: FIRING" : ":large_green_circle: RESOLVED";

  const payload = {
    attachments: [
      {
        color,
        title: `${statusLabel}: ${opts.alertName}`,
        title_link: `${APP_URL}/alerts/${opts.alertId}`,
        fields: [
          { title: "Machine", value: opts.machine, short: true },
          { title: "Severity", value: opts.severity, short: true },
          { title: "Threshold", value: String(opts.threshold), short: true },
          { title: "Status", value: opts.status.toUpperCase(), short: true },
        ],
        footer: "Noblinks",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error("[notify] Failed to send Slack notification:", err);
  });
}

/**
 * Fan-out alert notification to all enabled channels for the org,
 * plus the legacy org-level email if provided.
 */
export async function notifyAlert(opts: AlertNotifyOptions): Promise<void> {
  const channels = await db
    .select()
    .from(notificationChannel)
    .where(eq(notificationChannel.organizationId, opts.organizationId));

  const promises: Promise<void>[] = [];

  for (const ch of channels) {
    if (!ch.enabled) continue;
    const config = ch.config as ChannelConfig;

    if (ch.type === "email" && config.email) {
      promises.push(
        sendAlertEmail({
          to: config.email,
          alertId: opts.alertId,
          alertName: opts.alertName,
          machine: opts.machine,
          severity: opts.severity,
          threshold: opts.threshold,
          status: opts.status,
        })
      );
    } else if (ch.type === "slack" && config.webhookUrl) {
      promises.push(sendSlackNotification(config.webhookUrl, opts));
    }
  }

  // Legacy org-level email
  if (opts.legacyEmail) {
    promises.push(
      sendAlertEmail({
        to: opts.legacyEmail,
        alertId: opts.alertId,
        alertName: opts.alertName,
        machine: opts.machine,
        severity: opts.severity,
        threshold: opts.threshold,
        status: opts.status,
      })
    );
  }

  await Promise.allSettled(promises);
}
