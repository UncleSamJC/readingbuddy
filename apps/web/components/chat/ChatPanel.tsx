"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@readbuddy/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  streamingMessageId?: string | null;
  onClose?: () => void;
}

function MessageBubble({ msg, isStreaming }: { msg: ChatMessage; isStreaming: boolean }) {
  const isAssistant = msg.role === "assistant";
  return (
    <div
      className={cn(
        "max-w-[85%] whitespace-pre-line rounded-xl px-4 py-2.5 text-sm leading-relaxed",
        isAssistant
          ? "bg-secondary text-secondary-foreground"
          : "ml-auto bg-primary text-primary-foreground"
      )}
    >
      {msg.content}
      {isStreaming && (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-text-bottom" />
      )}
    </div>
  );
}

export function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
  streamingMessageId,
  onClose,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl",
      "w-[calc(100vw-2rem)] sm:w-80",
      "h-100 sm:h-110"
    )}>
      {/* Top bar: welcome text + close button */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 shrink-0">
        {messages.length === 0 && !isLoading ? (
          <p className="flex-1 text-center text-sm text-muted-foreground">
            Hi! I&apos;m Roz. Click a sentence or ask me anything about the book!
          </p>
        ) : (
          <div className="flex-1" />
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-primary hover:text-primary/70"
            title="Close"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isStreaming={msg.id === streamingMessageId}
          />
        ))}
        {isLoading && !streamingMessageId && (
          <div className="max-w-[85%] rounded-xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
            <span className="inline-flex gap-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: "0.15s" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>.</span>
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-2.5 sm:p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Roz..."
          disabled={isLoading}
          className="flex-1 text-base sm:text-sm"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim()}
          className="h-10 w-10 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
