"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  content: string;
  createdAt: string | Date;
  senderId: string;
  sender: { id: string; name: string };
};

const POLL_INTERVAL_MS = 3000;

export default function ChatThread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const last = messagesRef.current[messagesRef.current.length - 1];
      const after = last ? new Date(last.createdAt).toISOString() : "";
      const res = await fetch(
        `/api/conversations/${conversationId}/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages.length > 0) {
        setMessages((prev) => [...prev, ...data.messages]);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setSending(true);
    setDraft("");
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSending(false);

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
    } else {
      setDraft(content);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId;
          return (
            <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isOwn
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-neutral-500">
            Noch keine Nachrichten. Schreib die erste!
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nachricht schreiben…"
          className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Senden
        </button>
      </form>
    </div>
  );
}
