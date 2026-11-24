import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { currentUser } from "@/server/current-user";
import { getServices } from "@/server/db";
import { listCreatedEvents, listJoinedEvents } from "@/server/events";

export const metadata: Metadata = {
  title: "Профіль",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/profile");
  const services = await getServices();
  const nowMs = services.now().getTime();
  const [created, joined] = await Promise.all([
    listCreatedEvents(services, user.id),
    listJoinedEvents(services, user.id),
  ]);

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-line bg-cream p-6 sm:p-8">
        <p className="text-sm uppercase tracking-widest text-ember">Мій профіль</p>
        <h1 className="display mt-2 text-4xl">{user.displayName}</h1>
        <p className="mt-1 text-muted">{user.email}</p>
      </header>

      <section className="space-y-4">
        <h2 className="display text-2xl">Події, які я створив</h2>
        {created.length === 0 ? (
          <EmptyState
            title="Ще немає створених подій"
            text="Зберіть людей на вечір, лекцію чи просто каву."
            action={
              <Link href="/events/new" className="inline-flex rounded-full bg-ink px-5 py-2.5 font-medium text-cream">
                Створити подію
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {created.map((event) => (
              <EventCard key={event.id} event={event} nowMs={nowMs} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="display text-2xl">Події, на які я записався</h2>
        {joined.length === 0 ? (
          <EmptyState title="Ви ще нікуди не йдете" text="Відкрийте головну й натисніть «Іду»." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {joined.map((event) => (
              <EventCard key={event.id} event={event} nowMs={nowMs} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
