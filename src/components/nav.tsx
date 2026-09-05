import Link from "next/link";
import LogoutButton from "@/components/logout-button";
import LanguageSwitcher from "@/components/language-switcher";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";

type NavUser = { id: string; name: string; email: string } | null;

export default function Nav({
  user,
  locale,
  labels,
  languageLabel,
}: {
  user: NavUser;
  locale: Locale;
  labels: Dictionary["nav"];
  languageLabel: string;
}) {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          🧳 CarryConnect
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link href="/requests" className="hover:underline">
            {labels.requests}
          </Link>
          <Link href="/trips" className="hover:underline">
            {labels.trips}
          </Link>
          {user && (
            <>
              <Link href="/deals" className="hover:underline">
                {labels.deals}
              </Link>
              <Link href="/chat" className="hover:underline">
                {labels.chat}
              </Link>
            </>
          )}
          <LanguageSwitcher locale={locale} label={languageLabel} />
          {user ? (
            <>
              <span className="hidden text-neutral-500 sm:inline">{user.name}</span>
              <LogoutButton label={labels.logout} />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                {labels.login}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-neutral-900 px-4 py-1.5 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {labels.register}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
