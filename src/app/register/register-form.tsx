"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { Dictionary } from "@/lib/i18n/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white";

export default function RegisterForm({ t }: { t: Dictionary["auth"] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t.registerFailed);
      return;
    }

    router.push("/requests");
    router.refresh();
  }

  return (
    <>
      <h1 className="text-2xl font-bold">{t.registerHeading}</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="block text-sm font-medium">{t.name}</span>
          <input name="name" type="text" autoComplete="name" required className={inputClass} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">{t.email}</span>
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">{t.password}</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClass}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-neutral-900 px-4 py-2.5 font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {loading ? t.registerPending : t.registerButton}
        </button>
      </form>
      <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
        {t.hasAccount}{" "}
        <Link href="/login" className="font-medium underline">
          {t.loginButton}
        </Link>
      </p>
    </>
  );
}
