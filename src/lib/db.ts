import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL;

  return !connectionString
    ? (() => { throw new Error("No database URL found. Set DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL."); })()
    : new PrismaClient({
        adapter: new PrismaPg(new pg.Pool({
          connectionString,
          ssl: (!connectionString.includes("localhost") && !connectionString.includes("127.0.0.1"))
            ? { rejectUnauthorized: false }
            : undefined,
        })),
      });
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    globalForPrisma.prisma = globalForPrisma.prisma || createPrismaClient();
    return Reflect.get(globalForPrisma.prisma, prop);
  },
});
