"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Give me a summary of my recipe collection",
  "Help me create a new recipe for lemon herb chicken",
  "Scale my most popular recipe to serve 50 people",
  "What ideas do you have for a Mediterranean menu?",
  "Calculate the cost breakdown for a recipe",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const content = text ?? input.trim();
    if (!content || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }

  async function clearHistory() {
    if (!confirm("Clear all conversation history?")) return;
    setClearing(true);
    await fetch("/api/history", { method: "DELETE" });
    setMessages([]);
    setClearing(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-stone-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <div>
            <h1 className="font-semibold text-stone-900 text-sm leading-tight">Catering Assistant</h1>
            <p className="text-xs text-stone-400">Powered by Claude</p>
          </div>
        </div>
        <button
          onClick={clearHistory}
          disabled={clearing || isEmpty}
          className="text-xs text-stone-400 hover:text-red-500 disabled:opacity-30 transition-colors"
        >
          {clearing ? "Clearing..." : "Clear history"}
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {isEmpty && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4 text-3xl">
                🍽️
              </div>
              <h2 className="text-xl font-semibold text-stone-700 mb-2">What can I help with today?</h2>
              <p className="text-stone-400 text-sm mb-8">
                Manage recipes, develop new dishes, scale for events, or get business insights.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-sm px-4 py-2 rounded-full bg-white border border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 transition-colors shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white text-xs font-bold mr-3 mt-1 flex-shrink-0">
                  C
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-amber-500 text-white rounded-br-sm"
                    : "bg-white text-stone-800 border border-stone-200 rounded-bl-sm shadow-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-stone max-w-none prose-headings:font-semibold prose-code:bg-stone-100 prose-code:px-1 prose-code:rounded">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white text-xs font-bold mr-3 mt-1 flex-shrink-0">
                C
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything about your recipes or business..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-stone-800 placeholder-stone-400 max-h-40"
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-stone-400 mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
