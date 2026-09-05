import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const optionalNumber = (max: number) =>
  z.coerce.number().positive().max(max).optional().or(z.literal(""));

const createRequestSchema = z.object({
  kind: z.enum(["RETRIEVAL", "SHOPPING", "TRANSPORT"]).default("TRANSPORT"),
  fromCountry: z.string().trim().min(2).max(100),
  fromCity: optionalText(100),
  toCountry: z.string().trim().min(2).max(100),
  toCity: optionalText(100),
  itemDescription: z.string().trim().min(2).max(500),
  deadline: z
    .string()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Ungültiges Datum")
    .optional()
    .or(z.literal("")),
  weightKg: optionalNumber(1000),
  /// Honorar und Warenwert kommen in Euro aus dem Formular, gespeichert wird in Cent.
  rewardEuro: optionalNumber(100000),
  itemValueEuro: optionalNumber(1000000),
  deliveryMode: z.enum(["HANDOFF", "POSTAL", "EITHER"]).default("EITHER"),
  notes: optionalText(1000),
});

const toCents = (euro: number | "" | undefined) =>
  typeof euro === "number" ? Math.round(euro * 100) : null;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const toCountry = params.get("toCountry")?.trim();
  const kind = params.get("kind")?.trim();

  const requests = await prisma.request.findMany({
    where: {
      isOpen: true,
      ...(toCountry ? { toCountry: { contains: toCountry, mode: "insensitive" } } : {}),
      ...(kind === "RETRIEVAL" || kind === "SHOPPING" || kind === "TRANSPORT"
        ? { kind }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const created = await prisma.request.create({
    data: {
      userId: user.id,
      kind: data.kind,
      fromCountry: data.fromCountry,
      fromCity: data.fromCity || null,
      toCountry: data.toCountry,
      toCity: data.toCity || null,
      itemDescription: data.itemDescription,
      deadline: data.deadline ? new Date(data.deadline) : null,
      weightKg: typeof data.weightKg === "number" ? data.weightKg : null,
      rewardCents: toCents(data.rewardEuro),
      itemValueCents: toCents(data.itemValueEuro),
      deliveryMode: data.deliveryMode,
      notes: data.notes || null,
    },
  });

  return NextResponse.json({ request: created }, { status: 201 });
}
