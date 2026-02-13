"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNoblinks } from "@/context/noblinks-context";
import {
  matchKeyword,
  createWidgetFromKeyword,
  createAlertFromKeyword,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

let messageId = 0;

export function AiChatPanel({
  machineId,
  machineName,
}: {
  machineId: string;
  machineName: string;
}) {
  const { addWidget, addAlert } = useNoblinks();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: messageId++,
      role: "assistant",
      content: `Hi! I'm monitoring assistant for **${machineName}**. Tell me what you'd like to monitor — for example, "watch docker storage" or "alert me on cpu spikes".`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isTyping) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: messageId++,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const config = matchKeyword(text);

      if (config) {
        // Create widget + alert from keyword
        const widget = createWidgetFromKeyword(config, machineId);
        const alert = createAlertFromKeyword(config, machineId, machineName);
        addWidget(widget);
        addAlert(alert);

        setMessages((prev) => [
          ...prev,
          {
            id: messageId++,
            role: "assistant",
            content: config.aiResponse,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: messageId++,
            role: "assistant",
            content:
              "I can help you monitor that. Try asking about Docker storage, disk usage, CPU, or pod restarts.",
          },
        ]);
      }

      setIsTyping(false);
    }, 1000);
  }

  return (
    <div className="flex h-[500px] flex-col rounded-lg border lg:h-full">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Bot className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">AI Assistant</h3>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-start gap-2",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {msg.role === "user" ? (
                <User className="h-3 w-3" />
              ) : (
                <Bot className="h-3 w-3" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
              <Bot className="h-3 w-3" />
            </div>
            <div className="rounded-lg bg-muted px-3 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Noblinks what to monitor..."
            disabled={isTyping}
          />
          <Button type="submit" size="icon" disabled={isTyping || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
