"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { RequestKind } from "@/generated/prisma/client";
import type { Dictionary } from "@/lib/i18n/types";

const kinds: RequestKind[] = ["RETRIEVAL", "SHOPPING", "TRANSPORT"];

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white";

export default function NewRequestForm({
  t,
  enums,
}: {
  t: Dictionary["requests"];
  enums: Dictionary["enums"];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<RequestKind>("RETRIEVAL");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const itemPlaceholders: Record<RequestKind, string> = {
    RETRIEVAL: t.placeholderRetrieval,
    SHOPPING: t.placeholderShopping,
    TRANSPORT: t.placeholderTransport,
  };

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
      setError(data.error ?? t.saveFailed);
      return;
    }

    const data = await res.json();
    router.push(`/requests/${data.request.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <fieldset>
        <legend className="text-sm font-medium">{t.kindQuestion}</legend>
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
              <span className="font-medium">{enums.requestKind[option]}</span>
              <span className="mt-1 block text-xs text-neutral-500">
                {enums.requestKindDescription[option]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="block text-sm font-medium">
          {kind === "SHOPPING" ? t.itemQuestionShopping : t.itemQuestionOther}
        </span>
        <input
          name="itemDescription"
          required
          placeholder={itemPlaceholders[kind]}
          className={inputClass}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={kind === "SHOPPING" ? t.shoppingCountry : t.fromCountry}
          name="fromCountry"
          required
        />
        <Field label={t.fromCity} name="fromCity" />
        <Field label={t.toCountry} name="toCountry" required />
        <Field label={t.toCity} name="toCity" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t.deadline} name="deadline" type="date" />
        <Field label={t.weight} name="weightKg" type="number" step="0.1" min="0" />
        <Field label={t.reward} name="rewardEuro" type="number" step="1" min="0" />
      </div>

      {kind === "SHOPPING" && (
        <Field label={t.itemValue} name="itemValueEuro" type="number" step="1" min="0" />
      )}

      <label className="block">
        <span className="block text-sm font-medium">{t.deliveryQuestion}</span>
        <select name="deliveryMode" defaultValue="EITHER" className={inputClass}>
          <option value="EITHER">{enums.deliveryModeOption.EITHER}</option>
          <option value="HANDOFF">{enums.deliveryModeOption.HANDOFF}</option>
          <option value="POSTAL">{enums.deliveryModeOption.POSTAL}</option>
        </select>
      </label>

      <label className="block">
        <span className="block text-sm font-medium">{t.notes}</span>
        <textarea name="notes" rows={3} className={inputClass} />
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
