import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { findTripsForRequest } from "@/lib/matching";
import {
  deliveryModeLabels,
  formatMoney,
  formatWeight,
  requestKindLabels,
  routeLabel,
  transportModeLabels,
} from "@/lib/labels";
import ProposeDealButton from "@/components/propose-deal-button";
import MatchReasons from "@/components/match-reasons";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [itemRequest, user] = await Promise.all([
    prisma.request.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    }),
    getCurrentUser(),
  ]);

  if (!itemRequest) {
    notFound();
  }

  const isOwner = user?.id === itemRequest.userId;

  // Treffer und eigene Reisen parallel laden - je nach Rolle wird nur eines
  // davon gebraucht, beides ist aber günstig.
  const [candidateTrips, myTrips] = await Promise.all([
    prisma.trip.findMany({
      where: { userId: { not: itemRequest.userId } },
      include: { user: { select: { id: true, name: true } } },
    }),
    user
      ? prisma.trip.findMany({
          where: { userId: user.id },
          orderBy: { travelDate: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const matches = findTripsForRequest(itemRequest, candidateTrips).slice(0, 10);
  const reward = formatMoney(itemRequest.rewardCents);
  const value = formatMoney(itemRequest.itemValueCents);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-800">
        {requestKindLabels[itemRequest.kind]}
      </span>
      <h1 className="mt-2 text-2xl font-bold">{itemRequest.itemDescription}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Anfrage von {itemRequest.user.name}
        {!itemRequest.isOpen && " · bereits vergeben"}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <Detail
          label="Route"
          value={routeLabel(
            itemRequest.fromCity,
            itemRequest.fromCountry,
            itemRequest.toCity,
            itemRequest.toCountry
          )}
        />
        <Detail
          label="Bis wann"
          value={itemRequest.deadline ? formatDate(itemRequest.deadline) : "flexibel"}
        />
        <Detail label="Honorar" value={reward ?? "Verhandelbar"} />
        <Detail label="Gewicht" value={formatWeight(itemRequest.weightKg) ?? "unbekannt"} />
        <Detail label="Übergabe" value={deliveryModeLabels[itemRequest.deliveryMode]} />
        {value && <Detail label="Warenwert" value={value} />}
      </dl>

      {itemRequest.notes && (
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
          {itemRequest.notes}
        </p>
      )}

      <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        {isOwner ? (
          <>
            <h2 className="font-semibold">Passende Reisen</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Nach Passung sortiert. Schlag einem Reisenden eine Abmachung vor.
            </p>
            <ul className="mt-4 space-y-3">
              {matches.map(({ item: trip, score, reasons }) => (
                <li
                  key={trip.id}
                  className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={`/trips/${trip.id}`} className="font-medium hover:underline">
                        {routeLabel(trip.fromCity, trip.fromCountry, trip.toCity, trip.toCountry)}
                      </Link>
                      <p className="text-xs text-neutral-500">
                        {transportModeLabels[trip.transportMode]} ·{" "}
                        {formatDate(trip.travelDate)}
                      </p>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-800">
                      {score} Punkte
                    </span>
                  </div>
                  <MatchReasons reasons={reasons} />
                  <div className="mt-3">
                    <ProposeDealButton
                      fixed={{ requestId: itemRequest.id }}
                      counterpartId={trip.id}
                      isLoggedIn
                      compact
                      label="Vorschlagen"
                    />
                  </div>
                </li>
              ))}
              {matches.length === 0 && (
                <p className="text-sm text-neutral-500">
                  Noch keine passende Reise auf dieser Route. Sobald jemand eine
                  einträgt, erscheint sie hier.
                </p>
              )}
            </ul>
          </>
        ) : (
          <>
            <h2 className="font-semibold">Du reist auf dieser Route?</h2>
            <p className="mt-1 mb-3 text-sm text-neutral-500">
              Wähl deine Reise und schlag eine Abmachung vor.
            </p>
            <ProposeDealButton
              fixed={{ requestId: itemRequest.id }}
              counterpartOptions={myTrips.map((trip) => ({
                id: trip.id,
                label: `${routeLabel(trip.fromCity, trip.fromCountry, trip.toCity, trip.toCountry)} · ${formatDate(trip.travelDate)}`,
              }))}
              isLoggedIn={Boolean(user)}
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
