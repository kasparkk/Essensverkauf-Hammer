import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/config";
import LoginRequired from "@/components/login-required";
import ChatThread from "./chat-thread";

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { dict }] = await Promise.all([getCurrentUser(), getTranslations()]);
  const t = dict.chat;

  if (!user) {
    return <LoginRequired t={dict.auth} />;
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
    ? format(t.tripContext, {
        route: `${conversation.trip.fromCountry} → ${conversation.trip.toCountry}`,
      })
    : conversation.request
      ? format(t.requestContext, { item: conversation.request.itemDescription })
      : "";

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-2xl flex-col px-4 py-6">
      <div className="border-b border-neutral-200 pb-3 dark:border-neutral-800">
        <h1 className="text-xl font-bold">{otherUser?.name ?? t.unknownUser}</h1>
        <p className="text-sm text-neutral-500">{context}</p>
      </div>

      <ChatThread
        conversationId={conversation.id}
        currentUserId={user.id}
        initialMessages={conversation.messages}
        t={t}
      />
    </div>
  );
}
