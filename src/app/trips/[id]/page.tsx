import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { findRequestsForTrip } from "@/lib/matching";
import {
  formatMoney,
  formatWeight,
  requestKindLabels,
  routeLabel,
  transportModeLabels,
} from "@/lib/labels";
import ProposeDealButton from "@/components/propose-deal-button";
import MatchReasons from "@/components/match-reasons";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trip, user] = await Promise.all([
    prisma.trip.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    }),
    getCurrentUser(),
  ]);

  if (!trip) {
    notFound();
  }

  const isOwner = user?.id === trip.userId;

  const [openRequests, myRequests] = await Promise.all([
    prisma.request.findMany({
      where: { isOpen: true, userId: { not: trip.userId } },
      include: { user: { select: { id: true, name: true } } },
    }),
    user
      ? prisma.request.findMany({
          where: { userId: user.id, isOpen: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const matches = findRequestsForTrip(trip, openRequests).slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-neutral-500">Reise von {trip.user.name}</p>
      <h1 className="mt-1 text-2xl font-bold">
        {routeLabel(trip.fromCity, trip.fromCountry, trip.toCity, trip.toCountry)}
      </h1>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <Detail label="Verkehrsmittel" value={transportModeLabels[trip.transportMode]} />
        <Detail label="Datum" value={formatDate(trip.travelDate)} />
        <Detail
          label="Freier Platz"
          value={formatWeight(trip.capacityKg) ?? "nicht angegeben"}
        />
        <Detail
          label="Postabgabe am Ziel"
          value={trip.offersPostal ? "ja" : "nur persönliche Übergabe"}
        />
      </dl>

      {trip.notes && (
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
          {trip.notes}
        </p>
      )}

      <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        {isOwner ? (
          <>
            <h2 className="font-semibold">Anfragen, die auf deine Reise passen</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Nach Passung sortiert – hier verdienst du an freiem Platz.
            </p>
            <ul className="mt-4 space-y-3">
              {matches.map(({ item: req, score, reasons }) => {
                const reward = formatMoney(req.rewardCents);
                return (
                  <li
                    key={req.id}
                    className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-800">
                          {requestKindLabels[req.kind]}
                        </span>
                        <Link
                          href={`/requests/${req.id}`}
                          className="mt-1.5 block font-medium hover:underline"
                        >
                          {req.itemDescription}
                        </Link>
                        <p className="text-xs text-neutral-500">
                          {routeLabel(req.fromCity, req.fromCountry, req.toCity, req.toCountry)}
                        </p>
                      </div>
                      <div className="text-right">
                        {reward && <p className="font-semibold">{reward}</p>}
                        <span className="text-xs text-neutral-500">{score} Punkte</span>
                      </div>
                    </div>
                    <MatchReasons reasons={reasons} />
                    <div className="mt-3">
                      <ProposeDealButton
                        fixed={{ tripId: trip.id }}
                        counterpartId={req.id}
                        isLoggedIn
                        compact
                        label="Mitnehmen anbieten"
                      />
                    </div>
                  </li>
                );
              })}
              {matches.length === 0 && (
                <p className="text-sm text-neutral-500">
                  Aktuell keine offene Anfrage auf dieser Route.
                </p>
              )}
            </ul>
          </>
        ) : (
          <>
            <h2 className="font-semibold">Du brauchst etwas auf dieser Route?</h2>
            <p className="mt-1 mb-3 text-sm text-neutral-500">
              Wähl deine Anfrage und frag den Reisenden.
            </p>
            <ProposeDealButton
              fixed={{ tripId: trip.id }}
              counterpartOptions={myRequests.map((req) => ({
                id: req.id,
                label: req.itemDescription,
              }))}
              isLoggedIn={Boolean(user)}
              label="Anfrage vorschlagen"
            />
          </>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
