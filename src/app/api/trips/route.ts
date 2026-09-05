import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const createTripSchema = z.object({
  transportMode: z.enum(["FLIGHT", "TRAIN", "CAR", "BUS"]).default("FLIGHT"),
  fromCountry: z.string().trim().min(2).max(100),
  fromCity: optionalText(100),
  toCountry: z.string().trim().min(2).max(100),
  toCity: optionalText(100),
  travelDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Ungültiges Datum"),
  capacityKg: z.coerce.number().positive().max(1000).optional().or(z.literal("")),
  offersPostal: z.coerce.boolean().default(false),
  notes: optionalText(1000),
});

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const toCountry = params.get("toCountry")?.trim();
  const fromCountry = params.get("fromCountry")?.trim();

  const trips = await prisma.trip.findMany({
    where: {
      ...(toCountry ? { toCountry: { contains: toCountry, mode: "insensitive" } } : {}),
      ...(fromCountry
        ? { fromCountry: { contains: fromCountry, mode: "insensitive" } }
        : {}),
    },
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

  const data = parsed.data;
  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      transportMode: data.transportMode,
      fromCountry: data.fromCountry,
      fromCity: data.fromCity || null,
      toCountry: data.toCountry,
      toCity: data.toCity || null,
      travelDate: new Date(data.travelDate),
      capacityKg: typeof data.capacityKg === "number" ? data.capacityKg : null,
      offersPostal: data.offersPostal,
      notes: data.notes || null,
    },
  });

  return NextResponse.json({ trip }, { status: 201 });
}
