import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EventForm } from "@/components/event-form";
import { toKyivInputValue } from "@/lib/datetime";
import { currentUser } from "@/server/current-user";
import { getServices } from "@/server/db";
import { isAppError } from "@/server/errors";
import { getEventForViewer } from "@/server/events";

export const metadata: Metadata = { title: "Редагувати подію" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect(`/login?next=/events/${id}/edit`);
  const services = await getServices();
  let event;
  try {
    event = await getEventForViewer(services, id, user.id);
  } catch (error) {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  }
  if (event.authorId !== user.id) {
    return (
      <div className="rounded-3xl border border-line bg-cream p-8">
        <h1 className="display text-3xl">Немає доступу</h1>
        <p className="mt-2 text-muted">Редагувати подію може лише автор.</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="display text-4xl">Редагувати подію</h1>
      <div className="rounded-3xl border border-line bg-cream p-6 sm:p-8">
        <EventForm
          eventId={event.id}
          defaults={{
            title: event.title,
            description: event.description,
            startsAt: toKyivInputValue(event.startsAt),
            capacity: event.capacity,
            isPublic: event.isPublic,
            coverFilename: event.coverFilename,
          }}
        />
      </div>
    </div>
  );
}
