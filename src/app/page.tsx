import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { HowItWorks } from "@/components/how-it-works";
import { SearchForm } from "@/components/search-form";
import { currentUser } from "@/server/current-user";
import { getServices } from "@/server/db";
import { listPublicUpcoming } from "@/server/events";
import { listJoinedEventIds } from "@/server/rsvp";
import { searchQuerySchema } from "@/server/validation";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const raw = typeof params.q === "string" ? params.q : "";
  const parsed = searchQuerySchema.safeParse(raw);
  const q = parsed.success ? parsed.data : "";
  const services = await getServices();
  const user = await currentUser();
  const [events, joinedIds] = await Promise.all([
    listPublicUpcoming(services, q),
    user ? listJoinedEventIds(services, user.id) : Promise.resolve([] as string[]),
  ]);
  const nowMs = services.now().getTime();
  const joined = new Set(joinedIds);

  return (
    <div className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">Київ і далі</p>
          <h1 className="display text-4xl leading-[0.95] sm:text-6xl">
            Збирайся.
            <br />
            Бувай.
            <br />
            Туси.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Події з обмеженою кількістю місць. Публічні — на головній. Приватні — лише за посиланням.
            Одна кнопка «Іду», і місце ваше.
          </p>
        </div>
        <div className="space-y-4 rounded-3xl border border-line bg-cream/80 p-5">
          <SearchForm defaultValue={q} />
          <p className="text-sm text-muted">Пошук не показує приватні тусовки. Регістр і «і/ї» не важливі.</p>
        </div>
      </section>

      {!q ? <HowItWorks /> : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-2xl">
            {q ? `Знайдено за «${q}»` : "Найближчі публічні події"}
          </h2>
          {user ? (
            <Link href="/events/new" className="text-sm font-medium text-ember hover:underline">
              Створити подію
            </Link>
          ) : (
            <Link href="/login?next=/events/new" className="text-sm font-medium text-ember hover:underline">
              Увійти, щоб створити
            </Link>
          )}
        </div>
        {events.length === 0 ? (
          <EmptyState
            title={q ? "Нічого не знайшли" : "Поки тихо"}
            text={
              q
                ? "Спробуйте іншу назву. Приватні події в пошуку не показуємо."
                : "Ще немає майбутніх публічних подій. Створіть першу тусовку — це займе хвилину."
            }
            action={
              user ? (
                <Link
                  href="/events/new"
                  className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-2.5 font-medium text-cream"
                >
                  Створити подію
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-2.5 font-medium text-cream"
                >
                  Зареєструватися
                </Link>
              )
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                nowMs={nowMs}
                badge={
                  user?.id === event.authorId ? "host" : joined.has(event.id) ? "going" : null
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
