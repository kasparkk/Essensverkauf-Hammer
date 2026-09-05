import Link from "next/link";
import LogoutButton from "@/components/logout-button";

type NavUser = { id: string; name: string; email: string } | null;

export default function Nav({ user }: { user: NavUser }) {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ✈️ Mitbring
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/trips" className="hover:underline">
            Reisen
          </Link>
          <Link href="/requests" className="hover:underline">
            Anfragen
          </Link>
          {user && (
            <Link href="/chat" className="hover:underline">
              Chat
            </Link>
          )}
          {user ? (
            <>
              <span className="hidden text-neutral-500 sm:inline">
                Hallo, {user.name}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Anmelden
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-neutral-900 px-4 py-1.5 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Registrieren
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
