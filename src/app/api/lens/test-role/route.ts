import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { requireAuth } from "@/lib/session";

const EXTERNAL_ID = "noblinks-lens-dev";

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { roleArn?: string };
  const { roleArn } = body;

  if (!roleArn || !roleArn.startsWith("arn:aws:iam::")) {
    return Response.json({ error: "Invalid role ARN" }, { status: 400 });
  }

  const sts = new STSClient({ region: "eu-central-1" });

  try {
    await sts.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: "noblinks-lens-test",
        ExternalId: EXTERNAL_ID,
        DurationSeconds: 900,
      })
    );

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AssumeRole failed";
    return Response.json({ error: message }, { status: 403 });
  }
}
