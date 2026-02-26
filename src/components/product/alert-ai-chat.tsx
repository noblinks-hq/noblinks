"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Copy, Check, Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Components } from "react-markdown";

// --- Markdown components ---

const markdownComponents: Components = {
  h1: (props) => <h1 className="mt-2 mb-3 text-2xl font-bold" {...props} />,
  h2: (props) => (
    <h2 className="mt-2 mb-2 text-xl font-semibold" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-2 mb-2 text-lg font-semibold" {...props} />
  ),
  p: (props) => <p className="mb-3 leading-7 text-sm" {...props} />,
  ul: (props) => (
    <ul className="mb-3 ml-5 list-disc space-y-1 text-sm" {...props} />
  ),
  ol: (props) => (
    <ol className="mb-3 ml-5 list-decimal space-y-1 text-sm" {...props} />
  ),
  li: (props) => <li className="leading-6" {...props} />,
  a: (props) => (
    <a
      className="underline underline-offset-2 text-primary hover:opacity-90"
      target="_blank"
      rel="noreferrer noopener"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="mb-3 border-l-2 border-border pl-3 text-muted-foreground"
      {...props}
    />
  ),
  code: ({ children, className, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    if (!match) {
      return (
        <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="mb-3 w-full overflow-x-auto rounded-md bg-muted p-3">
        <code className="text-xs leading-5" {...props}>
          {children}
        </code>
      </pre>
    );
  },
  hr: (props) => <hr className="my-4 border-border" {...props} />,
  table: (props) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border border-border bg-muted px-2 py-1 text-left"
      {...props}
    />
  ),
  td: (props) => (
    <td className="border border-border px-2 py-1" {...props} />
  ),
};

// --- Helpers ---

type TextPart = { type?: string; text?: string };
type MaybePartsMessage = {
  display?: ReactNode;
  parts?: TextPart[];
  content?: TextPart[];
};

function getMessageText(message: MaybePartsMessage): string {
  const parts = Array.isArray(message.parts)
    ? message.parts
    : Array.isArray(message.content)
      ? message.content
      : [];
  return parts
    .filter((p) => p?.type === "text" && p.text)
    .map((p) => p.text)
    .join("\n");
}

function renderMessageContent(message: MaybePartsMessage): ReactNode {
  if (message.display) return message.display;
  const parts = Array.isArray(message.parts)
    ? message.parts
    : Array.isArray(message.content)
      ? message.content
      : [];
  return parts.map((p, idx) =>
    p?.type === "text" && p.text ? (
      <ReactMarkdown key={idx} components={markdownComponents}>
        {p.text}
      </ReactMarkdown>
    ) : null
  );
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

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

// --- Main component ---

const KICKOFF_MARKER = "__KICKOFF__";

function isKickoffMessage(message: MaybePartsMessage): boolean {
  const text = getMessageText(message);
  return text.trim() === KICKOFF_MARKER;
}

export interface AlertContext {
  alertId: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  machineName: string;
  triggeredAt: string;
}

interface AlertAiChatProps {
  alertContext: AlertContext;
  header?: ReactNode;
}

export function AlertAiChat({ alertContext, header }: AlertAiChatProps) {
  const storageKey = `alert-ai-${alertContext.alertId}`;
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat/alert",
      body: { alertContext },
    }),
    onError: (err) => {
      toast.error(err.message || "Failed to send message");
    },
  });

  const isStreaming = status === "streaming";

  // Filter out hidden kickoff messages from display
  const visibleMessages = messages.filter(
    (m) => !isKickoffMessage(m as MaybePartsMessage)
  );

  // Whether AI is generating the initial response (no visible messages yet)
  const isInitialLoading =
    isStreaming && visibleMessages.length === 0;

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [storageKey, setMessages]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  // Auto-send hidden kickoff message to trigger AI's first response
  useEffect(() => {
    if (hasSentInitial.current) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          hasSentInitial.current = true;
          return;
        }
      } catch {
        // continue
      }
    }
    hasSentInitial.current = true;
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: KICKOFF_MARKER }],
    });
  }, [alertContext, sendMessage, storageKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem(storageKey);
    toast.success("Chat cleared");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendMessage({ role: "user", parts: [{ type: "text", text }] });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      {header && (
        <div className="shrink-0 pb-4 mb-4 border-b">
          <div className="flex items-center justify-between">
            {header}
            {visibleMessages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearMessages}>
                Clear chat
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Inline error (graceful, not full banner) */}
      {error && (
        <div className="shrink-0 mb-4 mx-auto max-w-[80%] p-3 rounded-lg bg-muted text-sm text-muted-foreground">
          <span className="text-destructive font-medium">
            Unable to reach Noblinks AI.
          </span>{" "}
          {error.message || "Something went wrong."} Try refreshing the page.
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4">
        {/* Initial loading state */}
        {isInitialLoading && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted max-w-[80%]">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Noblinks AI is analyzing this alert&hellip;
            </span>
          </div>
        )}

        {visibleMessages.map((message) => {
          const messageText = getMessageText(message as MaybePartsMessage);
          const createdAt = (message as { createdAt?: Date }).createdAt;
          const timestamp = createdAt
            ? formatTimestamp(new Date(createdAt))
            : null;

          return (
            <div
              key={message.id}
              className={`group p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                  : "bg-muted max-w-[80%]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.role === "user" ? "You" : "Noblinks AI"}
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
              <div>{renderMessageContent(message as MaybePartsMessage)}</div>
            </div>
          );
        })}

        {/* Streaming indicator for follow-up messages */}
        {isStreaming &&
          !isInitialLoading &&
          visibleMessages[visibleMessages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted max-w-[80%]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Noblinks AI is thinking&hellip;
              </span>
            </div>
          )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this alert or paste command output..."
          className="flex-1 min-h-[44px] max-h-[160px] p-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
          rows={1}
          disabled={isStreaming}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isStreaming}
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
