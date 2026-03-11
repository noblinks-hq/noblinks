import { headers } from "next/headers";
import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getAIModel, isAIConfigured } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { queryMachineLabels } from "@/lib/query-machine";

const messagePartSchema = z.object({
  type: z.string(),
  text: z.string().max(10000, "Message text too long").optional(),
  toolCallId: z.string().optional(),
  toolName: z.string().optional(),
  state: z.string().optional(),
  args: z.unknown().optional(),
  result: z.unknown().optional(),
});

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(messagePartSchema).optional(),
  content: z.union([z.string(), z.array(messagePartSchema)]).optional(),
});

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).max(100, "Too many messages"),
  machineName: z.string().optional(),
});

const SYSTEM_PROMPT = `You are a Kubernetes cluster assistant. You have real-time access to cluster metrics via Prometheus.

Use runPromQL to answer questions. Always query first, never guess cluster state.

PromQL reference for common questions:
- List namespaces: kube_namespace_labels
- Pods in namespace X: kube_pod_info{namespace="X"}
- Pod phases in namespace X: kube_pod_status_phase{namespace="X"}
- Container restart counts: kube_pod_container_status_restarts_total{namespace="X"}
- Memory per pod (bytes): container_memory_usage_bytes{namespace="X",pod!=""}
- CPU per pod (cores): rate(container_cpu_usage_seconds_total{namespace="X",pod!=""}[2m])
- Node names: kube_node_info
- Deployments in namespace X: kube_deployment_status_replicas{namespace="X"}

When the user asks to monitor something or create a widget, call proposeWidget with:
- prompt: a description like "memory usage for all pods in namespace X on machine Y"
- title: a clear widget title
- namespace: the relevant namespace (or null)

Be concise and factual. Format lists using markdown.`;

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

  const { messages, machineName } = parsed.data;

  if (!isAIConfigured()) {
    return new Response(
      JSON.stringify({ error: "AI provider not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const orgId = session.session.activeOrganizationId ?? "";

  const systemPrompt = machineName
    ? `${SYSTEM_PROMPT}\n\nTarget cluster machine: ${machineName}`
    : SYSTEM_PROMPT;

  const result = streamText({
    model: getAIModel(),
    system: systemPrompt,
    messages: convertToModelMessages(messages as UIMessage[]),
    stopWhen: stepCountIs(5),
    tools: {
      runPromQL: tool({
        description:
          "Run a PromQL query against the target cluster's Prometheus instance and return the label values from the result.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("The PromQL expression to evaluate"),
          purpose: z
            .string()
            .describe(
              "Brief description of what this query is checking, shown to the user"
            ),
        }),
        execute: async ({ query }) => {
          if (!machineName) {
            return {
              results: [] as string[],
              count: 0,
              error: "No machine selected. Ask the user to select a machine first.",
            };
          }

          const labels = await queryMachineLabels(
            orgId,
            machineName,
            query,
            8000
          );

          if (labels === null) {
            return {
              results: [] as string[],
              count: 0,
              error:
                "Query timed out or failed. The agent may be offline or the query invalid.",
            };
          }

          return {
            results: labels,
            count: labels.length,
          };
        },
      }),
      proposeWidget: tool({
        description:
          "Propose creating a dashboard widget for the user. The frontend will render this as an actionable card.",
        inputSchema: z.object({
          prompt: z
            .string()
            .describe(
              "A description of the widget, e.g. 'memory usage for all pods in namespace X on machine Y'"
            ),
          title: z.string().describe("A clear widget title"),
          namespace: z
            .string()
            .nullable()
            .describe("The relevant Kubernetes namespace, or null"),
        }),
        execute: async ({ prompt, title, namespace }) => {
          return {
            prompt,
            title,
            namespace,
            machine: machineName ?? null,
          };
        },
      }),
    },
  });

  return (
    result as unknown as { toUIMessageStreamResponse: () => Response }
  ).toUIMessageStreamResponse();
}
