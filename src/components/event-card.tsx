import Link from "next/link";
import { formatKyivRelative, formatKyivTime } from "@/lib/datetime";
import { coverGradient } from "@/lib/uk";
import { eventHref } from "@/server/access";
import { SeatMeter } from "@/components/seat-meter";
import type { EventWithMeta } from "@/server/events";

export function EventCard({
  event,
  nowMs,
  badge,
}: {
  event: EventWithMeta;
  nowMs: number;
  badge?: "host" | "going" | null;
}) {
  const taken = event._count.rsvps;
  const remaining = Math.max(0, event.capacity - taken);
  const past = event.startsAt.getTime() <= nowMs;
  const href = eventHref(event);
  const now = new Date(nowMs);

  return (
    <article className="group h-full overflow-hidden rounded-3xl border border-line bg-cream shadow-(--shadow) transition hover:-translate-y-0.5 hover:border-ember/40">
      <Link href={href} className="flex h-full flex-col focus-visible:outline-offset-0">
        <div
          className="relative aspect-16/10 overflow-hidden"
          style={
            event.coverFilename
              ? undefined
              : { background: coverGradient(event.id + event.title) }
          }
        >
          {event.coverFilename ? (
            // User-uploaded covers are served from a locked-down route.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/covers/${event.coverFilename}`}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0" aria-hidden />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            {event.isPublic ? "Публічна" : "Приватна"}
          </span>
          {past ? (
            <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-semibold text-cream">
              Минула
            </span>
          ) : badge === "going" ? (
            <span className="absolute right-3 top-3 rounded-full bg-pine px-3 py-1 text-xs font-semibold text-cream">
              Ви йдете
            </span>
          ) : badge === "host" ? (
            <span className="absolute right-3 top-3 rounded-full bg-ember px-3 py-1 text-xs font-semibold text-cream">
              Ваша
            </span>
          ) : remaining <= 0 ? (
            <span className="absolute right-3 top-3 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-danger">
              Місць немає
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col space-y-3 p-5">
          <p className="text-sm font-medium text-ember">
            <time dateTime={event.startsAt.toISOString()}>
              {formatKyivRelative(event.startsAt, now)} · {formatKyivTime(event.startsAt)}
            </time>
            <span className="text-muted"> · Київ</span>
          </p>
          <h2 className="display text-2xl leading-tight">{event.title}</h2>
          <p className="line-clamp-2 flex-1 text-sm text-muted">{event.description}</p>
          <SeatMeter taken={taken} capacity={event.capacity} />
          <p className="truncate text-sm text-muted">{event.author.displayName}</p>
        </div>
      </Link>
    </article>
  );
}
