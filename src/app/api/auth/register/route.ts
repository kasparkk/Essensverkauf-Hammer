import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getErrors, translateIssue } from "@/lib/i18n/server";
import { createSessionToken, publicUser, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().trim().min(2, "nameTooShort").max(100),
  email: z.string().trim().toLowerCase().email("invalidEmail"),
  password: z.string().min(8, "passwordTooShort").max(200),
});

export async function POST(request: NextRequest) {
  const e = await getErrors();
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: translateIssue(parsed.error.issues[0]?.message, e) },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: e.emailTaken },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const token = await createSessionToken(user.id);
  const response = NextResponse.json({ user: publicUser(user) }, { status: 201 });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
