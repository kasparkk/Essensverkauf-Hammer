import Link from "next/link";
import LogoutButton from "@/components/logout-button";

type NavUser = { id: string; name: string; email: string } | null;

export default function Nav({ user }: { user: NavUser }) {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          🧳 CarryConnect
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link href="/requests" className="hover:underline">
            Anfragen
          </Link>
          <Link href="/trips" className="hover:underline">
            Reisen
          </Link>
          {user && (
            <>
              <Link href="/deals" className="hover:underline">
                Abmachungen
              </Link>
              <Link href="/chat" className="hover:underline">
                Chat
              </Link>
            </>
          )}
          {user ? (
            <>
              <span className="hidden text-neutral-500 sm:inline">{user.name}</span>
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
