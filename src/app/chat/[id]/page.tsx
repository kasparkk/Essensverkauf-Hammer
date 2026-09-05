import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ChatThread from "./chat-thread";

export default async function ChatDetailPage({
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
          , um diesen Chat zu sehen.
        </p>
      </div>
    );
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: { include: { user: { select: { id: true, name: true } } } },
      trip: true,
      request: true,
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });

  const isParticipant = conversation?.participants.some((p) => p.userId === user.id);
  if (!conversation || !isParticipant) {
    notFound();
  }

  const otherUser = conversation.participants.find((p) => p.userId !== user.id)?.user;
  const context = conversation.trip
    ? `Reise: ${conversation.trip.fromCountry} → ${conversation.trip.toCountry}`
    : conversation.request
      ? `Anfrage: ${conversation.request.itemDescription}`
      : "";

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-2xl flex-col px-4 py-6">
      <div className="border-b border-neutral-200 pb-3 dark:border-neutral-800">
        <h1 className="text-xl font-bold">{otherUser?.name ?? "Unbekannt"}</h1>
        <p className="text-sm text-neutral-500">{context}</p>
      </div>

      <ChatThread
        conversationId={conversation.id}
        currentUserId={user.id}
        initialMessages={conversation.messages}
      />
    </div>
  );
}
