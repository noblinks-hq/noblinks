import { headers } from "next/headers";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getAIModel, isAIConfigured } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { monitoringCapability } from "@/lib/schema";

const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(2000, "Prompt too long"),
});

const aiWidgetSchema = z.object({
  matched: z.boolean().describe("Whether a matching capability was found"),
  capabilityKey: z
    .string()
    .nullable()
    .describe(
      "The matching capability key from the list, or null if not matched"
    ),
  widgetTitle: z
    .string()
    .nullable()
    .describe(
      "Human-readable widget title like 'CPU Usage — web-server-1', or null if not matched"
    ),
  widgetType: z
    .enum(["timeseries", "stat", "bar", "pie", "toplist"])
    .nullable()
    .describe(
      "Widget visualization type based on the metric nature"
    ),
  machine: z
    .string()
    .nullable()
    .describe("Target machine name/instance, or null if not matched"),
  metric: z
    .string()
    .nullable()
    .describe(
      "The metric expression from the matched capability, or null if not matched"
    ),
  noMatchReason: z
    .string()
    .nullable()
    .describe(
      "Explanation of why no capability matched (if matched is false), or null if matched"
    ),
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
7. The machine parameter is the target server/instance name mentioned by the user.`;
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

  const { prompt } = parsed.data;

  if (!isAIConfigured()) {
    return Response.json(
      { error: "AI provider not configured" },
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
  const availableCapabilities = capabilities.map((c) => ({
    key: c.capabilityKey,
    name: c.name,
    description: c.description,
    category: c.category,
  }));

  // Handle no match
  if (!aiResult.matched) {
    return Response.json({
      matched: false,
      errorType: "no_match",
      noMatchReason:
        aiResult.noMatchReason ||
        "Could not match your request to any available monitoring capability.",
      availableCapabilities,
    });
  }

  // Validate the AI-selected capability actually exists
  if (!aiResult.capabilityKey || !aiResult.machine || !aiResult.widgetType) {
    return Response.json({
      matched: false,
      errorType: "incomplete",
      noMatchReason:
        "AI could not fully interpret your request. Try rephrasing with a specific metric and machine name.",
      availableCapabilities,
    });
  }

  const [capability] = await db
    .select()
    .from(monitoringCapability)
    .where(eq(monitoringCapability.capabilityKey, aiResult.capabilityKey));

  if (!capability) {
    return Response.json({
      matched: false,
      errorType: "invalid_capability",
      noMatchReason: `AI matched "${aiResult.capabilityKey}" which is not a valid capability. Try rephrasing your request.`,
      availableCapabilities,
    });
  }

  return Response.json({
    matched: true,
    capabilityKey: aiResult.capabilityKey,
    capabilityName: capability.name,
    widgetTitle:
      aiResult.widgetTitle || `${capability.name} — ${aiResult.machine}`,
    widgetType: aiResult.widgetType,
    machine: aiResult.machine,
    metric: aiResult.metric || capability.metric,
  });
}
