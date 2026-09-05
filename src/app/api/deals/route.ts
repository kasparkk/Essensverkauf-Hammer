import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getErrors, translateIssue } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth";

const createDealSchema = z.object({
  requestId: z.string().min(1),
  tripId: z.string().min(1),
  rewardEuro: z.coerce.number().min(0).max(100000).optional().or(z.literal("")),
  deliveryMode: z.enum(["HANDOFF", "POSTAL", "EITHER"]).optional(),
});

export async function GET() {
  const e = await getErrors();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: e.notLoggedIn }, { status: 401 });
  }

  const deals = await prisma.deal.findMany({
    where: { OR: [{ requesterId: user.id }, { travelerId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      request: true,
      trip: true,
      requester: { select: { id: true, name: true } },
      traveler: { select: { id: true, name: true } },
      conversation: { select: { id: true } },
    },
  });

  return NextResponse.json({ deals });
}

/**
 * Schlägt eine Abmachung zwischen einer Anfrage und einer Reise vor.
 * Vorschlagen darf, wer an einer der beiden Seiten beteiligt ist; annehmen
 * muss anschließend die jeweils andere Seite.
 */
export async function POST(request: NextRequest) {
  const e = await getErrors();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: e.notLoggedIn }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createDealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: translateIssue(parsed.error.issues[0]?.message, e) },
      { status: 400 }
    );
  }

  const { requestId, tripId, rewardEuro, deliveryMode } = parsed.data;

  const [itemRequest, trip] = await Promise.all([
    prisma.request.findUnique({ where: { id: requestId } }),
    prisma.trip.findUnique({ where: { id: tripId } }),
  ]);

  if (!itemRequest || !trip) {
    return NextResponse.json(
      { error: e.requestOrTripNotFound },
      { status: 404 }
    );
  }

  if (itemRequest.userId === trip.userId) {
    return NextResponse.json(
      { error: e.sameOwner },
      { status: 400 }
    );
  }

  if (user.id !== itemRequest.userId && user.id !== trip.userId) {
    return NextResponse.json(
      { error: e.onlyParticipants },
      { status: 403 }
    );
  }

  const existing = await prisma.deal.findUnique({
    where: { requestId_tripId: { requestId, tripId } },
    include: { conversation: { select: { id: true } } },
  });
  if (existing) {
    return NextResponse.json({ deal: existing });
  }

  const deal = await prisma.deal.create({
    data: {
      requestId,
      tripId,
      requesterId: itemRequest.userId,
      travelerId: trip.userId,
      proposedById: user.id,
      rewardCents:
        typeof rewardEuro === "number"
          ? Math.round(rewardEuro * 100)
          : itemRequest.rewardCents,
      deliveryMode: deliveryMode ?? itemRequest.deliveryMode,
      // Jede Abmachung bekommt direkt einen eigenen Chat für die Absprache.
      conversation: {
        create: {
          requestId,
          tripId,
          participants: {
            create: [{ userId: itemRequest.userId }, { userId: trip.userId }],
          },
        },
      },
    },
    include: { conversation: { select: { id: true } } },
  });

  return NextResponse.json({ deal }, { status: 201 });
}
