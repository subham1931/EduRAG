"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, User, Bot, Sparkles, FileText, ChevronRight } from "lucide-react";
import { ChatMessage, Subject } from "@/types";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

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
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, loading]);

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
    <div className="flex h-full flex-col bg-background/50">
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="mx-auto max-w-4xl p-6 lg:p-8 space-y-8">
          {initialLoading ? (
            <div className="flex flex-col h-64 items-center justify-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Consulting your knowledge base...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col h-[60vh] items-center justify-center text-center space-y-6 max-w-sm mx-auto">
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl" />
                <Bot className="relative h-20 w-20 text-primary opacity-20" />
                <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-primary animate-bounce fill-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Meet your AI Tutor</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  I'm trained specifically on your <strong>{subject.name}</strong> documents. Ask me anything to start learning!
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full pt-4">
                {[
                  "What are the core concepts here?",
                  "Summarize the main documents",
                  "Can you quiz me on this subject?"
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                    }}
                    className="text-xs text-left px-4 py-3 rounded-xl border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground flex items-center justify-between group"
                  >
                    {q}
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={cn(
                "group flex flex-col gap-4 py-8 first:pt-0 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300",
                idx !== 0 && "border-t border-border/40",
                msg.role === "user" ? "items-end" : "items-start"
              )}
            >
              <div className={cn(
                "flex w-full items-start gap-4 lg:gap-6",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}>
                {/* Avatar section */}
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm",
                  msg.role === "assistant"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                {/* Content section - Flowing text instead of bubbles */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className={cn(
                    "text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40",
                    msg.role === "user" ? "text-right" : "text-left"
                  )}>
                    {msg.role === "assistant" ? "EduRAG AI" : "You"}
                  </div>

                  <div className={cn(
                    "text-sm leading-7 md:text-base md:leading-8",
                    msg.role === "user"
                      ? "text-foreground font-medium bg-primary/5 p-4 rounded-2xl border border-primary/10 inline-block self-end"
                      : "text-foreground/90 max-w-full"
                  )}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none 
                        prose-p:leading-8 prose-p:mb-6
                        prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                        prose-ul:my-6 prose-li:my-2
                        prose-hr:my-8 prose-hr:border-border/50
                        prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-[#0d1117] prose-pre:border prose-pre:p-6 prose-pre:rounded-2xl prose-pre:shadow-xl
                        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:italic
                      ">
                        <ReactMarkdown
                          components={{
                            hr: ({ ...props }) => <hr className="my-8 border-t border-border/50" {...props} />,
                            h1: ({ ...props }) => <h1 className="mt-8 mb-4 border-b border-border/40 pb-2" {...props} />,
                            p: ({ ...props }) => <p className="mb-6 last:mb-0" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-border/40">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-4">
                          <FileText className="h-3.5 w-3.5" />
                          Knowledge Sources
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {msg.sources.map((src, i) => (
                            <div
                              key={i}
                              className="group/src flex items-center gap-2 bg-muted/30 hover:bg-primary/5 border border-border/50 hover:border-primary/20 px-3 py-1.5 rounded-xl transition-all cursor-default"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/src:scale-125 transition-transform" />
                              <span className="text-[10px] font-bold text-muted-foreground group-hover/src:text-primary transition-colors">
                                Page {src.page_number}
                              </span>
                              <span className="text-[9px] font-black text-primary/40 bg-primary/5 px-1.5 py-0.5 rounded uppercase">
                                {(src.similarity * 100).toFixed(0)}% Match
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3 animate-pulse">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl bg-card border border-border/50 px-5 py-4 shadow-sm w-[120px]">
                <div className="flex gap-1.5 items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 lg:p-6 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="mx-auto max-w-4xl relative group">
          <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center bg-card border border-border/50 rounded-2xl shadow-lg ring-1 ring-black/5 hover:ring-primary/20 transition-all">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type a question about ${subject.name}...`}
              disabled={loading}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 h-14 px-6 text-sm"
            />
            <div className="flex items-center gap-2 pr-3">
              <div className="h-6 w-[1px] bg-border/50 mx-1" />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-sm hover:scale-105 transition-transform"
                size="icon"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-center text-muted-foreground/60 font-medium">
            Your AI Assistant is powered by Ollama. Responses are generated based on shared documents.
          </p>
        </div>
      </div>
    </div>
  );
}
