import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getTranslations } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/config";
import LoginRequired from "@/components/login-required";

export default async function ChatListPage() {
  const [user, { locale, dict }] = await Promise.all([
    getCurrentUser(),
    getTranslations(),
  ]);
  const t = dict.chat;

  if (!user) {
    return <LoginRequired t={dict.auth} />;
  }

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: user.id } } },
    include: {
      participants: { include: { user: { select: { id: true, name: true } } } },
      trip: true,
      request: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const sorted = conversations.sort((a, b) => {
    const aTime = a.messages[0]?.createdAt ?? a.createdAt;
    const bTime = b.messages[0]?.createdAt ?? b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  const [emptyBefore, emptyRest] = t.empty.split("{requests}");
  const [emptyMiddle, emptyAfter] = (emptyRest ?? "").split("{trips}");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">{t.listHeading}</h1>

      <ul className="mt-6 space-y-2">
        {sorted.map((c) => {
          const otherUser = c.participants.find((p) => p.userId !== user.id)?.user;
          const lastMessage = c.messages[0];
          const context = c.trip
            ? format(t.tripContext, {
                route: `${c.trip.fromCountry} → ${c.trip.toCountry}`,
              })
            : c.request
              ? format(t.requestContext, { item: c.request.itemDescription })
              : "";

          return (
            <li key={c.id}>
              <Link
                href={`/chat/${c.id}`}
                className="block rounded-xl border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{otherUser?.name ?? t.unknownUser}</p>
                  {lastMessage && (
                    <span className="text-xs text-neutral-500">
                      {formatDateTime(lastMessage.createdAt, locale)}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-neutral-500">{context}</p>
                {lastMessage && (
                  <p className="mt-1 truncate text-sm text-neutral-600 dark:text-neutral-300">
                    {lastMessage.content}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
        {sorted.length === 0 && (
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
