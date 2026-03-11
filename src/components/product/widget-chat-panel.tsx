"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader2, Plus, Send, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DbMachine } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

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
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface WidgetChatPanelProps {
  dashboardId: string;
  onWidgetCreated: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WidgetChatPanel({ dashboardId, onWidgetCreated }: WidgetChatPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [machines, setMachines] = useState<DbMachine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [addingWidget, setAddingWidget] = useState<string | null>(null); // toolCallId being added
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep a ref so the fetch closure always sees the latest machine name
  const machineRef = useRef(selectedMachine);
  useEffect(() => {
    machineRef.current = selectedMachine;
  }, [selectedMachine]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat/cluster",
        fetch: async (url, options) => {
          const existing = JSON.parse((options?.body as string) ?? "{}") as Record<string, unknown>;
          return fetch(url as string, {
            ...options,
            body: JSON.stringify({
              ...existing,
              machineName: machineRef.current,
              dashboardId,
            }),
          });
        },
      }),
    [dashboardId] // stable — ref handles machine updates
  );

  const { messages, sendMessage, status, setMessages } = useChat({ transport });
  const isStreaming = status === "streaming";

  // Fetch machines when panel expands
  useEffect(() => {
    if (!expanded) return;
    fetch("/api/machines?limit=50")
      .then((r) => (r.ok ? r.json() : { machines: [] }))
      .then((data: { machines: DbMachine[] }) => {
        const k8s = data.machines.filter((m) => m.category === "kubernetes");
        setMachines(k8s.length > 0 ? k8s : data.machines);
        const first = (k8s.length > 0 ? k8s : data.machines)[0];
        if (first && !selectedMachine) setSelectedMachine(first.name);
      })
      .catch(() => {});
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (expanded) setTimeout(() => inputRef.current?.focus(), 100);
  }, [expanded]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    sendMessage({ role: "user", parts: [{ type: "text", text }] });
    setInput("");
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMachineChange = useCallback(
    (name: string) => {
      setSelectedMachine(name);
      setMessages([]);
    },
    [setMessages]
  );

  // Add a proposed widget directly to the current dashboard
  const handleAddWidget = useCallback(
    async (toolCallId: string, widgetResult: Record<string, unknown>) => {
      setAddingWidget(toolCallId);
      try {
        const createRes = await fetch("/api/chat/create-widget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: widgetResult.prompt as string,
            machineName:
              (widgetResult.machine as string) || selectedMachine || undefined,
          }),
        });
        if (!createRes.ok) return;
        const cfg = await createRes.json();

        if (cfg.multiWidget) {
          await Promise.all(
            (
              cfg.widgets as Array<{
                title: string;
                widgetType: string;
                metric: string;
                machine: string;
                capabilityKey: string;
              }>
            ).map((w) =>
              fetch(`/api/dashboards/${dashboardId}/widgets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: w.title,
                  type: w.widgetType,
                  metric: w.metric,
                  machine: w.machine,
                  capabilityKey: w.capabilityKey ?? null,
                  thresholdValue: null,
                }),
              })
            )
          );
          onWidgetCreated();
        } else if (cfg.matched) {
          await fetch(`/api/dashboards/${dashboardId}/widgets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: cfg.widgetTitle,
              type: cfg.widgetType,
              metric: cfg.metric,
              machine: cfg.machine || selectedMachine,
              capabilityKey: cfg.capabilityKey ?? null,
              thresholdValue: null,
            }),
          });
          onWidgetCreated();
        }
      } catch {
        /* ignore */
      } finally {
        setAddingWidget(null);
      }
    },
    [dashboardId, selectedMachine, onWidgetCreated]
  );

  // ── Collapsed pill ───────────────────────────────────────────────────────────

  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-6 z-30">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 rounded-full border bg-background px-4 py-2.5 shadow-lg hover:bg-muted/60 transition-colors"
        >
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ask AI about your cluster...</span>
        </button>
      </div>
    );
  }

  // ── Expanded panel ───────────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-4 right-6 z-30 flex flex-col w-[420px] max-h-[580px] rounded-2xl border bg-background shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">AI Cluster Assistant</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7"
          onClick={() => setExpanded(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Machine selector */}
      <div className="shrink-0 border-b px-4 py-2">
        <select
          value={selectedMachine}
          onChange={(e) => handleMachineChange(e.target.value)}
          className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
        >
          <option value="">Select machine / cluster...</option>
          {machines.map((m) => (
            <option key={m.id} value={m.name}>
              {m.name}
              {m.hostname && m.hostname !== m.name ? ` (${m.hostname})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask anything about your cluster, or say &quot;add a widget for CPU usage&quot;.
            </p>
            {selectedMachine && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {[
                  "How many namespaces are there?",
                  "List pods in default namespace",
                  "Show memory usage for noblinks pods",
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInput(s)}
                    className="rounded-lg border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((message) => {
          const msg = message as unknown as ChatMessage;
          const parts = (msg.parts ?? []) as MessagePart[];

          return (
            <div
              key={msg.id}
              className={
                message.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  message.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                    : "max-w-[92%] space-y-1.5"
                }
              >
                {parts.map((part, idx) => {
                  // Text part
                  if (part.type === "text" && part.text) {
                    if (message.role === "user") {
                      return <span key={idx}>{part.text}</span>;
                    }
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm"
                      >
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className="mb-1 last:mb-0 leading-6 text-sm">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="mb-1 ml-4 list-disc space-y-0.5 text-sm">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="mb-1 ml-4 list-decimal space-y-0.5 text-sm">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="leading-5">{children}</li>
                            ),
                            code: ({ children }) => (
                              <code className="rounded bg-background px-1 py-0.5 text-xs font-mono">
                                {children}
                              </code>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold">{children}</strong>
                            ),
                          }}
                        >
                          {part.text}
                        </ReactMarkdown>
                      </div>
                    );
                  }

                  // Tool invocation part
                  if (part.type === "tool-invocation") {
                    const tp = part as ToolInvocationPart;

                    // In-progress
                    if (tp.state === "call" || tp.state === "partial-call") {
                      const label =
                        tp.toolName === "runPromQL"
                          ? `Querying agent${tp.args?.purpose ? `: ${String(tp.args.purpose)}` : "..."}`
                          : "Preparing widget...";
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-xl border bg-muted/50 px-3.5 py-2"
                        >
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                      );
                    }

                    // Result
                    if (tp.state === "result" && tp.result) {
                      if (tp.toolName === "runPromQL") {
                        const results = (tp.result.results as string[]) ?? [];
                        const error = tp.result.error as string | undefined;
                        const purpose =
                          (tp.args?.purpose as string) ?? "Query result";
                        return (
                          <div
                            key={idx}
                            className="rounded-xl border bg-muted/30 px-3.5 py-2.5 space-y-2"
                          >
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              {purpose}
                            </p>
                            {error && (
                              <p className="text-xs text-destructive">{error}</p>
                            )}
                            {results.length === 0 && !error && (
                              <p className="text-xs italic text-muted-foreground">
                                No results
                              </p>
                            )}
                            {results.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {results.map((r, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-[11px]"
                                  >
                                    {r}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (tp.toolName === "proposeWidget") {
                        const res = tp.result;
                        const isAdding = addingWidget === tp.toolCallId;
                        return (
                          <div
                            key={idx}
                            className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3.5 py-3 space-y-2.5"
                          >
                            <div className="flex items-start gap-2">
                              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold leading-tight">
                                  {String(res.title ?? "Widget")}
                                </p>
                                {res.prompt != null && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {String(res.prompt)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={isAdding}
                              onClick={() =>
                                handleAddWidget(tp.toolCallId, res)
                              }
                            >
                              {isAdding ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Plus className="mr-1 h-3.5 w-3.5" />
                              )}
                              Add to this dashboard
                            </Button>
                          </div>
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

        {/* Thinking indicator */}
        {isStreaming &&
          messages.length > 0 &&
          messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 flex items-center gap-2 border-t px-4 py-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedMachine
              ? "Ask about your cluster..."
              : "Select a machine first..."
          }
          disabled={isStreaming || !selectedMachine}
          className="flex-1 rounded-full border border-input bg-muted/50 px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
        <Button
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming || !selectedMachine}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
