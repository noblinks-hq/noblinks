const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "alerts@noblinks.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://noblinks.com";

interface AlertEmailOptions {
  to: string;
  alertId: string;
  alertName: string;
  machine: string;
  severity: string;
  threshold: number;
  status: "firing" | "resolved";
}

export async function sendAlertEmail(opts: AlertEmailOptions): Promise<void> {
  if (!RESEND_API_KEY) return;

  const isFiring = opts.status === "firing";
  const subject = isFiring
    ? `[FIRING] ${opts.alertName} on ${opts.machine}`
    : `[RESOLVED] ${opts.alertName} on ${opts.machine}`;

  const alertUrl = `${APP_URL}/alerts/${opts.alertId}`;
  const statusColor = isFiring ? "#ef4444" : "#22c55e";
  const statusLabel = isFiring ? "FIRING" : "RESOLVED";

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f9fafb; padding: 32px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; padding: 32px;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
      <span style="display: inline-block; background: ${statusColor}; color: #fff; font-weight: 700; font-size: 12px; padding: 2px 10px; border-radius: 12px; letter-spacing: 0.05em;">${statusLabel}</span>
    </div>
    <h2 style="margin: 0 0 8px; font-size: 18px; color: #111827;">${opts.alertName}</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 40%;">Machine</td>
        <td style="padding: 6px 0; font-size: 14px; color: #111827;">${opts.machine}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Severity</td>
        <td style="padding: 6px 0; font-size: 14px; color: #111827; text-transform: capitalize;">${opts.severity}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Threshold</td>
        <td style="padding: 6px 0; font-size: 14px; color: #111827;">${opts.threshold}</td>
      </tr>
    </table>
    <a href="${alertUrl}" style="display: inline-block; background: #111827; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">View Alert</a>
    <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">Sent by Noblinks · <a href="${APP_URL}/settings" style="color: #9ca3af;">Manage notifications</a></p>
  </div>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: opts.to,
      subject,
      html,
    }),
  }).catch((err) => {
    console.error("[email] Failed to send alert email:", err);
  });
}
