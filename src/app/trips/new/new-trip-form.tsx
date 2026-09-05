"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { transportModeLabels } from "@/lib/labels";
import type { TransportMode } from "@/generated/prisma/client";

const modes = Object.keys(transportModeLabels) as TransportMode[];

export default function NewTripForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transportMode: formData.get("transportMode"),
        fromCountry: formData.get("fromCountry"),
        fromCity: formData.get("fromCity"),
        toCountry: formData.get("toCountry"),
        toCity: formData.get("toCity"),
        travelDate: formData.get("travelDate"),
        capacityKg: formData.get("capacityKg"),
        offersPostal: formData.get("offersPostal") === "on",
        notes: formData.get("notes"),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Reise konnte nicht gespeichert werden");
      return;
    }

    const data = await res.json();
    router.push(`/trips/${data.trip.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <label className="block">
        <span className="block text-sm font-medium">Verkehrsmittel</span>
        <select
          name="transportMode"
          defaultValue="FLIGHT"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
        >
          {modes.map((mode) => (
            <option key={mode} value={mode}>
              {transportModeLabels[mode]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Von (Land)" name="fromCountry" required />
        <Field label="Von (Stadt)" name="fromCity" />
        <Field label="Nach (Land)" name="toCountry" required />
        <Field label="Nach (Stadt)" name="toCity" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Reisedatum" name="travelDate" type="date" required />
        <Field
          label="Freier Platz (kg)"
          name="capacityKg"
          type="number"
          step="0.5"
          min="0"
          placeholder="z. B. 5"
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="offersPostal" className="mt-1" />
        <span>
          Ich würde am Ziel auch bei der Post abgeben (letzte Meile per Paketdienst),
          statt persönlich zu übergeben.
        </span>
      </label>

      <label className="block">
        <span className="block text-sm font-medium">Notizen (optional)</span>
        <textarea
          name="notes"
          rows={3}
          placeholder="z. B. nur Handgepäck, keine Flüssigkeiten"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-neutral-900 px-4 py-2.5 font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {loading ? "Wird gespeichert…" : "Reise veröffentlichen"}
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
