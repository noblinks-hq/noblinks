import { headers } from "next/headers";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getAIModel, isAIConfigured } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCapability, saveGeneratedCapability } from "@/lib/generate-capability";
import { monitoringCapability } from "@/lib/schema";

const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(2000, "Prompt too long"),
  machineName: z.string().optional(),
});

const aiWidgetSchema = z.object({
  matched: z.boolean().describe("Whether a matching capability was found"),
  isVague: z
    .boolean()
    .describe(
      "True when the request is too vague or ambiguous to act on — e.g. 'show me server health', 'monitor everything', 'is it running'. False when the intent is clear even if no capability matches."
    ),
  clarificationQuestion: z
    .string()
    .nullable()
    .describe(
      "A single, friendly question to ask the user to clarify their vague request. Only set when isVague is true. Example: 'Which aspect of server health would you like to monitor?'"
    ),
  suggestions: z
    .array(z.string())
    .describe(
      "3–5 concrete example prompts the user could try. Always provide these. When isVague is true make them relevant to the vague request; otherwise leave as general examples."
    ),
  capabilityKey: z
    .string()
    .nullable()
    .describe("The matching capability key from the list, or null if not matched"),
  widgetTitle: z
    .string()
    .nullable()
    .describe("Human-readable widget title like 'CPU Usage — web-server-1', or null if not matched"),
  widgetType: z
    .enum(["timeseries", "stat", "bar", "pie", "toplist"])
    .nullable()
    .describe("Widget visualization type based on the metric nature"),
  machine: z
    .string()
    .nullable()
    .describe("Target machine name/instance, or null if not matched"),
  metric: z
    .string()
    .nullable()
    .describe("The metric expression from the matched capability, or null if not matched"),
  noMatchReason: z
    .string()
    .nullable()
    .describe("Explanation of why no capability matched (if matched is false and not vague), or null"),
});

function buildSystemPrompt(
  capabilities: {
    capabilityKey: string;
    name: string;
    description: string;
    category: string;
    metric: string;
    defaultThreshold: number;
  }[]
): string {
  const capList = capabilities
    .map(
      (c) =>
        `- Key: ${c.capabilityKey}
  Name: ${c.name}
  Description: ${c.description}
  Category: ${c.category}
  Metric: ${c.metric}
  Default Threshold: ${c.defaultThreshold}`
    )
    .join("\n");

  return `You are a dashboard widget configuration assistant. The user wants to add a visualization widget to a monitoring dashboard. Match their request to a monitoring capability and determine the best widget configuration.

Available monitoring capabilities:
${capList}

RULES:
1. You MUST select a capabilityKey from the list above. Never invent a new one.
2. Extract the target machine name from the user's message.
3. Generate a clear, descriptive widgetTitle in the format "Metric Name — machine-name".
4. Determine the widgetType based on the metric nature:
   - "timeseries": trend / rate metrics over time — CPU usage, memory usage, network throughput, load average.
   - "stat": single current value — uptime, connection count, process count, file descriptor count.
   - "bar": compare discrete values across categories or time buckets — disk usage by mount point, requests by status code.
   - "pie": part-of-whole distributions — filesystem used vs free, memory breakdown by type.
   - "toplist": ranked list of top N values — top processes by CPU, top endpoints by latency.
5. Use the capability's metric field as the base metric expression, substituting the machine name where appropriate.
6. If the user's request doesn't match ANY capability, set matched to false and explain why in noMatchReason.
7. The machine parameter is the target server/instance name mentioned by the user.
8. SERVICE STATUS: If the user asks "is X running", "is X service up", or any variant about whether a Linux service/daemon is active, you MUST set matched=false UNLESS the capability list contains a capability whose metric includes "node_systemd_unit_state". NEVER match a service status query to process_open_fds, node_procs_running, or any unrelated metric.
9. VAGUE REQUESTS: Set isVague=true when the request lacks a specific metric — e.g. "server health", "monitor everything", "is it ok", "show me stats", "how is the server doing". Set a helpful clarificationQuestion and relevant suggestions. Do NOT set isVague=true for specific requests that just happen to not match a capability.
10. Always populate suggestions with 3–5 concrete prompts regardless of whether the request matched or was vague.`;
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
      {
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { prompt, machineName } = parsed.data;

  if (!isAIConfigured()) {
    return Response.json(
      { error: "AI provider not configured" },
      { status: 500 }
    );
  }

  // Fetch all capabilities from DB
  const capabilities = await db.select().from(monitoringCapability);

  // Call AI to parse user intent into structured widget config
  let result;
  try {
    result = await generateObject({
      model: getAIModel(),
      schema: aiWidgetSchema,
      system: buildSystemPrompt(capabilities),
      prompt,
    });
  } catch (err: unknown) {
    console.error("AI generateObject failed:", err);

    const statusCode =
      err instanceof Error && "statusCode" in err
        ? (err as Error & { statusCode: number }).statusCode
        : undefined;
    const message = err instanceof Error ? err.message : "Unknown error";

    if (statusCode === 401 || message.includes("Incorrect API key")) {
      return Response.json(
        {
          error:
            "Invalid AI API key. Check your OPENAI_API_KEY or OPENROUTER_API_KEY in .env.",
          errorType: "auth",
        },
        { status: 401 }
      );
    }

    if (statusCode === 429) {
      return Response.json(
        {
          error:
            "AI rate limit exceeded. Please wait a moment and try again.",
          errorType: "rate_limit",
        },
        { status: 429 }
      );
    }

    if (
      message.includes("fetch failed") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ETIMEDOUT") ||
      message.includes("network")
    ) {
      return Response.json(
        {
          error:
            "Could not reach the AI provider. Check your network connection and try again.",
          errorType: "network",
        },
        { status: 502 }
      );
    }

    const detail =
      process.env.NODE_ENV === "development" ? message : undefined;
    return Response.json(
      {
        error: "AI processing failed unexpectedly. Please try again.",
        errorType: "unknown",
        detail,
      },
      { status: 502 }
    );
  }

  const aiResult = result.object;

  const orgId = session.session.activeOrganizationId ?? "";
  const resolvedMachine = machineName ?? aiResult.machine ?? null;
  const machineCtx =
    orgId && resolvedMachine
      ? { orgId, machineName: resolvedMachine }
      : null;

  // ── Vague request — ask for clarification ────────────────────────────────────
  if (aiResult.isVague) {
    return Response.json({
      matched: false,
      errorType: "vague",
      clarificationQuestion: aiResult.clarificationQuestion,
      suggestions: aiResult.suggestions,
    });
  }

  // ── No match from existing capabilities → generate a new one ────────────────
  if (!aiResult.matched || !aiResult.capabilityKey || !aiResult.machine || !aiResult.widgetType) {
    const generated = await generateCapability(prompt, machineCtx);

    if (!generated) {
      return Response.json({
        matched: false,
        errorType: "no_match",
        noMatchReason: machineCtx
          ? `The agent on ${machineCtx.machineName} is offline or didn't respond in time. The AI needs to query the machine to determine the correct service name — please ensure the noblinks agent is running and try again.`
          : aiResult.noMatchReason || "Could not match your request to any capability and could not generate a new one.",
      });
    }

    const saved = await saveGeneratedCapability(generated);

    return Response.json({
      matched: true,
      capabilityKey: saved.capabilityKey,
      capabilityName: saved.name,
      widgetTitle: generated.widgetTitle || `${saved.name} — ${generated.machine ?? "machine"}`,
      widgetType: generated.widgetType,
      machine: generated.machine,
      metric: saved.metric,
      generated: true,
      generatedDescription: saved.description,
      generatedScrapeQuery: saved.scrapeQuery,
    });
  }

  // ── Matched existing capability ───────────────────────────────────────────
  const [capability] = await db
    .select()
    .from(monitoringCapability)
    .where(eq(monitoringCapability.capabilityKey, aiResult.capabilityKey));

  if (!capability) {
    // Key returned by AI doesn't exist — generate instead
    const generated = await generateCapability(prompt, machineCtx);
    if (!generated) {
      return Response.json({
        matched: false,
        errorType: "no_match",
        noMatchReason: machineCtx
          ? `The agent on ${machineCtx.machineName} is offline or didn't respond in time. The AI needs to query the machine to determine the correct service name — please ensure the noblinks agent is running and try again.`
          : "Could not resolve the requested capability.",
      });
    }
    const saved = await saveGeneratedCapability(generated);
    return Response.json({
      matched: true,
      capabilityKey: saved.capabilityKey,
      capabilityName: saved.name,
      widgetTitle: generated.widgetTitle || `${saved.name} — ${generated.machine ?? "machine"}`,
      widgetType: generated.widgetType,
      machine: generated.machine,
      metric: saved.metric,
      generated: true,
      generatedDescription: saved.description,
      generatedScrapeQuery: saved.scrapeQuery,
    });
  }

  return Response.json({
    matched: true,
    capabilityKey: aiResult.capabilityKey,
    capabilityName: capability.name,
    widgetTitle: aiResult.widgetTitle || `${capability.name} — ${aiResult.machine}`,
    widgetType: aiResult.widgetType,
    machine: aiResult.machine,
    metric: aiResult.metric || capability.metric,
  });
}
