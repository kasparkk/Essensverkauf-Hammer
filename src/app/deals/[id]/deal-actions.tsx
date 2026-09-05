"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DealStatus } from "@/generated/prisma/client";
import { statusActionLabels } from "@/lib/deals";

/** Knöpfe für die Schritte, die der angemeldete Nutzer gerade gehen darf. */
export default function DealActions({
  dealId,
  allowed,
}: {
  dealId: string;
  allowed: DealStatus[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<DealStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (allowed.length === 0) {
    return null;
  }

  async function advance(status: DealStatus) {
    setError(null);
    setPending(status);

    const res = await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setPending(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Schritt nicht möglich");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {allowed.map((status) => {
          const destructive = status === "CANCELLED";
          return (
            <button
              key={status}
              onClick={() => advance(status)}
              disabled={pending !== null}
              className={
                destructive
                  ? "rounded-full border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                  : "rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              }
            >
              {pending === status ? "Moment…" : statusActionLabels[status]}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
