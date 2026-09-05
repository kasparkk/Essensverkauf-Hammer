import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatMoney, routeLabel } from "@/lib/format";
import { getTranslations } from "@/lib/i18n/server";
import LoginRequired from "@/components/login-required";

export default async function DealsPage() {
  const [user, { locale, dict }] = await Promise.all([
    getCurrentUser(),
    getTranslations(),
  ]);
  const t = dict.deals;

  if (!user) {
    return <LoginRequired t={dict.auth} />;
  }

  const deals = await prisma.deal.findMany({
    where: { OR: [{ requesterId: user.id }, { travelerId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      request: true,
      trip: true,
      requester: { select: { id: true, name: true } },
      traveler: { select: { id: true, name: true } },
    },
  });

  const [emptyBefore, emptyRest] = t.empty.split("{requests}");
  const [emptyMiddle, emptyAfter] = (emptyRest ?? "").split("{trips}");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">{t.listHeading}</h1>

      <ul className="mt-6 space-y-3">
        {deals.map((deal) => {
          const iAmTraveler = deal.travelerId === user.id;
          const other = iAmTraveler ? deal.requester : deal.traveler;
          const reward = formatMoney(deal.rewardCents, locale);
          return (
            <li key={deal.id}>
              <Link
                href={`/deals/${deal.id}`}
                className="block rounded-xl border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{deal.request.itemDescription}</p>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-800">
                    {dict.enums.dealStatus[deal.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {routeLabel(
                    deal.trip.fromCity,
                    deal.trip.fromCountry,
                    deal.trip.toCity,
                    deal.trip.toCountry
                  )}{" "}
                  · {formatDate(deal.trip.travelDate, locale)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {iAmTraveler ? t.youTransportForShort : t.transportByShort} {other.name}
                  {reward && ` · ${reward}`}
                </p>
              </Link>
            </li>
          );
        })}
        {deals.length === 0 && (
          <p className="text-neutral-500">
            {emptyBefore}
            <Link href="/requests" className="underline">
              {t.emptyRequests}
            </Link>
            {emptyMiddle}
            <Link href="/trips" className="underline">
              {t.emptyTrips}
            </Link>
            {emptyAfter}
          </p>
        )}
      </ul>
    </div>
  );
}
