import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { formatWeight, routeLabel, transportModeLabels } from "@/lib/labels";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ toCountry?: string }>;
}) {
  const { toCountry } = await searchParams;

  const trips = await prisma.trip.findMany({
    where: toCountry
      ? { toCountry: { contains: toCountry, mode: "insensitive" } }
      : undefined,
    orderBy: { travelDate: "asc" },
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Geplante Reisen</h1>
        <Link
          href="/trips/new"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Reise eintragen
        </Link>
      </div>

      <form className="mt-6 flex gap-2" method="get">
        <input
          type="text"
          name="toCountry"
          defaultValue={toCountry ?? ""}
          placeholder="Nach Zielland filtern…"
          className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
        />
        <button
          type="submit"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Filtern
        </button>
      </form>

      <ul className="mt-6 space-y-3">
        {trips.map((trip) => (
          <li key={trip.id}>
            <Link
              href={`/trips/${trip.id}`}
              className="block rounded-xl border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {routeLabel(trip.fromCity, trip.fromCountry, trip.toCity, trip.toCountry)}
                </p>
                <span className="text-sm text-neutral-500">
                  {formatDate(trip.travelDate)}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {[
                  transportModeLabels[trip.transportMode],
                  `von ${trip.user.name}`,
                  formatWeight(trip.capacityKg) ? `${formatWeight(trip.capacityKg)} frei` : null,
                  trip.offersPostal ? "gibt bei der Post ab" : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Link>
          </li>
        ))}
        {trips.length === 0 && (
          <p className="text-neutral-500">
            Noch keine Reisen eingetragen.{" "}
            <Link href="/trips/new" className="underline">
              Trage die erste ein
            </Link>
            .
          </p>
        )}
      </ul>
    </div>
  );
}
