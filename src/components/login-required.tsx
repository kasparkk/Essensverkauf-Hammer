import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/types";

/**
 * Hinweis für Seiten, die eine Anmeldung brauchen. Der Textbaustein enthält
 * {link} an der Stelle, wo der Anmelde-Link stehen soll.
 */
export default function LoginRequired({ t }: { t: Dictionary["auth"] }) {
  const [before, after] = t.pleaseLogIn.split("{link}");

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p>
        {before}
        <Link href="/login" className="underline">
          {t.pleaseLogInLink}
        </Link>
        {after}
      </p>
    </div>
  );
}
