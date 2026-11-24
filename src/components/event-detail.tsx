import Link from "next/link";
import { CommentThread } from "@/components/comment-thread";
import { CopyInvite } from "@/components/copy-invite";
import { DeleteEventButton } from "@/components/delete-event-button";
import { RsvpControls } from "@/components/rsvp-controls";
import { SeatMeter } from "@/components/seat-meter";
import { formatKyivDateTime } from "@/lib/datetime";
import { coverGradient, peopleWord } from "@/lib/uk";
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
  inviteToken,
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
  inviteToken?: string | null;
  nowMs: number;
}) {
  const remaining = Math.max(0, event.capacity - event._count.rsvps);
  const past = event.startsAt.getTime() <= nowMs;
  const isAuthor = viewer?.id === event.authorId;
  const origin = appOrigin();
  const loginNext = inviteToken ? `/i/${inviteToken}` : `/events/${event.id}`;
  const loginHref = `/login?next=${encodeURIComponent(loginNext)}`;
  const registerHref = `/register?next=${encodeURIComponent(loginNext)}`;

  return (
    <article className="space-y-8">
      <p>
        <Link href="/" className="text-sm font-medium text-ember hover:underline">
          ← Усі події
        </Link>
      </p>
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
          <div className="min-h-40 sm:min-h-52" aria-hidden />
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-ember">
            {event.isPublic ? "Публічна подія" : "Приватна подія"}
            {past ? " · уже почалася" : ""}
          </p>
          <h1 className="display text-4xl sm:text-5xl">{event.title}</h1>
          <p className="text-lg">
            <time dateTime={event.startsAt.toISOString()}>{formatKyivDateTime(event.startsAt)}</time>
            {" · Київ"}
          </p>
          <p className="whitespace-pre-wrap text-[17px] leading-7">{event.description}</p>
          <p className="text-sm text-muted">Організовує {event.author.displayName}</p>
        </div>
        <aside className="h-fit space-y-4 rounded-3xl border border-line bg-cream p-5 lg:sticky lg:top-24">
          <p className="display text-3xl leading-none">
            {remaining > 0 ? remaining : 0}
            <span className="ml-2 text-lg font-sans font-medium text-muted">вільних</span>
          </p>
          <SeatMeter taken={event._count.rsvps} capacity={event.capacity} />
          <p className="text-sm text-muted">
            {event._count.rsvps} {peopleWord(event._count.rsvps)} з {event.capacity}
          </p>
          {viewer ? (
            <>
              <RsvpControls
                eventId={event.id}
                inviteToken={inviteToken ?? null}
                joined={joined}
                remaining={remaining}
                past={past}
              />
              {isAuthor && !joined && !past ? (
                <p className="text-sm text-muted">
                  Ви організатор. Місце за вами не бронюється саме: натисніть «Іду», якщо плануєте бути.
                </p>
              ) : null}
            </>
          ) : (
            <div className="space-y-3">
              <Link
                href={loginHref}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ember px-5 py-3 font-medium text-cream hover:bg-ember-dark"
              >
                Увійти, щоб записатися
              </Link>
              <p className="text-sm text-muted">
                Немає акаунта?{" "}
                <Link className="font-medium text-ember hover:underline" href={registerHref}>
                  Зареєструйтеся
                </Link>
                {" — після цього повернемо сюди."}
              </p>
            </div>
          )}
          {isAuthor && event.inviteToken ? (
            <div className="space-y-3 border-t border-line pt-4">
              <p className="text-sm font-medium">Керування</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/events/${event.id}/edit`}
                  className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream hover:bg-ember"
                >
                  Редагувати
                </Link>
                <DeleteEventButton eventId={event.id} title={event.title} />
              </div>
              <p className="text-xs text-muted">
                {event.isPublic
                  ? "Подія на головній. Посилання теж можна надіслати друзям."
                  : "Приватна: хто без цього посилання подію не побачить."}
              </p>
              <CopyInvite url={`${origin}/i/${event.inviteToken}`} />
            </div>
          ) : null}
        </aside>
      </div>

      {isAuthor && attendees ? (
        <section className="rounded-3xl border border-line bg-cream p-5" aria-labelledby="attendees-heading">
          <h2 id="attendees-heading" className="display text-2xl">
            Учасники
          </h2>
          {attendees.length === 0 ? (
            <p className="mt-2 text-muted">Поки ніхто не записався. Поділіться запрошенням вище.</p>
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
        inviteToken={inviteToken ?? null}
        comments={comments}
        canComment={Boolean(viewer) && !past}
        loginHref={viewer ? undefined : loginHref}
        lockedReason={past ? "Коментарі закриті: подія вже почалася." : undefined}
      />
    </article>
  );
}
