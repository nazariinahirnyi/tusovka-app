import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EventForm } from "@/components/event-form";
import { currentUser } from "@/server/current-user";

export const metadata: Metadata = { title: "Нова подія" };

export default async function NewEventPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/events/new");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="display text-4xl">Нова подія</h1>
        <p className="mt-2 text-muted">Назва, час, місця й обкладинка. Приватну подію друзі побачать лише за лінком.</p>
      </div>
      <div className="rounded-3xl border border-line bg-cream p-6 sm:p-8">
        <EventForm />
      </div>
    </div>
  );
}
