import { headers } from "next/headers";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";

const messagePartSchema = z.object({
  type: z.string(),
  text: z.string().max(10000, "Message text too long").optional(),
});

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(messagePartSchema).optional(),
  content: z.union([z.string(), z.array(messagePartSchema)]).optional(),
});

const alertContextSchema = z.object({
  alertId: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.string(),
  status: z.string(),
  machineName: z.string(),
  triggeredAt: z.string(),
});

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).max(100, "Too many messages"),
  alertContext: alertContextSchema,
});

function buildSystemPrompt(ctx: z.infer<typeof alertContextSchema>): string {
  return `You are Noblinks AI, an expert SRE assistant investigating a specific alert.

ALERT CONTEXT:
- Title: ${ctx.title}
- Severity: ${ctx.severity}
- Status: ${ctx.status}
- Machine: ${ctx.machineName}
- Description: ${ctx.description}
- Triggered: ${ctx.triggeredAt}

FIRST RESPONSE INSTRUCTIONS:
When the user's first message is "__KICKOFF__", provide an initial investigation briefing:
1. Clear explanation of why this alert triggered
2. Potential impact if unaddressed
3. 2-3 focused diagnostic steps the user can run
4. One relevant follow-up question
Keep the response concise, structured, and technical. Do not reference the kickoff message.

YOUR ROLE:
- Analyze this alert and help the user investigate
- Suggest diagnostic commands the user can run and paste output back
- Interpret command outputs and provide analysis
- Suggest remediation steps (manual execution only)

RULES:
- Stay focused on this alert. If asked unrelated questions, redirect: "Let's focus on the active alert. For general assistance, use the AI Assistant page."
- Never claim to execute commands or modify infrastructure
- Be technical, precise, and calm
- Suggest read-only diagnostic steps first
- Warn before suggesting any destructive commands`;
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { messages, alertContext } = parsed.data;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OpenRouter API key not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const openrouter = createOpenRouter({ apiKey });

  const result = streamText({
    model: openrouter(process.env.OPENROUTER_MODEL || "openai/gpt-5-mini"),
    system: buildSystemPrompt(alertContext),
    messages: convertToModelMessages(messages as UIMessage[]),
  });

  return (
    result as unknown as { toUIMessageStreamResponse: () => Response }
  ).toUIMessageStreamResponse();
}
