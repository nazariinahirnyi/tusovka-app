import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetail } from "@/components/event-detail";
import { listComments } from "@/server/comments";
import { currentUser } from "@/server/current-user";
import { getServices } from "@/server/db";
import { isAppError } from "@/server/errors";
import { getEventForViewer, listAttendees } from "@/server/events";
import { hasJoined } from "@/server/rsvp";

async function loadEvent(id: string, userId: string | null) {
  try {
    const services = await getServices();
    return await getEventForViewer(services, id, userId);
  } catch (error) {
    if (isAppError(error) && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await currentUser();
  const event = await loadEvent(id, user?.id ?? null);
  return {
    title: event.title,
    robots: event.isPublic ? undefined : { index: false, follow: false },
  };
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const services = await getServices();
  const user = await currentUser();
  const event = await loadEvent(id, user?.id ?? null);
  const [comments, joined, attendees] = await Promise.all([
    listComments(services, event.id, user?.id ?? null),
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
      nowMs={services.now().getTime()}
    />
  );
}
