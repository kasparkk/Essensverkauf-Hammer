"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { TransportMode } from "@/generated/prisma/client";
import type { Dictionary } from "@/lib/i18n/types";

const modes: TransportMode[] = ["FLIGHT", "TRAIN", "CAR", "BUS"];

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white";

export default function NewTripForm({
  t,
  transportModeLabels,
}: {
  t: Dictionary["trips"];
  transportModeLabels: Dictionary["enums"]["transportMode"];
}) {
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
      setError(data.error ?? t.saveFailed);
      return;
    }

    const data = await res.json();
    router.push(`/trips/${data.trip.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <label className="block">
        <span className="block text-sm font-medium">{t.transportMode}</span>
        <select name="transportMode" defaultValue="FLIGHT" className={inputClass}>
          {modes.map((mode) => (
            <option key={mode} value={mode}>
              {transportModeLabels[mode]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.fromCountry} name="fromCountry" required />
        <Field label={t.fromCity} name="fromCity" />
        <Field label={t.toCountry} name="toCountry" required />
        <Field label={t.toCity} name="toCity" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.travelDate} name="travelDate" type="date" required />
        <Field
          label={t.capacity}
          name="capacityKg"
          type="number"
          step="0.5"
          min="0"
          placeholder={t.capacityPlaceholder}
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="offersPostal" className="mt-1" />
        <span>{t.postalOffer}</span>
      </label>

      <label className="block">
        <span className="block text-sm font-medium">{t.notes}</span>
        <textarea
          name="notes"
          rows={3}
          placeholder={t.notesPlaceholder}
          className={inputClass}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-neutral-900 px-4 py-2.5 font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {loading ? t.submitPending : t.submit}
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
      <input name={name} {...props} className={inputClass} />
    </label>
  );
}
