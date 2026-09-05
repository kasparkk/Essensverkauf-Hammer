"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LOCALE_COOKIE,
  localeNames,
  locales,
  type Locale,
} from "@/lib/i18n/config";

/**
 * Speichert die Sprachwahl in einem Cookie und lädt die Seite neu - die
 * Übersetzung passiert serverseitig, daher reicht router.refresh().
 */
export default function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Locale>(locale);

  function change(next: Locale) {
    setValue(next);
    // Ein Jahr gültig, für die ganze Seite, damit die Wahl Bestand hat.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  }

  return (
    <label className="flex items-center gap-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => change(event.target.value as Locale)}
        aria-label={label}
        className="rounded-full border border-neutral-300 bg-transparent px-2 py-1 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-white"
      >
        {locales.map((option) => (
          <option key={option} value={option}>
            {localeNames[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
