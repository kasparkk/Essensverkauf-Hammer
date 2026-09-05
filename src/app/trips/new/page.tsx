import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import NewTripForm from "./new-trip-form";

export default async function NewTripPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p>
          Bitte{" "}
          <Link href="/login" className="underline">
            anmelden
          </Link>
          , um eine Reise einzutragen.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold">Reise eintragen</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Trage deine geplante Reise ein, damit andere dich kontaktieren können,
        wenn sie etwas in dein Zielland mitgebracht bekommen möchten.
      </p>
      <NewTripForm />
    </div>
  );
}
