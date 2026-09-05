import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatMoney, formatWeight, routeLabel } from "@/lib/format";
import { findTripsForRequest } from "@/lib/matching";
import { getTranslations } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/config";
import ProposeDealButton from "@/components/propose-deal-button";
import MatchReasons from "@/components/match-reasons";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, { locale, dict }] = await Promise.all([params, getTranslations()]);
  const t = dict.requests;

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
  const reward = formatMoney(itemRequest.rewardCents, locale);
  const value = formatMoney(itemRequest.itemValueCents, locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-800">
        {dict.enums.requestKind[itemRequest.kind]}
      </span>
      <h1 className="mt-2 text-2xl font-bold">{itemRequest.itemDescription}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {format(t.detailFrom, { name: itemRequest.user.name })}
        {!itemRequest.isOpen && ` · ${t.taken}`}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <Detail
          label={t.route}
          value={routeLabel(
            itemRequest.fromCity,
            itemRequest.fromCountry,
            itemRequest.toCity,
            itemRequest.toCountry
          )}
        />
        <Detail
          label={t.byWhen}
          value={
            itemRequest.deadline
              ? formatDate(itemRequest.deadline, locale)
              : dict.common.flexible
          }
        />
        <Detail label={dict.deals.fee} value={reward ?? dict.common.negotiable} />
        <Detail
          label={dict.deals.weight}
          value={formatWeight(itemRequest.weightKg, locale) ?? dict.common.unknown}
        />
        <Detail
          label={t.handover}
          value={dict.enums.deliveryMode[itemRequest.deliveryMode]}
        />
        {value && <Detail label={t.value} value={value} />}
      </dl>

      {itemRequest.notes && (
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
          {itemRequest.notes}
        </p>
      )}

      <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        {isOwner ? (
          <>
            <h2 className="font-semibold">{t.matchingTripsHeading}</h2>
            <p className="mt-1 text-sm text-neutral-500">{t.matchingTripsIntro}</p>
            <ul className="mt-4 space-y-3">
              {matches.map(({ item: trip, score, reasons }) => (
                <li
                  key={trip.id}
                  className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/trips/${trip.id}`}
                        className="font-medium hover:underline"
                      >
                        {routeLabel(
                          trip.fromCity,
                          trip.fromCountry,
                          trip.toCity,
                          trip.toCountry
                        )}
                      </Link>
                      <p className="text-xs text-neutral-500">
                        {dict.enums.transportMode[trip.transportMode]} ·{" "}
                        {formatDate(trip.travelDate, locale)}
                      </p>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-800">
                      {format(dict.deals.points, { score })}
                    </span>
                  </div>
                  <MatchReasons reasons={reasons} dict={dict} />
                  <div className="mt-3">
                    <ProposeDealButton
                      fixed={{ requestId: itemRequest.id }}
                      counterpartId={trip.id}
                      isLoggedIn
                      compact
                      label={dict.deals.proposeShort}
                      t={dict.deals}
                    />
                  </div>
                </li>
              ))}
              {matches.length === 0 && (
                <p className="text-sm text-neutral-500">{t.noMatchingTrips}</p>
              )}
            </ul>
          </>
        ) : (
          <>
            <h2 className="font-semibold">{t.travellingHeading}</h2>
            <p className="mt-1 mb-3 text-sm text-neutral-500">{t.travellingIntro}</p>
            <ProposeDealButton
              fixed={{ requestId: itemRequest.id }}
              counterpartOptions={myTrips.map((trip) => ({
                id: trip.id,
                label: `${routeLabel(trip.fromCity, trip.fromCountry, trip.toCity, trip.toCountry)} · ${formatDate(trip.travelDate, locale)}`,
              }))}
              isLoggedIn={Boolean(user)}
              t={dict.deals}
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
