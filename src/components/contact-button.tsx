"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function ContactButton({
  tripId,
  requestId,
  isLoggedIn,
  isOwn,
}: {
  tripId?: string;
  requestId?: string;
  isLoggedIn: boolean;
  isOwn: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isOwn) {
    return (
      <p className="text-sm text-neutral-500">Das ist dein eigener Eintrag.</p>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="inline-block rounded-full bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Anmelden, um Kontakt aufzunehmen
      </Link>
    );
  }

  async function handleClick() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, requestId }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Konnte Konversation nicht starten");
      return;
    }

    const data = await res.json();
    router.push(`/chat/${data.conversation.id}`);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-full bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {loading ? "Wird gestartet…" : "Kontakt aufnehmen"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
