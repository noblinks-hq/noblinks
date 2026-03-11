"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Copy,
  Check,
  Loader2,
  MessageSquare,
  Plus,
  Search,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { PageHeader } from "@/components/product/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { Dashboard, DbMachine } from "@/lib/types";
import type { Components } from "react-markdown";

// -- Markdown components (matching existing chat page) -----------------------

const H1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = (props) => (
  <h1 className="mt-2 mb-3 text-2xl font-bold" {...props} />
);
const H2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = (props) => (
  <h2 className="mt-2 mb-2 text-xl font-semibold" {...props} />
);
const H3: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = (props) => (
  <h3 className="mt-2 mb-2 text-lg font-semibold" {...props} />
);
const Paragraph: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = (
  props
) => <p className="mb-3 leading-7 text-sm" {...props} />;
const UL: React.FC<React.HTMLAttributes<HTMLUListElement>> = (props) => (
  <ul className="mb-3 ml-5 list-disc space-y-1 text-sm" {...props} />
);
const OL: React.FC<React.OlHTMLAttributes<HTMLOListElement>> = (props) => (
  <ol className="mb-3 ml-5 list-decimal space-y-1 text-sm" {...props} />
);
const LI: React.FC<React.LiHTMLAttributes<HTMLLIElement>> = (props) => (
  <li className="leading-6" {...props} />
);
const Anchor: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = (
  props
) => (
  <a
    className="underline underline-offset-2 text-primary hover:opacity-90"
    target="_blank"
    rel="noreferrer noopener"
    {...props}
  />
);
const Blockquote: React.FC<React.BlockquoteHTMLAttributes<HTMLElement>> = (
  props
) => (
  <blockquote
    className="mb-3 border-l-2 border-border pl-3 text-muted-foreground"
    {...props}
  />
);
const Code: Components["code"] = ({ children, className, ...props }) => {
  const match = /language-(\w+)/.exec(className || "");
  const isInline = !match;
  const content = children as React.ReactNode;
  if (isInline) {
    return (
      <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props}>
        {content}
      </code>
    );
  }
  return (
    <pre className="mb-3 w-full overflow-x-auto rounded-md bg-muted p-3">
      <code className="text-xs leading-5" {...props}>
        {content}
      </code>
    </pre>
  );
};
const HR: React.FC<React.HTMLAttributes<HTMLHRElement>> = (props) => (
  <hr className="my-4 border-border" {...props} />
);
const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = (
  props
) => (
  <div className="mb-3 overflow-x-auto">
    <table className="w-full border-collapse text-sm" {...props} />
  </div>
);
const TH: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = (
  props
) => (
  <th
    className="border border-border bg-muted px-2 py-1 text-left"
    {...props}
  />
);
const TD: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = (
  props
) => <td className="border border-border px-2 py-1" {...props} />;

const markdownComponents: Components = {
  h1: H1,
  h2: H2,
  h3: H3,
  p: Paragraph,
  ul: UL,
  ol: OL,
  li: LI,
  a: Anchor,
  blockquote: Blockquote,
  code: Code,
  hr: HR,
  table: Table,
  th: TH,
  td: TD,
};

// -- Types for message parts -------------------------------------------------

interface TextPart {
  type: "text";
  text: string;
}

interface ToolInvocationPart {
  type: "tool-invocation";
  toolCallId: string;
  toolName: string;
  state: "call" | "partial-call" | "result";
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

type MessagePart = TextPart | ToolInvocationPart;

interface ChatMessage {
  id: string;
  role: string;
  parts?: MessagePart[];
  createdAt?: Date;
}

// -- Helper: copy button -----------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-muted rounded transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

// -- Tool result renderers ---------------------------------------------------

function PromQLResultBlock({
  args,
  result,
}: {
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}) {
  const purpose = (args.purpose as string) ?? "PromQL query";
  const results = (result.results as string[]) ?? [];
  const error = result.error as string | undefined;

  return (
    <div className="my-2 rounded-lg border bg-muted/50 p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{purpose}</p>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {results.length === 0 && !error && (
        <p className="text-xs text-muted-foreground italic">
          No results returned.
        </p>
      )}
      {results.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {results.map((r, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {r}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ProposeWidgetCard({
  result,
  onAddToDashboard,
}: {
  result: Record<string, unknown>;
  onAddToDashboard: (result: Record<string, unknown>) => void;
}) {
  const title = (result.title as string) ?? "Untitled Widget";

  return (
    <div className="my-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-amber-500 shrink-0" />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {result.prompt ? (
        <p className="text-xs text-muted-foreground">
          {String(result.prompt)}
        </p>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAddToDashboard(result)}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Add to Dashboard
      </Button>
    </div>
  );
}

// -- Tool-call in-progress indicator -----------------------------------------

function ToolCallIndicator({ toolName }: { toolName: string }) {
  const label =
    toolName === "runPromQL" ? "Querying cluster..." : "Preparing widget...";
  return (
    <div className="my-2 flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// -- Add-to-dashboard dialog -------------------------------------------------

function AddToDashboardDialog({
  open,
  onOpenChange,
  widgetResult,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgetResult: Record<string, unknown> | null;
}) {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"select" | "creating" | "success" | "error">(
    "select"
  );
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch dashboards when dialog opens
  useEffect(() => {
    if (!open) return;
    setStep("select");
    setSelectedDashboard("");
    setErrorMessage("");
    fetch("/api/dashboards?limit=50")
      .then((r) => (r.ok ? r.json() : { dashboards: [] }))
      .then((data: { dashboards: Dashboard[] }) => {
        setDashboards(data.dashboards);
        const first = data.dashboards[0];
        if (first) {
          setSelectedDashboard(first.id);
        }
      })
      .catch(() => {
        setDashboards([]);
      });
  }, [open]);

  const handleCreate = async () => {
    if (!widgetResult || !selectedDashboard) return;
    setStep("creating");
    setLoading(true);

    try {
      // Step 1: Generate widget config via the create-widget AI endpoint
      const createRes = await fetch("/api/chat/create-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: widgetResult.prompt as string,
          machineName: (widgetResult.machine as string) || undefined,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || "Failed to generate widget configuration");
      }

      const widgetConfig = await createRes.json();

      if (!widgetConfig.matched) {
        throw new Error(
          widgetConfig.noMatchReason || "Could not generate widget"
        );
      }

      // Step 2: Add the widget to the selected dashboard
      const addRes = await fetch(
        `/api/dashboards/${selectedDashboard}/widgets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: widgetConfig.widgetTitle,
            type: widgetConfig.widgetType,
            metric: widgetConfig.metric,
            machine: widgetConfig.machine,
            capabilityKey: widgetConfig.capabilityKey ?? null,
            thresholdValue: null,
          }),
        }
      );

      if (!addRes.ok) {
        const data = await addRes.json();
        throw new Error(data.error || "Failed to add widget to dashboard");
      }

      setStep("success");
      toast.success("Widget added to dashboard");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle>Add Widget to Dashboard</DialogTitle>
              <DialogDescription>
                Select a dashboard to add this widget to.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {widgetResult && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="text-sm font-medium">
                    {String(widgetResult.title ?? "")}
                  </p>
                  {widgetResult.prompt ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {String(widgetResult.prompt)}
                    </p>
                  ) : null}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Dashboard</label>
                <select
                  value={selectedDashboard}
                  onChange={(e) => setSelectedDashboard(e.target.value)}
                  className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm"
                >
                  {dashboards.length === 0 && (
                    <option value="">No dashboards available</option>
                  )}
                  {dashboards.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!selectedDashboard || loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "creating" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Spinner size="lg" />
            <p className="font-medium">Creating widget...</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Widget Added</p>
              <p className="text-sm text-muted-foreground">
                Your widget has been added to the dashboard.
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Search className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-semibold">Failed to create widget</p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setStep("select")}>Try Again</Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// -- Main page ---------------------------------------------------------------

export default function ClusterChatPage() {
  const [machines, setMachines] = useState<DbMachine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [input, setInput] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pendingWidget, setPendingWidget] = useState<Record<
    string,
    unknown
  > | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat/cluster",
        body: { machineName: selectedMachine },
      }),
    [selectedMachine]
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
    onError: (err) => {
      toast.error(err.message || "Failed to send message");
    },
  });

  // Fetch machines on mount
  useEffect(() => {
    fetch("/api/machines?limit=50")
      .then((r) => (r.ok ? r.json() : { machines: [] }))
      .then((data: { machines: DbMachine[] }) => {
        const allMachines = data.machines;
        // Prefer kubernetes machines if any exist
        const k8sMachines = allMachines.filter(
          (m) => m.category === "kubernetes"
        );
        setMachines(k8sMachines.length > 0 ? k8sMachines : allMachines);
      })
      .catch(() => {
        setMachines([]);
      });
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear chat when machine changes
  const handleMachineChange = useCallback(
    (name: string) => {
      setSelectedMachine(name);
      setMessages([]);
    },
    [setMessages]
  );

  const handleAddToDashboard = useCallback(
    (result: Record<string, unknown>) => {
      setPendingWidget(result);
      setAddDialogOpen(true);
    },
    []
  );

  const isStreaming = status === "streaming";

  // Detect if any tool call is in-progress (state === "call")
  const hasActiveToolCall = messages.some((m) =>
    (m.parts as MessagePart[] | undefined)?.some(
      (p) => p.type === "tool-invocation" && p.state === "call"
    )
  );

  const getMessageText = (msg: ChatMessage): string => {
    const parts = msg.parts ?? [];
    return parts
      .filter((p): p is TextPart => p.type === "text" && !!p.text)
      .map((p) => p.text)
      .join("\n");
  };

  const formatTimestamp = (date: Date): string =>
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Cluster Chat" icon={MessageSquare} />

      <div className="flex flex-col flex-1 min-h-0 p-4 gap-4">
        {/* Machine selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium shrink-0">Machine</label>
          <select
            value={selectedMachine}
            onChange={(e) => handleMachineChange(e.target.value)}
            className="border-input bg-background h-9 max-w-xs w-full rounded-md border px-3 py-1 text-sm"
          >
            <option value="">Select a machine...</option>
            {machines.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
                {m.hostname && m.hostname !== m.name
                  ? ` (${m.hostname})`
                  : ""}
              </option>
            ))}
          </select>
          {selectedMachine && (
            <span className="text-xs text-muted-foreground">
              Chat with AI about your cluster
            </span>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              Error: {error.message || "Something went wrong"}
            </p>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {!selectedMachine && (
            <div className="text-center text-muted-foreground py-12">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                Select a machine to start chatting about your cluster.
              </p>
            </div>
          )}

          {selectedMachine && messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-sm">
                Ask questions about your Kubernetes cluster.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {[
                  "What namespaces exist?",
                  "List all pods in default namespace",
                  "Show pod memory usage",
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setInput(example)}
                    className="rounded-md border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const msg = message as unknown as ChatMessage;
            const parts = msg.parts ?? [];
            const messageText = getMessageText(msg);
            const timestamp = msg.createdAt
              ? formatTimestamp(new Date(msg.createdAt))
              : null;

            return (
              <div
                key={msg.id}
                className={`group p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                    : "bg-muted max-w-[80%]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {message.role === "user" ? "You" : "AI"}
                    </span>
                    {timestamp && (
                      <span className="text-xs opacity-60">{timestamp}</span>
                    )}
                  </div>
                  {message.role === "assistant" && messageText && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <CopyButton text={messageText} />
                    </div>
                  )}
                </div>
                <div>
                  {parts.map((part, idx) => {
                    if (part.type === "text" && part.text) {
                      return (
                        <ReactMarkdown
                          key={idx}
                          components={markdownComponents}
                        >
                          {part.text}
                        </ReactMarkdown>
                      );
                    }

                    if (part.type === "tool-invocation") {
                      const toolPart = part as ToolInvocationPart;

                      // In-progress tool call
                      if (
                        toolPart.state === "call" ||
                        toolPart.state === "partial-call"
                      ) {
                        return (
                          <ToolCallIndicator
                            key={idx}
                            toolName={toolPart.toolName}
                          />
                        );
                      }

                      // Completed tool call with result
                      if (toolPart.state === "result" && toolPart.result) {
                        if (toolPart.toolName === "runPromQL") {
                          return (
                            <PromQLResultBlock
                              key={idx}
                              args={toolPart.args ?? {}}
                              result={
                                toolPart.result as Record<string, unknown>
                              }
                            />
                          );
                        }
                        if (toolPart.toolName === "proposeWidget") {
                          return (
                            <ProposeWidgetCard
                              key={idx}
                              result={
                                toolPart.result as Record<string, unknown>
                              }
                              onAddToDashboard={handleAddToDashboard}
                            />
                          );
                        }
                      }
                    }

                    return null;
                  })}
                </div>
              </div>
            );
          })}

          {/* Streaming indicator when waiting for first response */}
          {isStreaming &&
            messages.length > 0 &&
            messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted max-w-[80%]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  {hasActiveToolCall
                    ? "Querying cluster..."
                    : "AI is thinking..."}
                </span>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = input.trim();
            if (!text || !selectedMachine) return;
            sendMessage({ role: "user", parts: [{ type: "text", text }] });
            setInput("");
          }}
          className="flex gap-2 shrink-0"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedMachine
                ? "Ask about your cluster..."
                : "Select a machine first"
            }
            className="flex-1 p-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isStreaming || !selectedMachine}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming || !selectedMachine}
          >
            {isStreaming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending
              </>
            ) : (
              "Send"
            )}
          </Button>
        </form>
      </div>

      {/* Add to Dashboard dialog */}
      <AddToDashboardDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        widgetResult={pendingWidget}
      />
    </div>
  );
}
