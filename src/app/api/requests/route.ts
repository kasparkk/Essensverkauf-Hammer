import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const createRequestSchema = z.object({
  fromCountry: z.string().trim().min(2).max(100),
  toCountry: z.string().trim().min(2).max(100),
  itemDescription: z.string().trim().min(2).max(500),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const toCountry = request.nextUrl.searchParams.get("toCountry")?.trim();

  const requests = await prisma.request.findMany({
    where: toCountry ? { toCountry: { contains: toCountry } } : undefined,
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

  const { fromCountry, toCountry, itemDescription, notes } = parsed.data;

  const created = await prisma.request.create({
    data: {
      userId: user.id,
      fromCountry,
      toCountry,
      itemDescription,
      notes: notes || null,
    },
  });

  return NextResponse.json({ request: created }, { status: 201 });
}
