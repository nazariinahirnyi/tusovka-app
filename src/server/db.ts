import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { MemoryRateLimiter } from "@/server/rate-limit";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  limiter?: MemoryRateLimiter;
  sqliteReady?: Promise<void>;
};

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.DEBUG_PRISMA === "1" ? ["query", "error"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

export async function configureSqlite(prisma: PrismaClient): Promise<void> {
  await prisma.$queryRawUnsafe("PRAGMA foreign_keys = ON");
  await prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000");
  await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL");
}

export function getLimiter(): MemoryRateLimiter {
  if (!globalForPrisma.limiter) {
    globalForPrisma.limiter = new MemoryRateLimiter();
  }
  return globalForPrisma.limiter;
}

export function uploadsDir(): string {
  return path.resolve(process.cwd(), "data", "uploads");
}

export type AppServices = {
  prisma: PrismaClient;
  now: () => Date;
  limiter: MemoryRateLimiter;
  uploadsDir: string;
};

export async function getServices(): Promise<AppServices> {
  const prisma = getPrisma();
  if (!globalForPrisma.sqliteReady) {
    globalForPrisma.sqliteReady = configureSqlite(prisma);
  }
  await globalForPrisma.sqliteReady;
  return {
    prisma,
    now: () => new Date(),
    limiter: getLimiter(),
    uploadsDir: uploadsDir(),
  };
}

export function createServices(overrides: Partial<AppServices> & { prisma: PrismaClient }): AppServices {
  return {
    now: () => new Date(),
    limiter: new MemoryRateLimiter(),
    uploadsDir: uploadsDir(),
    ...overrides,
  };
}
