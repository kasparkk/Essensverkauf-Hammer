import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Etwas vergessen? Jemand fliegt bestimmt vorbei.
        </h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
          Mitbring verbindet Leute, die etwas ins gleiche Land geliefert
          bekommen möchten, mit Reisenden, die zufällig ohnehin dorthin
          fliegen und es mitnehmen können.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/requests/new"
            className="rounded-full bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Ich habe etwas vergessen
          </Link>
          <Link
            href="/trips/new"
            className="rounded-full border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Ich reise sowieso dorthin
          </Link>
        </div>
      </div>

      <div className="mt-20 grid gap-8 sm:grid-cols-3">
        <Step
          number="1"
          title="Eintragen"
          text="Erstelle eine Anfrage für ein vergessenes Teil oder trage deine geplante Reise ein."
        />
        <Step
          number="2"
          title="Passenden Kontakt finden"
          text="Durchsuche Reisen und Anfragen nach Zielland und nimm Kontakt auf."
        />
        <Step
          number="3"
          title="Im Chat abstimmen"
          text="Klärt Details wie Treffpunkt und Übergabe direkt im eingebauten Chat."
        />
      </div>

      <div className="mt-20 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link href="/trips" className="text-sm font-medium hover:underline">
          Alle geplanten Reisen ansehen →
        </Link>
        <Link href="/requests" className="text-sm font-medium hover:underline">
          Alle offenen Anfragen ansehen →
        </Link>
      </div>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
        {number}
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{text}</p>
    </div>
  );
}
