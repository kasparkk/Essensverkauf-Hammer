"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { RequestKind } from "@/generated/prisma/client";
import { requestKindDescriptions, requestKindLabels } from "@/lib/labels";

const kinds: RequestKind[] = ["RETRIEVAL", "SHOPPING", "TRANSPORT"];

const itemPlaceholders: Record<RequestKind, string> = {
  RETRIEVAL: "z. B. AirPods, im Hotel in Buenos Aires liegen geblieben",
  SHOPPING: "z. B. 2 Packungen Yerba Mate, Marke Playadito",
  TRANSPORT: "z. B. Aktenordner, DIN A4, ca. 2 kg",
};

export default function NewRequestForm() {
  const router = useRouter();
  const [kind, setKind] = useState<RequestKind>("RETRIEVAL");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        fromCountry: formData.get("fromCountry"),
        fromCity: formData.get("fromCity"),
        toCountry: formData.get("toCountry"),
        toCity: formData.get("toCity"),
        itemDescription: formData.get("itemDescription"),
        deadline: formData.get("deadline"),
        weightKg: formData.get("weightKg"),
        rewardEuro: formData.get("rewardEuro"),
        itemValueEuro: formData.get("itemValueEuro"),
        deliveryMode: formData.get("deliveryMode"),
        notes: formData.get("notes"),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Anfrage konnte nicht gespeichert werden");
      return;
    }

    const data = await res.json();
    router.push(`/requests/${data.request.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <fieldset>
        <legend className="text-sm font-medium">Worum geht es?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {kinds.map((option) => (
            <label
              key={option}
              className={`cursor-pointer rounded-lg border p-3 text-sm ${
                kind === option
                  ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={option}
                checked={kind === option}
                onChange={() => setKind(option)}
                className="sr-only"
              />
              <span className="font-medium">{requestKindLabels[option]}</span>
              <span className="mt-1 block text-xs text-neutral-500">
                {requestKindDescriptions[option]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="block text-sm font-medium">
          {kind === "SHOPPING" ? "Was soll gekauft werden?" : "Was soll transportiert werden?"}
        </span>
        <input
          name="itemDescription"
          required
          placeholder={itemPlaceholders[kind]}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={kind === "SHOPPING" ? "Einkaufsland" : "Von (Land)"}
          name="fromCountry"
          required
        />
        <Field label="Von (Stadt)" name="fromCity" />
        <Field label="Nach (Land)" name="toCountry" required />
        <Field label="Nach (Stadt)" name="toCity" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Bis wann?" name="deadline" type="date" />
        <Field label="Gewicht (kg)" name="weightKg" type="number" step="0.1" min="0" />
        <Field label="Honorar (€)" name="rewardEuro" type="number" step="1" min="0" />
      </div>

      {kind === "SHOPPING" && (
        <Field
          label="Erwarteter Warenwert (€)"
          name="itemValueEuro"
          type="number"
          step="1"
          min="0"
        />
      )}

      <label className="block">
        <span className="block text-sm font-medium">Wie soll es ankommen?</span>
        <select
          name="deliveryMode"
          defaultValue="EITHER"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
        >
          <option value="EITHER">Übergabe oder Post – egal</option>
          <option value="HANDOFF">Persönliche Übergabe</option>
          <option value="POSTAL">Abgabe bei der Post am Ziel</option>
        </select>
      </label>

      <label className="block">
        <span className="block text-sm font-medium">Notizen (optional)</span>
        <textarea
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-neutral-900 px-4 py-2.5 font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {loading ? "Wird gespeichert…" : "Anfrage veröffentlichen"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      <input
        name={name}
        {...props}
        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
      />
    </label>
  );
}
