import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getErrors } from "@/lib/i18n/server";
import { findRequestsForTrip } from "@/lib/matching";

/** Offene Anfragen, die zu dieser Reise passen - beste zuerst. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const e = await getErrors();
  const { id } = await params;

  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) {
    return NextResponse.json({ error: e.tripNotFound }, { status: 404 });
  }

  const requests = await prisma.request.findMany({
    where: { isOpen: true, userId: { not: trip.userId } },
    include: { user: { select: { id: true, name: true } } },
  });

  const matches = findRequestsForTrip(trip, requests).map((match) => ({
    request: match.item,
    score: match.score,
    reasons: match.reasons,
  }));

  return NextResponse.json({ matches });
}
