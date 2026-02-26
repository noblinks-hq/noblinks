import { headers } from "next/headers";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { monitoringCapability } from "@/lib/schema";

const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(2000, "Prompt too long"),
});

const aiAlertSchema = z.object({
  matched: z.boolean().describe("Whether a matching capability was found"),
  capabilityKey: z
    .string()
    .optional()
    .describe("The matching capability key from the list"),
  params: z
    .object({
      machine: z.string().describe("Target machine name/instance"),
      threshold: z.number().describe("Alert threshold value"),
      window: z.string().describe("Time window duration like 5m, 1h, 30s"),
    })
    .optional()
    .describe("Extracted parameters from the user message"),
  severity: z
    .enum(["critical", "warning", "info"])
    .optional()
    .describe("Alert severity level"),
  alertName: z
    .string()
    .optional()
    .describe("Human-readable name for the alert"),
  description: z
    .string()
    .optional()
    .describe("Brief description of what this alert monitors"),
  noMatchReason: z
    .string()
    .optional()
    .describe("Explanation of why no capability matched, if matched is false"),
});

function buildSystemPrompt(
  capabilities: { capabilityKey: string; name: string; description: string; category: string; parameters: unknown; defaultThreshold: number; defaultWindow: string; suggestedSeverity: string }[]
): string {
  const capList = capabilities
    .map(
      (c) =>
        `- Key: ${c.capabilityKey}
  Name: ${c.name}
  Description: ${c.description}
  Category: ${c.category}
  Parameters: ${JSON.stringify(c.parameters)}
  Default Threshold: ${c.defaultThreshold}
  Default Window: ${c.defaultWindow}
  Suggested Severity: ${c.suggestedSeverity}`
    )
    .join("\n");

  return `You are an alert configuration assistant for a monitoring platform.

Available monitoring capabilities:
${capList}

RULES:
1. You MUST select a capabilityKey from the list above. Never invent a new one.
2. Extract parameters from the user's message.
3. If threshold is not specified, use the capability's defaultThreshold.
4. If window/duration is not specified, use the capability's defaultWindow.
5. If severity is not specified, use the capability's suggestedSeverity.
6. Generate a clear, descriptive alertName.
7. If the user's request doesn't match ANY capability, set matched to false and explain why in noMatchReason.
8. The machine parameter is the target server/instance name mentioned by the user.
9. Window must be a duration string like 5m, 1h, 30s, 1d.`;
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { prompt } = parsed.data;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 }
    );
  }

  // Fetch all capabilities from DB
  const capabilities = await db.select().from(monitoringCapability);

  if (capabilities.length === 0) {
    return Response.json(
      { error: "No monitoring capabilities configured" },
      { status: 500 }
    );
  }

  const openrouter = createOpenRouter({ apiKey });

  // Call AI to parse user intent into structured alert config
  let result;
  try {
    result = await generateObject({
      model: openrouter(process.env.OPENROUTER_MODEL || "openai/gpt-5-mini"),
      schema: aiAlertSchema,
      system: buildSystemPrompt(capabilities),
      prompt,
    });
  } catch {
    return Response.json(
      { error: "AI processing failed. Please try again." },
      { status: 502 }
    );
  }

  const aiResult = result.object;

  // Handle no match
  if (!aiResult.matched) {
    return Response.json({
      matched: false,
      noMatchReason: aiResult.noMatchReason || "Could not match your request to any available capability.",
      availableCapabilities: capabilities.map((c) => ({
        key: c.capabilityKey,
        name: c.name,
        description: c.description,
        category: c.category,
      })),
    });
  }

  // Validate the AI-selected capability actually exists
  if (!aiResult.capabilityKey || !aiResult.params) {
    return Response.json(
      { error: "AI returned incomplete response. Please try again." },
      { status: 502 }
    );
  }

  const [capability] = await db
    .select()
    .from(monitoringCapability)
    .where(eq(monitoringCapability.capabilityKey, aiResult.capabilityKey));

  if (!capability) {
    return Response.json({
      matched: false,
      noMatchReason: `AI selected an invalid capability "${aiResult.capabilityKey}". Please try again.`,
      availableCapabilities: capabilities.map((c) => ({
        key: c.capabilityKey,
        name: c.name,
        description: c.description,
        category: c.category,
      })),
    });
  }

  return Response.json({
    matched: true,
    capabilityKey: aiResult.capabilityKey,
    capabilityName: capability.name,
    alertTemplate: capability.alertTemplate,
    params: aiResult.params,
    severity: aiResult.severity || capability.suggestedSeverity,
    alertName: aiResult.alertName || `${capability.name} - ${aiResult.params.machine}`,
    description: aiResult.description || capability.description,
  });
}
