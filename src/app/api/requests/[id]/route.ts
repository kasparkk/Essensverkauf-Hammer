import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const itemRequest = await prisma.request.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!itemRequest) {
    return NextResponse.json({ error: "Anfrage nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ request: itemRequest });
}
