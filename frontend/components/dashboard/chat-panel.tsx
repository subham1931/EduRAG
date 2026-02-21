"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, User, Bot } from "lucide-react";
import { ChatMessage, Subject } from "@/types";
import api from "@/lib/api";

interface ChatPanelProps {
  subject: Subject;
}

export function ChatPanel({ subject }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    setInitialLoading(true);
    try {
      const { data } = await api.get(`/chats/${subject.id}`);
      setMessages(
        data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources,
          timestamp: new Date(m.created_at),
        }))
      );
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setInitialLoading(false);
    }
  }, [subject.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const persistMessage = async (
    role: string,
    content: string,
    sources?: any[]
  ) => {
    try {
      await api.post("/chats", {
        subject_id: subject.id,
        role,
        content,
        sources: sources || null,
      });
    } catch (err) {
      console.error("Failed to save chat message:", err);
    }
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await persistMessage("user", question);

    try {
      const { data } = await api.post("/ask", {
        subject_id: subject.id,
        question,
      });

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      await persistMessage("assistant", data.answer, data.sources);
    } catch (err: any) {
      const errContent =
        err.response?.data?.detail ||
        "Something went wrong. Please try again.";
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: errContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
      await persistMessage("assistant", errContent);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-4">
          {initialLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Bot className="mx-auto mb-3 h-12 w-12 opacity-30" />
                <p className="text-lg font-medium">
                  Ask anything about {subject.name}
                </p>
                <p className="mt-1 text-sm">
                  Upload PDFs first, then ask questions about the content.
                </p>
              </div>
            </div>
          ) : null}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 border-t border-border/50 pt-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Sources:
                    </p>
                    {msg.sources.map((src, i) => (
                      <p
                        key={i}
                        className="mt-1 text-xs text-muted-foreground"
                      >
                        Page {src.page_number} (similarity:{" "}
                        {(src.similarity * 100).toFixed(1)}%)
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-lg bg-muted px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${subject.name}...`}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
