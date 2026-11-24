import { Prisma } from "@prisma/client";
import { inspectEventAccess } from "@/server/access";
import { newId } from "@/server/crypto";
import type { AppServices } from "@/server/db";
import { AppError } from "@/server/errors";
import { RSVP_LIMIT, RSVP_WINDOW_MS } from "@/server/rate-limit";

async function loadEventForRsvp(services: AppServices, eventId: string) {
  const event = await services.prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: { select: { userId: true } } },
  });
  if (!event) throw new AppError(404, "not_found", "Подію не знайдено");
  return event;
}

export async function joinEvent(
  services: AppServices,
  eventId: string,
  userId: string,
  inviteToken?: string | null,
): Promise<void> {
  if (!services.limiter.consume(`rsvp:${userId}`, RSVP_LIMIT, RSVP_WINDOW_MS)) {
    throw new AppError(429, "rate_limited", "Забагато спроб. Спробуйте пізніше.");
  }

  const event = await loadEventForRsvp(services, eventId);
  const access = inspectEventAccess(event, userId, inviteToken);
  if (!access.canView) {
    throw new AppError(404, "not_found", "Подію не знайдено");
  }
  if (event.startsAt.getTime() <= services.now().getTime()) {
    throw new AppError(400, "past_event", "Не можна записатися на подію, що вже почалася");
  }

  const id = newId();
  const createdAt = services.now().toISOString();

  try {
    const inserted = await services.prisma.$executeRaw`
      INSERT INTO Rsvp (id, eventId, userId, createdAt)
      SELECT ${id}, ${eventId}, ${userId}, ${createdAt}
      WHERE (
        SELECT COUNT(*) FROM Rsvp WHERE eventId = ${eventId}
      ) < (
        SELECT capacity FROM Event WHERE id = ${eventId}
      )
    `;
    if (inserted === 0) {
      const existing = await services.prisma.rsvp.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
      if (existing) {
        throw new AppError(409, "already_joined", "Ви вже записані на цю подію");
      }
      const fresh = await services.prisma.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { rsvps: true } } },
      });
      if (!fresh || fresh.startsAt.getTime() <= services.now().getTime()) {
        throw new AppError(400, "past_event", "Не можна записатися на подію, що вже почалася");
      }
      throw new AppError(409, "full", "Вільних місць немає");
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (isUniqueViolation(error)) {
      throw new AppError(409, "already_joined", "Ви вже записані на цю подію");
    }
    throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /UNIQUE constraint failed/i.test(message);
}

export async function cancelRsvp(
  services: AppServices,
  eventId: string,
  userId: string,
  inviteToken?: string | null,
): Promise<void> {
  const event = await loadEventForRsvp(services, eventId);
  const access = inspectEventAccess(event, userId, inviteToken);
  if (!access.canView) {
    throw new AppError(404, "not_found", "Подію не знайдено");
  }
  if (event.startsAt.getTime() <= services.now().getTime()) {
    throw new AppError(400, "past_event", "Не можна скасувати участь у події, що вже почалася");
  }
  const deleted = await services.prisma.rsvp.deleteMany({
    where: { eventId, userId },
  });
  if (deleted.count === 0) {
    throw new AppError(400, "not_joined", "Ви не записані на цю подію");
  }
}

export async function hasJoined(services: AppServices, eventId: string, userId: string): Promise<boolean> {
  const row = await services.prisma.rsvp.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { id: true },
  });
  return Boolean(row);
}
