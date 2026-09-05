import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { allowedNextStatuses } from "@/lib/deals";
import { formatDate } from "@/lib/format";
import {
  dealFlow,
  dealStatusLabels,
  deliveryModeLabels,
  formatMoney,
  formatWeight,
  requestKindLabels,
  routeLabel,
  transportModeLabels,
} from "@/lib/labels";
import DealActions from "./deal-actions";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p>
          Bitte{" "}
          <Link href="/login" className="underline">
            anmelden
          </Link>
          , um diese Abmachung zu sehen.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      request: true,
      trip: true,
      requester: { select: { id: true, name: true } },
      traveler: { select: { id: true, name: true } },
      conversation: { select: { id: true } },
    },
  });

  if (!deal || (deal.requesterId !== user.id && deal.travelerId !== user.id)) {
    notFound();
  }

  const iAmTraveler = deal.travelerId === user.id;
  const allowed = allowedNextStatuses(deal, user.id);
  const cancelled = deal.status === "CANCELLED";
  const currentStep = dealFlow.indexOf(deal.status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-neutral-500">
        {iAmTraveler
          ? `Du transportierst für ${deal.requester.name}`
          : `${deal.traveler.name} transportiert für dich`}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{deal.request.itemDescription}</h1>

      {/* Fortschritt */}
      {cancelled ? (
        <p className="mt-6 rounded-lg bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
          Diese Abmachung wurde abgebrochen.
        </p>
      ) : (
        <ol className="mt-6 flex flex-wrap gap-2 text-xs">
          {dealFlow.map((status, index) => {
            const done = index <= currentStep;
            return (
              <li
                key={status}
                className={`rounded-full px-3 py-1 ${
                  done
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                }`}
              >
                {dealStatusLabels[status]}
              </li>
            );
          })}
        </ol>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <Detail label="Art" value={requestKindLabels[deal.request.kind]} />
        <Detail label="Honorar" value={formatMoney(deal.rewardCents) ?? "verhandelbar"} />
        <Detail
          label="Route der Reise"
          value={routeLabel(
            deal.trip.fromCity,
            deal.trip.fromCountry,
            deal.trip.toCity,
            deal.trip.toCountry
          )}
        />
        <Detail
          label="Reisedatum"
          value={`${transportModeLabels[deal.trip.transportMode]}, ${formatDate(deal.trip.travelDate)}`}
        />
        <Detail label="Übergabe" value={deliveryModeLabels[deal.deliveryMode]} />
        <Detail
          label="Gewicht"
          value={formatWeight(deal.request.weightKg) ?? "unbekannt"}
        />
        {deal.request.deadline && (
          <Detail label="Deadline" value={formatDate(deal.request.deadline)} />
        )}
      </dl>

      {deal.request.notes && (
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
          {deal.request.notes}
        </p>
      )}

      <div className="mt-8 space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <DealActions dealId={deal.id} allowed={allowed} />

        {allowed.length === 0 && !cancelled && deal.status !== "CONFIRMED" && (
          <p className="text-sm text-neutral-500">
            Jetzt ist die andere Seite dran.
          </p>
        )}

        {deal.conversation && (
          <Link
            href={`/chat/${deal.conversation.id}`}
            className="inline-block text-sm font-medium underline"
          >
            Chat zu dieser Abmachung öffnen →
          </Link>
        )}

        <p className="rounded-lg border border-neutral-200 p-3 text-xs text-neutral-500 dark:border-neutral-800">
          Die Zahlung läuft aktuell direkt zwischen euch – die Plattform hält kein
          Geld treuhänderisch und prüft keine Identitäten. Beides braucht einen
          Zahlungs- und einen Ausweis-Dienstleister.
        </p>
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
