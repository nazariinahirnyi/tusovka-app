import { mkdirSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/server/passwords";
import { newId, newInviteToken } from "../src/server/crypto";
import { normalizeTitle } from "../src/server/validation";

const prisma = new PrismaClient();

async function main() {
  mkdirSync(path.resolve(process.cwd(), "data", "uploads"), { recursive: true });
  const passwordHash = await hashPassword("correcthorsebatterystaple");

  const olena = await prisma.user.upsert({
    where: { email: "olena@example.com" },
    update: {},
    create: {
      id: newId(),
      email: "olena@example.com",
      passwordHash,
      displayName: "Олена",
    },
  });
  const maksym = await prisma.user.upsert({
    where: { email: "maksym@example.com" },
    update: {},
    create: {
      id: newId(),
      email: "maksym@example.com",
      passwordHash,
      displayName: "Максим",
    },
  });

  const jazzAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const hikeAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const existing = await prisma.event.findFirst({ where: { authorId: olena.id } });
  if (!existing) {
    await prisma.event.create({
      data: {
        id: newId(),
        authorId: olena.id,
        title: "Джаз на Подолі",
        titleNormalized: normalizeTitle("Джаз на Подолі"),
        description: "Жива музика, вино й теплі розмови. Приходьте без підборів.",
        startsAt: jazzAt,
        capacity: 24,
        isPublic: true,
        inviteToken: newInviteToken(),
      },
    });
    await prisma.event.create({
      data: {
        id: newId(),
        authorId: maksym.id,
        title: "Ранкова прогулянка Голосіївським",
        titleNormalized: normalizeTitle("Ранкова прогулянка Голосіївським"),
        description: "Тиха приватна прогулянка для своїх. Термос вітається.",
        startsAt: hikeAt,
        capacity: 8,
        isPublic: false,
        inviteToken: newInviteToken(),
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
