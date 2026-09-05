import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!trip) {
    return NextResponse.json({ error: "Reise nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ trip });
}
