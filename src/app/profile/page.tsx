import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { currentUser } from "@/server/current-user";
import { getServices } from "@/server/db";
import { listCreatedEvents, listJoinedEvents } from "@/server/events";
import type { EventWithMeta } from "@/server/events";

export const metadata: Metadata = {
  title: "Профіль",
  robots: { index: false, follow: false },
};

function splitByTime(events: EventWithMeta[], nowMs: number) {
  const upcoming = events.filter((event) => event.startsAt.getTime() > nowMs);
  const past = events.filter((event) => event.startsAt.getTime() <= nowMs);
  upcoming.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  past.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
  return [...upcoming, ...past];
}

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/profile");
  const services = await getServices();
  const nowMs = services.now().getTime();
  const [created, joined] = await Promise.all([
    listCreatedEvents(services, user.id),
    listJoinedEvents(services, user.id),
  ]);
  const createdSorted = splitByTime(created, nowMs);
  const joinedSorted = splitByTime(
    joined.filter((event) => event.authorId !== user.id),
    nowMs,
  );

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-line bg-cream p-6 sm:p-8">
        <p className="text-sm uppercase tracking-widest text-ember">Мій профіль</p>
        <h1 className="display mt-2 text-4xl">{user.displayName}</h1>
        <p className="mt-1 text-muted">{user.email}</p>
        <p className="mt-4 text-sm text-muted">
          Створено {created.length} · записано {joined.length}
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="display text-2xl">Події, які я створив</h2>
          <Link href="/events/new" className="text-sm font-medium text-ember hover:underline">
            Нова подія
          </Link>
        </div>
        {createdSorted.length === 0 ? (
          <EmptyState
            title="Ще немає створених подій"
            text="Зберіть людей на вечір, лекцію чи просто каву. Приватну можна сховати за посиланням."
            action={
              <Link href="/events/new" className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-2.5 font-medium text-cream">
                Створити подію
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {createdSorted.map((event) => (
              <EventCard key={event.id} event={event} nowMs={nowMs} badge="host" />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="display text-2xl">Події, на які я записався</h2>
        {joinedSorted.length === 0 ? (
          <EmptyState
            title="Ви ще нікуди не йдете"
            text="Відкрийте головну, оберіть подію й натисніть «Іду». Місце зникне з лічильника одразу."
            action={
              <Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-2.5 font-medium text-cream">
                Знайти подію
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {joinedSorted.map((event) => (
              <EventCard key={event.id} event={event} nowMs={nowMs} badge="going" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
