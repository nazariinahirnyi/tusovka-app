import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EventForm } from "@/components/event-form";
import { toKyivInputValue } from "@/lib/datetime";
import { currentUser } from "@/server/current-user";
import { getServices } from "@/server/db";

export const metadata: Metadata = { title: "Нова подія" };

export default async function NewEventPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/events/new");
  const services = await getServices();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p>
        <Link href="/" className="text-sm font-medium text-ember hover:underline">
          ← Усі події
        </Link>
      </p>
      <div>
        <h1 className="display text-4xl">Нова подія</h1>
        <p className="mt-2 text-muted">
          Назва, час за Києвом, місця й обкладинка. Приватну друзі побачать лише за лінком — воно зʼявиться одразу після публікації.
        </p>
      </div>
      <div className="rounded-3xl border border-line bg-cream p-6 sm:p-8">
        <EventForm minStartsAt={toKyivInputValue(services.now())} />
      </div>
    </div>
  );
}
