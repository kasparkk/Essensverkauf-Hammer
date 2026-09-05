import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden" }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: { include: { user: { select: { id: true, name: true } } } },
      trip: true,
      request: true,
    },
  });

  if (!conversation || !conversation.participants.some((p) => p.userId === user.id)) {
    return NextResponse.json({ error: "Konversation nicht gefunden" }, { status: 404 });
  }

  const otherUser =
    conversation.participants.find((p) => p.userId !== user.id)?.user ?? null;

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      trip: conversation.trip,
      request: conversation.request,
      otherUser,
    },
  });
}
