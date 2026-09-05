import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { allowedNextStatuses, dealFlow } from "@/lib/deals";
import { formatDate, formatMoney, formatWeight, routeLabel } from "@/lib/format";
import { getTranslations } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/config";
import LoginRequired from "@/components/login-required";
import DealActions from "./deal-actions";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { locale, dict }] = await Promise.all([
    getCurrentUser(),
    getTranslations(),
  ]);
  const t = dict.deals;

  if (!user) {
    return <LoginRequired t={dict.auth} />;
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
          ? format(t.youTransportFor, { name: deal.requester.name })
          : format(t.transportBy, { name: deal.traveler.name })}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{deal.request.itemDescription}</h1>

      {cancelled ? (
        <p className="mt-6 rounded-lg bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
          {t.cancelled}
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
                {dict.enums.dealStatus[status]}
              </li>
            );
          })}
        </ol>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <Detail label={t.kind} value={dict.enums.requestKind[deal.request.kind]} />
        <Detail
          label={t.fee}
          value={formatMoney(deal.rewardCents, locale) ?? dict.common.negotiable}
        />
        <Detail
          label={t.tripRoute}
          value={routeLabel(
            deal.trip.fromCity,
            deal.trip.fromCountry,
            deal.trip.toCity,
            deal.trip.toCountry
          )}
        />
        <Detail
          label={t.travelDate}
          value={`${dict.enums.transportMode[deal.trip.transportMode]}, ${formatDate(deal.trip.travelDate, locale)}`}
        />
        <Detail label={t.handover} value={dict.enums.deliveryMode[deal.deliveryMode]} />
        <Detail
          label={t.weight}
          value={formatWeight(deal.request.weightKg, locale) ?? dict.common.unknown}
        />
        {deal.request.deadline && (
          <Detail label={t.deadline} value={formatDate(deal.request.deadline, locale)} />
        )}
      </dl>

      {deal.request.notes && (
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
          {deal.request.notes}
        </p>
      )}

      <div className="mt-8 space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <DealActions
          dealId={deal.id}
          allowed={allowed}
          actionLabels={dict.enums.dealAction}
          pendingLabel={dict.common.loading}
          failedLabel={t.stepFailed}
        />

        {allowed.length === 0 && !cancelled && deal.status !== "CONFIRMED" && (
          <p className="text-sm text-neutral-500">{t.otherSideTurn}</p>
        )}

        {deal.conversation && (
          <Link
            href={`/chat/${deal.conversation.id}`}
            className="inline-block text-sm font-medium underline"
          >
            {t.openChat}
          </Link>
        )}

        <p className="rounded-lg border border-neutral-200 p-3 text-xs text-neutral-500 dark:border-neutral-800">
          {t.disclaimer}
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
