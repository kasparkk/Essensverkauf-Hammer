import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, formatWeight, routeLabel } from "@/lib/format";
import { getTranslations } from "@/lib/i18n/server";
import type { RequestKind } from "@/generated/prisma/client";

const kinds: RequestKind[] = ["RETRIEVAL", "SHOPPING", "TRANSPORT"];

function isKind(value: string | undefined): value is RequestKind {
  return kinds.includes(value as RequestKind);
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ toCountry?: string; kind?: string }>;
}) {
  const [{ locale, dict }, { toCountry, kind }] = await Promise.all([
    getTranslations(),
    searchParams,
  ]);
  const t = dict.requests;

  const requests = await prisma.request.findMany({
    where: {
      isOpen: true,
      ...(toCountry ? { toCountry: { contains: toCountry, mode: "insensitive" } } : {}),
      ...(isKind(kind) ? { kind } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t.listHeading}</h1>
        <Link
          href="/requests/new"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {t.create}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <FilterChip href="/requests" active={!isKind(kind)} label={t.all} />
        {kinds.map((option) => (
          <FilterChip
            key={option}
            href={`/requests?kind=${option}`}
            active={kind === option}
            label={dict.enums.requestKind[option]}
          />
        ))}
      </div>

      <form className="mt-4 flex gap-2" method="get">
        {isKind(kind) && <input type="hidden" name="kind" value={kind} />}
        <input
          type="text"
          name="toCountry"
          defaultValue={toCountry ?? ""}
          placeholder={t.filterPlaceholder}
          className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
        />
        <button
          type="submit"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          {dict.common.filter}
        </button>
      </form>

      <ul className="mt-6 space-y-3">
        {requests.map((req) => {
          const reward = formatMoney(req.rewardCents, locale);
          return (
            <li key={req.id}>
              <Link
                href={`/requests/${req.id}`}
                className="block rounded-xl border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-800">
                      {dict.enums.requestKind[req.kind]}
                    </span>
                    <p className="mt-1.5 font-medium">{req.itemDescription}</p>
                  </div>
                  {reward && (
                    <span className="whitespace-nowrap font-semibold">{reward}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {routeLabel(req.fromCity, req.fromCountry, req.toCity, req.toCountry)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {[
                    `${dict.common.from} ${req.user.name}`,
                    req.deadline ? formatDate(req.deadline, locale) : null,
                    formatWeight(req.weightKg, locale),
                    dict.enums.deliveryMode[req.deliveryMode],
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
            </li>
          );
        })}
        {requests.length === 0 && (
          <p className="text-neutral-500">
            {t.empty}{" "}
            <Link href="/requests/new" className="underline">
              {t.emptyCta}
            </Link>
            .
          </p>
        )}
      </ul>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 ${
        active
          ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
          : "border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
      }`}
    >
      {label}
    </Link>
  );
}
