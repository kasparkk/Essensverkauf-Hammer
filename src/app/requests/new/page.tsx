import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import NewRequestForm from "./new-request-form";

export default async function NewRequestPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p>
          Bitte{" "}
          <Link href="/login" className="underline">
            anmelden
          </Link>
          , um eine Anfrage zu erstellen.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold">Anfrage erstellen</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Beschreibe, was du vergessen hast oder mitgebracht bekommen möchtest,
        damit Reisende dich kontaktieren können.
      </p>
      <NewRequestForm />
    </div>
  );
}
