import Link from "next/link";
import { formatKyivDate, formatKyivTime } from "@/lib/datetime";
import { coverGradient, seatsLeftLabel } from "@/lib/uk";
import { eventHref } from "@/server/access";
import type { EventWithMeta } from "@/server/events";

export function EventCard({
  event,
  viewerId,
}: {
  event: EventWithMeta;
  viewerId?: string | null;
}) {
  const remaining = Math.max(0, event.capacity - event._count.rsvps);
  const href = eventHref(event, viewerId === event.authorId);
  return (
    <article className="group overflow-hidden rounded-3xl border border-line bg-cream shadow-(--shadow) transition hover:-translate-y-0.5 hover:border-ember/30">
      <Link href={href} className="block">
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
            <div className="absolute inset-0 grid place-items-center text-cream/90">
              <span className="display px-6 text-center text-2xl">{event.title}</span>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            {event.isPublic ? "Публічна" : "Приватна"}
          </span>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm font-medium text-ember">
            {formatKyivDate(event.startsAt)} · {formatKyivTime(event.startsAt)}
          </p>
          <h2 className="display text-2xl leading-tight">{event.title}</h2>
          <p className="line-clamp-2 text-sm text-muted">{event.description}</p>
          <div className="flex items-center justify-between pt-1 text-sm">
            <span>{seatsLeftLabel(remaining)}</span>
            <span className="text-muted">{event.author.displayName}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
