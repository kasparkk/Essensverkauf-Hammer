import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { allowedNextStatuses } from "@/lib/deals";

const patchSchema = z.object({
  status: z.enum(["ACCEPTED", "PICKED_UP", "DELIVERED", "CONFIRMED", "CANCELLED"]),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden" }, { status: 401 });
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
    return NextResponse.json({ error: "Abmachung nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    deal,
    allowedNextStatuses: allowedNextStatuses(deal, user.id),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
  }

  const deal = await prisma.deal.findUnique({ where: { id } });
  if (!deal || (deal.requesterId !== user.id && deal.travelerId !== user.id)) {
    return NextResponse.json({ error: "Abmachung nicht gefunden" }, { status: 404 });
  }

  const nextStatus = parsed.data.status;
  if (!allowedNextStatuses(deal, user.id).includes(nextStatus)) {
    return NextResponse.json(
      { error: "Dieser Schritt ist für dich hier nicht möglich" },
      { status: 403 }
    );
  }

  // Sobald zugesagt ist, gilt die Anfrage als vergeben; bei Abbruch wird sie
  // wieder freigegeben, sofern keine andere Abmachung sie noch belegt.
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.deal.update({
      where: { id },
      data: { status: nextStatus },
    });

    if (nextStatus === "ACCEPTED") {
      await tx.request.update({
        where: { id: deal.requestId },
        data: { isOpen: false },
      });
    }

    if (nextStatus === "CANCELLED") {
      const stillTaken = await tx.deal.count({
        where: {
          requestId: deal.requestId,
          id: { not: deal.id },
          status: { in: ["ACCEPTED", "PICKED_UP", "DELIVERED", "CONFIRMED"] },
        },
      });
      if (stillTaken === 0) {
        await tx.request.update({
          where: { id: deal.requestId },
          data: { isOpen: true },
        });
      }
    }

    return result;
  });

  return NextResponse.json({
    deal: updated,
    allowedNextStatuses: allowedNextStatuses(updated, user.id),
  });
}
