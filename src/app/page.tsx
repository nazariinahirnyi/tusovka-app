import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { SearchForm } from "@/components/search-form";
import { currentUser } from "@/server/current-user";
import { getServices } from "@/server/db";
import { listPublicUpcoming } from "@/server/events";
import { searchQuerySchema } from "@/server/validation";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const raw = typeof params.q === "string" ? params.q : "";
  const parsed = searchQuerySchema.safeParse(raw);
  const q = parsed.success ? parsed.data : "";
  const services = await getServices();
  const user = await currentUser();
  const events = await listPublicUpcoming(services, q);
  const nowMs = services.now().getTime();

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">Київ і далі</p>
          <h1 className="display text-4xl leading-none sm:text-6xl">
            Збирайся.
            <br />
            Бувай.
            <br />
            Туси.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Тусовка — це події з обмеженою кількістю місць. Публічні вечори на головній,
            приватні — лише за посиланням.
          </p>
        </div>
        <SearchForm defaultValue={q} />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="display text-2xl">
            {q ? `Знайдено за «${q}»` : "Найближчі публічні події"}
          </h2>
          {user ? (
            <Link href="/events/new" className="text-sm font-medium text-ember hover:underline">
              Створити подію
            </Link>
          ) : null}
        </div>
        {events.length === 0 ? (
          <EmptyState
            title={q ? "Нічого не знайшли" : "Поки тихо"}
            text={
              q
                ? "Спробуйте іншу назву. Приватні події в пошуку не показуємо."
                : "Ще немає майбутніх публічних подій. Створіть першу тусовку."
            }
            action={
              user ? (
                <Link
                  href="/events/new"
                  className="inline-flex rounded-full bg-ink px-5 py-2.5 font-medium text-cream"
                >
                  Створити подію
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex rounded-full bg-ink px-5 py-2.5 font-medium text-cream"
                >
                  Зареєструватися
                </Link>
              )
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} nowMs={nowMs} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
