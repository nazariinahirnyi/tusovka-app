import { copyFileSync, existsSync, mkdirSync } from "node:fs";
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
  await prisma.$queryRaw`PRAGMA foreign_keys = ON`;
  await prisma.$queryRaw`PRAGMA busy_timeout = 5000`;
  await prisma.$queryRaw`PRAGMA journal_mode = WAL`;
}

export function getLimiter(): MemoryRateLimiter {
  if (!globalForPrisma.limiter) {
    globalForPrisma.limiter = new MemoryRateLimiter();
  }
  return globalForPrisma.limiter;
}

export function uploadsDir(): string {
  if (process.env.VERCEL) return "/tmp/tusovka-uploads";
  return path.resolve(process.cwd(), "data", "uploads");
}

function sqliteFilePath(url: string): string | null {
  if (!url.startsWith("file:")) return null;
  const raw = url.slice("file:".length);
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), "prisma", raw);
}

function ensureWritableDatabase(): void {
  const dest = sqliteFilePath(process.env.DATABASE_URL ?? "");
  if (!dest) return;
  mkdirSync(path.dirname(dest), { recursive: true });
  if (existsSync(dest)) return;
  const template = path.resolve(process.cwd(), "data", "tusovka.db");
  if (existsSync(template) && path.resolve(template) !== path.resolve(dest)) {
    copyFileSync(template, dest);
  }
}

export type AppServices = {
  prisma: PrismaClient;
  now: () => Date;
  limiter: MemoryRateLimiter;
  uploadsDir: string;
};

export async function getServices(): Promise<AppServices> {
  ensureWritableDatabase();
  mkdirSync(uploadsDir(), { recursive: true });
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
