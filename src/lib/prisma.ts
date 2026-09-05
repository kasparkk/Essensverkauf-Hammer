import { PrismaPg } from "@prisma/adapter-pg";
import { getConnectionString } from "@netlify/database";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveConnectionString() {
  try {
    return getConnectionString() ?? process.env.DATABASE_URL;
  } catch {
    return process.env.DATABASE_URL;
  }
}

const adapter = new PrismaPg({ connectionString: resolveConnectionString() });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
