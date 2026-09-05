import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getErrors, translateIssue } from "@/lib/i18n/server";
import { createSessionToken, publicUser, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("invalidEmail"),
  password: z.string().min(1, "passwordRequired"),
});

export async function POST(request: NextRequest) {
  const e = await getErrors();
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: translateIssue(parsed.error.issues[0]?.message, e) },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    return NextResponse.json(
      { error: e.wrongCredentials },
      { status: 401 }
    );
  }

  const token = await createSessionToken(user.id);
  const response = NextResponse.json({ user: publicUser(user) });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
