import { inspectEventAccess } from "@/server/access";
import { newId } from "@/server/crypto";
import type { AppServices } from "@/server/db";
import { AppError } from "@/server/errors";
import { COMMENT_LIMIT, COMMENT_WINDOW_MS } from "@/server/rate-limit";
import { commentSchema, parseOrThrow } from "@/server/validation";

export async function listComments(
  services: AppServices,
  eventId: string,
  userId: string | null = null,
  inviteToken?: string | null,
) {
  const event = await services.prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: { select: { userId: true } } },
  });
  if (!event) throw new AppError(404, "not_found", "Подію не знайдено");
  if (!inspectEventAccess(event, userId, inviteToken).canView) {
    throw new AppError(404, "not_found", "Подію не знайдено");
  }
  return services.prisma.comment.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, displayName: true } } },
    take: 200,
  });
}

export async function addComment(
  services: AppServices,
  eventId: string,
  userId: string,
  input: unknown,
  inviteToken?: string | null,
) {
  if (!services.limiter.consume(`comment:${userId}`, COMMENT_LIMIT, COMMENT_WINDOW_MS)) {
    throw new AppError(429, "rate_limited", "Забагато коментарів. Зачекайте хвилину.");
  }
  const data = parseOrThrow(commentSchema, input);
  const event = await services.prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: { select: { userId: true } } },
  });
  if (!event) throw new AppError(404, "not_found", "Подію не знайдено");
  const access = inspectEventAccess(event, userId, inviteToken);
  if (!access.canView) {
    throw new AppError(404, "not_found", "Подію не знайдено");
  }
  return services.prisma.comment.create({
    data: {
      id: newId(),
      eventId,
      userId,
      body: data.body,
    },
    include: { user: { select: { id: true, displayName: true } } },
  });
}
