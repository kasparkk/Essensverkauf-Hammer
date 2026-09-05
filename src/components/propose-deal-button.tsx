"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  label = "Abmachung vorschlagen",
  isLoggedIn,
  compact = false,
}: {
  fixed: DealSide;
  counterpartId?: string;
  counterpartOptions?: { id: string; label: string }[];
  label?: string;
  isLoggedIn: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(counterpartOptions?.[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="text-sm font-medium underline">
        Anmelden, um eine Abmachung vorzuschlagen
      </Link>
    );
  }

  if (counterpartOptions && counterpartOptions.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        {"requestId" in fixed && fixed.requestId ? (
          <>
            Du brauchst zuerst eine{" "}
            <Link href="/trips/new" className="underline">
              eingetragene Reise
            </Link>
            , um hier zuzusagen.
          </>
        ) : (
          <>
            Du brauchst zuerst eine{" "}
            <Link href="/requests/new" className="underline">
              eigene Anfrage
            </Link>
            , um hier anzufragen.
          </>
        )}
      </p>
    );
  }

  const otherId = counterpartId ?? selected;

  async function handleClick() {
    setError(null);
    setLoading(true);

    const payload =
      "requestId" in fixed && fixed.requestId
        ? { requestId: fixed.requestId, tripId: otherId }
        : { requestId: otherId, tripId: (fixed as { tripId: string }).tripId };

    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Abmachung konnte nicht angelegt werden");
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
      <button
        onClick={handleClick}
        disabled={loading || !otherId}
        className={buttonClass}
      >
        {loading ? "Moment…" : label}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
