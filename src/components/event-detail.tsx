import Link from "next/link";
import { CommentThread } from "@/components/comment-thread";
import { CopyInvite } from "@/components/copy-invite";
import { DeleteEventButton } from "@/components/delete-event-button";
import { RsvpControls } from "@/components/rsvp-controls";
import { formatKyivDateTime } from "@/lib/datetime";
import { coverGradient, peopleWord, seatsLeftLabel } from "@/lib/uk";
import { appOrigin } from "@/server/origin";
import type { PublicUser } from "@/server/auth";
import type { EventWithMeta } from "@/server/events";

type Attendee = { id: string; displayName: string; email: string };

export function EventDetail({
  event,
  viewer,
  joined,
  comments,
  attendees,
  inviteUrl,
  nowMs,
}: {
  event: EventWithMeta;
  viewer: PublicUser | null;
  joined: boolean;
  comments: {
    id: string;
    body: string;
    createdAt: Date;
    user: { id: string; displayName: string };
  }[];
  attendees: Attendee[] | null;
  inviteUrl?: string;
  nowMs: number;
}) {
  const remaining = Math.max(0, event.capacity - event._count.rsvps);
  const past = event.startsAt.getTime() <= nowMs;
  const isAuthor = viewer?.id === event.authorId;
  const origin = appOrigin();

  return (
    <article className="space-y-8">
      <div
        className="overflow-hidden rounded-3xl border border-line"
        style={event.coverFilename ? undefined : { background: coverGradient(event.id) }}
      >
        {event.coverFilename ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/covers/${event.coverFilename}`}
            alt=""
            className="max-h-[420px] w-full object-cover"
          />
        ) : (
          <div className="grid min-h-56 place-items-center px-6 py-16 text-cream">
            <h1 className="display text-center text-4xl">{event.title}</h1>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-ember">
            {event.isPublic ? "Публічна подія" : "Приватна подія"}
          </p>
          <h1 className="display text-4xl sm:text-5xl">{event.title}</h1>
          <p className="text-lg">{formatKyivDateTime(event.startsAt)} · Київ</p>
          <p className="whitespace-pre-wrap text-[17px] leading-7">{event.description}</p>
          <p className="text-sm text-muted">Організовує {event.author.displayName}</p>
        </div>
        <aside className="h-fit space-y-4 rounded-3xl border border-line bg-cream p-5">
          <p className="display text-3xl">{seatsLeftLabel(remaining)}</p>
          <p className="text-sm text-muted">
            {event._count.rsvps} {peopleWord(event._count.rsvps)} з {event.capacity}
          </p>
          {viewer ? (
            <RsvpControls
              eventId={event.id}
              inviteToken={inviteUrl ? event.inviteToken : null}
              joined={joined}
              remaining={remaining}
              past={past}
            />
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(inviteUrl ? `/i/${event.inviteToken}` : `/events/${event.id}`)}`}
              className="inline-flex rounded-full bg-ember px-5 py-3 font-medium text-cream"
            >
              Увійти, щоб записатися
            </Link>
          )}
          {isAuthor ? (
            <div className="space-y-3 border-t border-line pt-4">
              <p className="text-sm font-medium">Керування</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/events/${event.id}/edit`}
                  className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream"
                >
                  Редагувати
                </Link>
                <DeleteEventButton eventId={event.id} title={event.title} />
              </div>
              <CopyInvite url={`${origin}/i/${event.inviteToken}`} />
            </div>
          ) : null}
        </aside>
      </div>

      {isAuthor && attendees ? (
        <section className="rounded-3xl border border-line bg-cream p-5">
          <h2 className="display text-2xl">Учасники</h2>
          {attendees.length === 0 ? (
            <p className="mt-2 text-muted">Поки ніхто не записався.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {attendees.map((person) => (
                <li key={person.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                  <span className="font-medium">{person.displayName}</span>
                  <span className="text-muted">{person.email}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <CommentThread
        eventId={event.id}
        inviteToken={inviteUrl ? event.inviteToken : null}
        comments={comments}
        canComment={Boolean(viewer)}
      />
    </article>
  );
}
