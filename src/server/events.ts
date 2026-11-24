import type { Event, User } from "@prisma/client";
import { inspectEventAccess } from "@/server/access";
import { newId, newInviteToken } from "@/server/crypto";
import type { AppServices } from "@/server/db";
import { AppError } from "@/server/errors";
import { deleteCover, saveCover } from "@/server/uploads";
import {
  eventInputSchema,
  eventStartsAtUtc,
  normalizeTitle,
  parseOrThrow,
  searchNeedle,
  searchQuerySchema,
} from "@/server/validation";

export type EventWithMeta = Omit<Event, "inviteToken"> & {
  author: Pick<User, "id" | "displayName">;
  _count: { rsvps: number; comments: number };
  inviteToken?: string;
};

const eventInclude = {
  author: { select: { id: true, displayName: true } },
  _count: { select: { rsvps: true, comments: true } },
} as const;

export async function listPublicUpcoming(
  services: AppServices,
  rawQuery?: string | null,
): Promise<EventWithMeta[]> {
  const q = searchQuerySchema.parse(rawQuery ?? "");
  const now = services.now();
  return services.prisma.event.findMany({
    where: {
      isPublic: true,
      startsAt: { gt: now },
      ...(q && searchNeedle(q)
        ? { titleNormalized: { contains: searchNeedle(q) } }
        : {}),
    },
    orderBy: { startsAt: "asc" },
    take: 100,
    include: eventInclude,
  }).then((rows) => rows.map((row) => revealInvite(row, false)));
}

export async function getEventForViewer(
  services: AppServices,
  eventId: string,
  userId: string | null,
  inviteToken?: string | null,
): Promise<EventWithMeta> {
  const event = await services.prisma.event.findUnique({
    where: { id: eventId },
    include: {
      ...eventInclude,
      rsvps: { select: { userId: true } },
    },
  });
  if (!event) {
    throw new AppError(404, "not_found", "Подію не знайдено");
  }
  const access = inspectEventAccess(event, userId, inviteToken);
  if (!access.canView) {
    throw new AppError(404, "not_found", "Подію не знайдено");
  }
  return revealInvite(omitRsvps(event), access.canManage);
}

export async function getEventByInvite(
  services: AppServices,
  token: string,
  userId: string | null,
): Promise<EventWithMeta> {
  const event = await services.prisma.event.findUnique({
    where: { inviteToken: token },
    include: {
      ...eventInclude,
      rsvps: { select: { userId: true } },
    },
  });
  if (!event) {
    throw new AppError(404, "not_found", "Подію не знайдено");
  }
  const access = inspectEventAccess(event, userId, token);
  if (!access.canView) {
    throw new AppError(404, "not_found", "Подію не знайдено");
  }
  return revealInvite(omitRsvps(event), access.canManage);
}

function omitRsvps<T extends { rsvps?: unknown }>(event: T): Omit<T, "rsvps"> {
  const copy = { ...event };
  delete copy.rsvps;
  return copy;
}

function revealInvite<T extends { inviteToken: string }>(event: T, keep: boolean): Omit<T, "inviteToken"> & { inviteToken?: string } {
  if (keep) return event;
  const { inviteToken: _hidden, ...rest } = event;
  return rest;
}

export async function createEvent(
  services: AppServices,
  authorId: string,
  input: unknown,
  cover?: File | Blob | Buffer | null,
): Promise<Event> {
  const data = parseOrThrow(eventInputSchema, input);
  const startsAt = eventStartsAtUtc(data.startsAt);
  if (startsAt.getTime() <= services.now().getTime()) {
    throw new AppError(400, "past_event", "Не можна створити подію в минулому", {
      startsAt: "Оберіть майбутню дату",
    });
  }

  let coverFilename: string | null = null;
  if (cover && ((Buffer.isBuffer(cover) && cover.length > 0) || (!Buffer.isBuffer(cover) && cover.size > 0))) {
    coverFilename = await saveCover(services.uploadsDir, cover);
  }

  try {
    return await services.prisma.event.create({
      data: {
        id: newId(),
        authorId,
        title: data.title,
        titleNormalized: normalizeTitle(data.title),
        description: data.description,
        startsAt,
        capacity: data.capacity,
        coverFilename,
        isPublic: data.isPublic,
        inviteToken: newInviteToken(),
      },
    });
  } catch (error) {
    if (coverFilename) await deleteCover(services.uploadsDir, coverFilename);
    throw error;
  }
}

export async function updateEvent(
  services: AppServices,
  eventId: string,
  actorId: string,
  input: unknown,
  cover?: File | Blob | Buffer | null,
): Promise<Event> {
  const existing = await services.prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { rsvps: true } } },
  });
  if (!existing) throw new AppError(404, "not_found", "Подію не знайдено");
  if (existing.authorId !== actorId) {
    throw new AppError(403, "forbidden", "Редагувати подію може лише автор");
  }

  const data = parseOrThrow(eventInputSchema, input);
  const startsAt = eventStartsAtUtc(data.startsAt);
  if (startsAt.getTime() <= services.now().getTime()) {
    throw new AppError(400, "past_event", "Не можна перенести подію в минуле", {
      startsAt: "Оберіть майбутню дату",
    });
  }
  if (data.capacity < existing._count.rsvps) {
    throw new AppError(400, "capacity_too_low", "Місткість менша за кількість уже записаних", {
      capacity: `Уже записано ${existing._count.rsvps}`,
    });
  }

  let coverFilename = existing.coverFilename;
  let uploaded: string | null = null;
  const hasNewCover =
    cover && ((Buffer.isBuffer(cover) && cover.length > 0) || (!Buffer.isBuffer(cover) && cover.size > 0));
  if (hasNewCover && cover) {
    uploaded = await saveCover(services.uploadsDir, cover);
    coverFilename = uploaded;
  }

  try {
    const updated = await services.prisma.$transaction(async (tx) => {
      const guarded = await tx.$executeRaw`
        UPDATE Event
        SET capacity = ${data.capacity}
        WHERE id = ${eventId}
          AND (
            SELECT COUNT(*) FROM Rsvp WHERE eventId = ${eventId}
          ) <= ${data.capacity}
      `;
      if (guarded === 0) {
        throw new AppError(400, "capacity_too_low", "Місткість менша за кількість уже записаних", {
          capacity: "Уже записано більше людей",
        });
      }
      return tx.event.update({
        where: { id: eventId },
        data: {
          title: data.title,
          titleNormalized: normalizeTitle(data.title),
          description: data.description,
          startsAt,
          capacity: data.capacity,
          coverFilename,
          isPublic: data.isPublic,
        },
      });
    });
    if (uploaded && existing.coverFilename && existing.coverFilename !== uploaded) {
      await deleteCover(services.uploadsDir, existing.coverFilename);
    }
    return updated;
  } catch (error) {
    if (uploaded) await deleteCover(services.uploadsDir, uploaded);
    throw error;
  }
}

export async function deleteEvent(
  services: AppServices,
  eventId: string,
  actorId: string,
): Promise<void> {
  const existing = await services.prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) throw new AppError(404, "not_found", "Подію не знайдено");
  if (existing.authorId !== actorId) {
    throw new AppError(403, "forbidden", "Видалити подію може лише автор");
  }
  await services.prisma.event.delete({ where: { id: eventId } });
  await deleteCover(services.uploadsDir, existing.coverFilename);
}

export async function listCreatedEvents(services: AppServices, userId: string): Promise<EventWithMeta[]> {
  const rows = await services.prisma.event.findMany({
    where: { authorId: userId },
    orderBy: { startsAt: "desc" },
    include: eventInclude,
  });
  return rows.map((row) => revealInvite(row, true));
}

export async function listJoinedEvents(services: AppServices, userId: string): Promise<EventWithMeta[]> {
  const rows = await services.prisma.rsvp.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { event: { include: eventInclude } },
  });
  return rows.map((row) => revealInvite(row.event, row.event.authorId === userId));
}

export async function listAttendees(
  services: AppServices,
  eventId: string,
  actorId: string,
): Promise<{ id: string; displayName: string; email: string; createdAt: Date }[]> {
  const event = await services.prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(404, "not_found", "Подію не знайдено");
  if (event.authorId !== actorId) {
    throw new AppError(403, "forbidden", "Список учасників бачить лише автор");
  }
  const rsvps = await services.prisma.rsvp.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, displayName: true, email: true } } },
  });
  return rsvps.map((row) => ({
    id: row.user.id,
    displayName: row.user.displayName,
    email: row.user.email,
    createdAt: row.createdAt,
  }));
}
