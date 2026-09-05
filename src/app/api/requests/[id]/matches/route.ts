import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getErrors } from "@/lib/i18n/server";
import { findTripsForRequest } from "@/lib/matching";

/** Reisen, die zu dieser Anfrage passen - beste zuerst. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const e = await getErrors();
  const { id } = await params;

  const itemRequest = await prisma.request.findUnique({ where: { id } });
  if (!itemRequest) {
    return NextResponse.json({ error: e.requestNotFound }, { status: 404 });
  }

  // Eigene Reisen des Anfragenden sind keine sinnvollen Treffer.
  const trips = await prisma.trip.findMany({
    where: { userId: { not: itemRequest.userId } },
    include: { user: { select: { id: true, name: true } } },
  });

  const matches = findTripsForRequest(itemRequest, trips).map((match) => ({
    trip: match.item,
    score: match.score,
    reasons: match.reasons,
  }));

  return NextResponse.json({ matches });
}
