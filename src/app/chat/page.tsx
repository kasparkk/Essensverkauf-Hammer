import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export default async function ChatListPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p>
          Bitte{" "}
          <Link href="/login" className="underline">
            anmelden
          </Link>
          , um deine Chats zu sehen.
        </p>
      </div>
    );
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">Deine Chats</h1>

      <ul className="mt-6 space-y-2">
        {sorted.map((c) => {
          const otherUser = c.participants.find((p) => p.userId !== user.id)?.user;
          const lastMessage = c.messages[0];
          const context = c.trip
            ? `Reise: ${c.trip.fromCountry} → ${c.trip.toCountry}`
            : c.request
              ? `Anfrage: ${c.request.itemDescription}`
              : "";

          return (
            <li key={c.id}>
              <Link
                href={`/chat/${c.id}`}
                className="block rounded-xl border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{otherUser?.name ?? "Unbekannt"}</p>
                  {lastMessage && (
                    <span className="text-xs text-neutral-500">
                      {formatDateTime(lastMessage.createdAt)}
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
            Noch keine Chats. Kontaktiere jemanden über eine{" "}
            <Link href="/trips" className="underline">
              Reise
            </Link>{" "}
            oder{" "}
            <Link href="/requests" className="underline">
              Anfrage
            </Link>
            .
          </p>
        )}
      </ul>
    </div>
  );
}
