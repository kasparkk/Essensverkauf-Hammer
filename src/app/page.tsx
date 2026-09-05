import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requestKindDescriptions, requestKindLabels } from "@/lib/labels";
import type { RequestKind } from "@/generated/prisma/client";

export default async function Home() {
  const [openRequests, upcomingTrips] = await Promise.all([
    prisma.request.count({ where: { isOpen: true } }),
    prisma.trip.count({ where: { travelDate: { gte: new Date() } } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Freier Platz im Gepäck ist ein Kurierdienst.
        </h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
          CarryConnect verbindet Reisende mit ungenutztem Gepäckplatz und Leute,
          die etwas transportiert oder besorgt brauchen – günstiger und direkter
          als über klassische Paketdienste.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/requests/new"
            className="rounded-full bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Ich brauche etwas
          </Link>
          <Link
            href="/trips/new"
            className="rounded-full border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Ich reise und habe Platz
          </Link>
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          {openRequests} offene {openRequests === 1 ? "Anfrage" : "Anfragen"} ·{" "}
          {upcomingTrips} kommende {upcomingTrips === 1 ? "Reise" : "Reisen"}
        </p>
      </div>

      <section className="mt-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Wofür Leute es nutzen
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {(Object.keys(requestKindLabels) as RequestKind[]).map((kind) => (
            <Link
              key={kind}
              href={`/requests?kind=${kind}`}
              className="rounded-xl border border-neutral-200 p-5 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              <h3 className="font-semibold">{requestKindLabels[kind]}</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                {requestKindDescriptions[kind]}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-neutral-500">
          So läuft es ab
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-4">
          <Step
            number="1"
            title="Eintragen"
            text="Anfrage mit Route, Termin und Honorar – oder die eigene Reise mit freiem Platz."
          />
          <Step
            number="2"
            title="Treffer prüfen"
            text="Die Plattform schlägt passende Gegenstücke vor und erklärt, warum sie passen."
          />
          <Step
            number="3"
            title="Abmachung"
            text="Eine Seite schlägt vor, die andere sagt zu. Details klärt ihr im Chat."
          />
          <Step
            number="4"
            title="Übergabe"
            text="Persönlich am Ziel oder per Postabgabe für die letzte Meile."
          />
        </ol>
      </section>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <li className="text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
        {number}
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{text}</p>
    </li>
  );
}
