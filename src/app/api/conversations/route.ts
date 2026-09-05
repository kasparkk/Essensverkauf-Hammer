import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const createConversationSchema = z
  .object({
    tripId: z.string().optional(),
    requestId: z.string().optional(),
  })
  .refine((data) => Boolean(data.tripId) !== Boolean(data.requestId), {
    message: "Entweder tripId oder requestId angeben",
  });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: user.id } } },
    include: {
      participants: { include: { user: { select: { id: true, name: true } } } },
      trip: true,
      request: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = conversations
    .map((c) => ({
      id: c.id,
      trip: c.trip,
      request: c.request,
      otherUser: c.participants.find((p) => p.userId !== user.id)?.user ?? null,
      lastMessage: c.messages[0] ?? null,
      createdAt: c.createdAt,
    }))
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? a.createdAt;
      const bTime = b.lastMessage?.createdAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  return NextResponse.json({ conversations: result });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const { tripId, requestId } = parsed.data;

  let otherUserId: string;

  if (tripId) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return NextResponse.json({ error: "Reise nicht gefunden" }, { status: 404 });
    }
    if (trip.userId === user.id) {
      return NextResponse.json(
        { error: "Du kannst keine Konversation mit dir selbst starten" },
        { status: 400 }
      );
    }
    otherUserId = trip.userId;
  } else {
    const req = await prisma.request.findUnique({ where: { id: requestId! } });
    if (!req) {
      return NextResponse.json({ error: "Anfrage nicht gefunden" }, { status: 404 });
    }
    if (req.userId === user.id) {
      return NextResponse.json(
        { error: "Du kannst keine Konversation mit dir selbst starten" },
        { status: 400 }
      );
    }
    otherUserId = req.userId;
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      tripId: tripId ?? null,
      requestId: requestId ?? null,
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ conversation: existing });
  }

  const conversation = await prisma.conversation.create({
    data: {
      tripId,
      requestId,
      participants: {
        create: [{ userId: user.id }, { userId: otherUserId }],
      },
    },
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
