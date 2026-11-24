import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetail } from "@/components/event-detail";
import { listComments } from "@/server/comments";
import { currentUser } from "@/server/current-user";
import { getServices } from "@/server/db";
import { isAppError } from "@/server/errors";
import { getEventByInvite, listAttendees } from "@/server/events";
import { hasJoined } from "@/server/rsvp";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Запрошення", robots: { index: false, follow: false } };
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 16) notFound();
  const services = await getServices();
  const user = await currentUser();
  let event;
  try {
    event = await getEventByInvite(services, token, user?.id ?? null);
  } catch (error) {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  }
  const [comments, joined, attendees] = await Promise.all([
    listComments(services, event.id),
    user ? hasJoined(services, event.id, user.id) : Promise.resolve(false),
    user?.id === event.authorId ? listAttendees(services, event.id, user.id) : Promise.resolve(null),
  ]);
  return (
    <EventDetail
      event={event}
      viewer={user}
      joined={joined}
      comments={comments}
      attendees={attendees}
      inviteToken={token}
      nowMs={services.now().getTime()}
    />
  );
}
