import { execSync } from "node:child_process";
import { mkdtempSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { configureSqlite, createServices, type AppServices } from "@/server/db";
import { registerUser, type PublicUser } from "@/server/auth";

export async function makeWorld() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "tusovka-"));
  const dbPath = path.join(dir, "test.db");
  const url = `file:${dbPath}`;
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  await configureSqlite(prisma);
  const uploads = path.join(dir, "uploads");
  mkdirSync(uploads, { recursive: true });
  const now = { current: new Date("2026-11-24T12:00:00.000Z") };
  const services = createServices({
    prisma,
    uploadsDir: uploads,
    now: () => new Date(now.current),
  });
  return {
    dir,
    prisma,
    services,
    now,
    async close() {
      await prisma.$disconnect();
    },
  };
}

export async function user(
  services: AppServices,
  name: string,
  email = `${name.toLowerCase()}@example.com`,
): Promise<PublicUser & { sessionToken: string }> {
  const result = await registerUser(
    services,
    { email, password: "correcthorsebatterystaple", displayName: name },
    email,
  );
  return { ...result.user, sessionToken: result.sessionToken };
}

export function futureLocal(days = 3): string {
  const date = new Date(Date.UTC(2026, 10, 24 + days, 16, 0, 0));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}T18:00`;
}
