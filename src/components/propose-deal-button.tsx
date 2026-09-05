"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/types";

export type DealSide =
  | { requestId: string; tripId?: never }
  | { tripId: string; requestId?: never };

/**
 * Schlägt eine Abmachung vor. Eine Seite ist fix (die gerade angezeigte
 * Anfrage bzw. Reise), die andere wird mitgegeben - entweder direkt bei einem
 * Treffer oder über die Auswahl der eigenen Einträge.
 */
export default function ProposeDealButton({
  fixed,
  counterpartId,
  counterpartOptions,
  label,
  isLoggedIn,
  compact = false,
  t,
}: {
  fixed: DealSide;
  counterpartId?: string;
  counterpartOptions?: { id: string; label: string }[];
  label?: string;
  isLoggedIn: boolean;
  compact?: boolean;
  t: Dictionary["deals"];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(counterpartOptions?.[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fixedIsRequest = Boolean(fixed.requestId);

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="text-sm font-medium underline">
        {t.loginToPropose}
      </Link>
    );
  }

  if (counterpartOptions && counterpartOptions.length === 0) {
    const template = fixedIsRequest ? t.needTripFirst : t.needRequestFirst;
    const linkText = fixedIsRequest ? t.needTripLink : t.needRequestLink;
    const href = fixedIsRequest ? "/trips/new" : "/requests/new";
    const [before, after] = template.split("{link}");

    return (
      <p className="text-sm text-neutral-500">
        {before}
        <Link href={href} className="underline">
          {linkText}
        </Link>
        {after}
      </p>
    );
  }

  const otherId = counterpartId ?? selected;

  async function handleClick() {
    setError(null);
    setLoading(true);

    const payload = fixedIsRequest
      ? { requestId: fixed.requestId, tripId: otherId }
      : { requestId: otherId, tripId: fixed.tripId };

    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t.createFailed);
      return;
    }

    const data = await res.json();
    router.push(`/deals/${data.deal.id}`);
  }

  const buttonClass = compact
    ? "rounded-full border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
    : "rounded-full bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200";

  return (
    <div className={compact ? "" : "space-y-2"}>
      {counterpartOptions && counterpartOptions.length > 0 && (
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
        >
          {counterpartOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      <button onClick={handleClick} disabled={loading || !otherId} className={buttonClass}>
        {loading ? "…" : label ?? t.propose}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
