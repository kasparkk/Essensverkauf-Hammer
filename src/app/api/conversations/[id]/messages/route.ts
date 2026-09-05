import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Nachricht darf nicht leer sein").max(2000),
});

async function requireParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return Boolean(participant);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden" }, { status: 401 });
  }

  const { id } = await params;
  const isParticipant = await requireParticipant(id, user.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "Konversation nicht gefunden" }, { status: 404 });
  }

  const afterParam = request.nextUrl.searchParams.get("after");
  const messages = await prisma.message.findMany({
    where: {
      conversationId: id,
      ...(afterParam ? { createdAt: { gt: new Date(afterParam) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ messages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden" }, { status: 401 });
  }

  const { id } = await params;
  const isParticipant = await requireParticipant(id, user.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "Konversation nicht gefunden" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: user.id,
      content: parsed.data.content,
    },
    include: { sender: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ message }, { status: 201 });
}
