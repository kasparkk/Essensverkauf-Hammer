import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { dealStatusLabels, formatMoney, routeLabel } from "@/lib/labels";

export default async function DealsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p>
          Bitte{" "}
          <Link href="/login" className="underline">
            anmelden
          </Link>
          , um deine Abmachungen zu sehen.
        </p>
      </div>
    );
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">Deine Abmachungen</h1>

      <ul className="mt-6 space-y-3">
        {deals.map((deal) => {
          const iAmTraveler = deal.travelerId === user.id;
          const other = iAmTraveler ? deal.requester : deal.traveler;
          return (
            <li key={deal.id}>
              <Link
                href={`/deals/${deal.id}`}
                className="block rounded-xl border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{deal.request.itemDescription}</p>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-800">
                    {dealStatusLabels[deal.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {routeLabel(
                    deal.trip.fromCity,
                    deal.trip.fromCountry,
                    deal.trip.toCity,
                    deal.trip.toCountry
                  )}{" "}
                  · {formatDate(deal.trip.travelDate)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {iAmTraveler ? "Du transportierst für" : "Transport durch"} {other.name}
                  {formatMoney(deal.rewardCents) && ` · ${formatMoney(deal.rewardCents)}`}
                </p>
              </Link>
            </li>
          );
        })}
        {deals.length === 0 && (
          <p className="text-neutral-500">
            Noch keine Abmachungen. Schau bei den{" "}
            <Link href="/requests" className="underline">
              Anfragen
            </Link>{" "}
            oder{" "}
            <Link href="/trips" className="underline">
              Reisen
            </Link>{" "}
            vorbei.
          </p>
        )}
      </ul>
    </div>
  );
}
