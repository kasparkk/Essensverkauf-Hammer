"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function NewRequestForm() {
  const router = useRouter();
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
        fromCountry: formData.get("fromCountry"),
        toCountry: formData.get("toCountry"),
        itemDescription: formData.get("itemDescription"),
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
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="block text-sm font-medium">Was hast du vergessen?</span>
        <input
          name="itemDescription"
          required
          placeholder="z. B. Ladekabel, Medikamente, Lieblingssnack…"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Von (Land)" name="fromCountry" required />
        <Field label="Nach (Land)" name="toCountry" required />
      </div>
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
        {loading ? "Wird gespeichert…" : "Anfrage speichern"}
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
