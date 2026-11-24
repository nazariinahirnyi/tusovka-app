import type { Event, Rsvp } from "@prisma/client";
import { safeEqual } from "@/server/crypto";

export type EventAccess = {
  canView: boolean;
  canManage: boolean;
  viaInvite: boolean;
};

export function inspectEventAccess(
  event: Event & { rsvps?: Pick<Rsvp, "userId">[] },
  userId: string | null,
  inviteToken?: string | null,
): EventAccess {
  const isAuthor = Boolean(userId && userId === event.authorId);
  const viaInvite = Boolean(inviteToken && safeEqual(inviteToken, event.inviteToken));
  const joined = Boolean(userId && event.rsvps?.some((row) => row.userId === userId));
  const canView = event.isPublic || isAuthor || viaInvite || joined;
  return {
    canView,
    canManage: isAuthor,
    viaInvite,
  };
}

export function eventHref(event: Pick<Event, "id">): string {
  return `/events/${event.id}`;
}
