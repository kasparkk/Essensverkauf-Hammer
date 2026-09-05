import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const createTripSchema = z.object({
  fromCountry: z.string().trim().min(2).max(100),
  fromCity: z.string().trim().max(100).optional().or(z.literal("")),
  toCountry: z.string().trim().min(2).max(100),
  toCity: z.string().trim().max(100).optional().or(z.literal("")),
  travelDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Ungültiges Datum"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const toCountry = request.nextUrl.searchParams.get("toCountry")?.trim();

  const trips = await prisma.trip.findMany({
    where: toCountry ? { toCountry: { contains: toCountry } } : undefined,
    orderBy: { travelDate: "asc" },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ trips });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const { fromCountry, fromCity, toCountry, toCity, travelDate, notes } = parsed.data;

  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      fromCountry,
      fromCity: fromCity || null,
      toCountry,
      toCity: toCity || null,
      travelDate: new Date(travelDate),
      notes: notes || null,
    },
  });

  return NextResponse.json({ trip }, { status: 201 });
}
