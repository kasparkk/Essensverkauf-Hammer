import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/config";
import type { RequestKind } from "@/generated/prisma/client";

const kinds: RequestKind[] = ["RETRIEVAL", "SHOPPING", "TRANSPORT"];

export default async function Home() {
  const [{ dict }, openRequests, upcomingTrips] = await Promise.all([
    getTranslations(),
    prisma.request.count({ where: { isOpen: true } }),
    prisma.trip.count({ where: { travelDate: { gte: new Date() } } }),
  ]);
  const t = dict.home;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.heading}</h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">{t.intro}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/requests/new"
            className="rounded-full bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {t.ctaRequest}
          </Link>
          <Link
            href="/trips/new"
            className="rounded-full border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            {t.ctaTrip}
          </Link>
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          {format(t.stats, {
            requests: openRequests,
            requestWord: openRequests === 1 ? t.requestSingular : t.requestPlural,
            trips: upcomingTrips,
            tripWord: upcomingTrips === 1 ? t.tripSingular : t.tripPlural,
          })}
        </p>
      </div>

      <section className="mt-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {t.useCasesHeading}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {kinds.map((kind) => (
            <Link
              key={kind}
              href={`/requests?kind=${kind}`}
              className="rounded-xl border border-neutral-200 p-5 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              <h3 className="font-semibold">{dict.enums.requestKind[kind]}</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                {dict.enums.requestKindDescription[kind]}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {t.howHeading}
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-4">
          <Step number="1" title={t.step1Title} text={t.step1Text} />
          <Step number="2" title={t.step2Title} text={t.step2Text} />
          <Step number="3" title={t.step3Title} text={t.step3Text} />
          <Step number="4" title={t.step4Title} text={t.step4Text} />
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
