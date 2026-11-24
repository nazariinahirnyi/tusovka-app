import { describe, expect, it } from "vitest";
import { addComment, listComments } from "@/server/comments";
import { createEvent, deleteEvent, getEventForViewer, listAttendees, listPublicUpcoming, updateEvent } from "@/server/events";
import { cancelRsvp, joinEvent } from "@/server/rsvp";
import { detectImageType } from "@/server/uploads";
import { assertSameOrigin } from "@/server/origin";
import { AppError } from "@/server/errors";
import { makeWorld, user } from "./helpers";

const future = "2026-12-01T18:00";
const past = "2026-01-01T18:00";

describe("events, privacy, rsvp", () => {
  it("hides private events from home, search, and ID guessing", async () => {
    const world = await makeWorld();
    try {
      const anna = await user(world.services, "Анна", "anna@example.com");
      const borys = await user(world.services, "Борис", "borys@example.com");
      const pub = await createEvent(world.services, anna.id, {
        title: "Відкритий концерт",
        description: "Усі запрошені",
        startsAt: future,
        capacity: 10,
        isPublic: true,
      });
      const priv = await createEvent(world.services, anna.id, {
        title: "Таємна вечеря",
        description: "Тільки свої",
        startsAt: future,
        capacity: 4,
        isPublic: false,
      });

      const home = await listPublicUpcoming(world.services);
      expect(home.map((e) => e.id)).toContain(pub.id);
      expect(home.map((e) => e.id)).not.toContain(priv.id);

      const search = await listPublicUpcoming(world.services, "ТАЄМНА");
      expect(search).toHaveLength(0);
      const publicSearch = await listPublicUpcoming(world.services, "концерт");
      expect(publicSearch.map((e) => e.id)).toContain(pub.id);

      await expect(getEventForViewer(world.services, priv.id, borys.id)).rejects.toMatchObject({
        status: 404,
      });
      const viaInvite = await getEventForViewer(world.services, priv.id, borys.id, priv.inviteToken);
      expect(viaInvite.id).toBe(priv.id);
      const asAuthor = await getEventForViewer(world.services, priv.id, anna.id);
      expect(asAuthor.id).toBe(priv.id);
    } finally {
      await world.close();
    }
  });

  it("rejects non-author edit/delete and attendee list", async () => {
    const world = await makeWorld();
    try {
      const author = await user(world.services, "Катя", "katya@example.com");
      const other = await user(world.services, "Петро", "petro@example.com");
      const event = await createEvent(world.services, author.id, {
        title: "Кіновечір",
        description: "Олдскул",
        startsAt: future,
        capacity: 12,
        isPublic: true,
      });
      await expect(
        updateEvent(world.services, event.id, other.id, {
          title: "Зламано",
          description: "ні",
          startsAt: future,
          capacity: 12,
          isPublic: true,
        }),
      ).rejects.toMatchObject({ status: 403 });
      await expect(deleteEvent(world.services, event.id, other.id)).rejects.toMatchObject({
        status: 403,
      });
      await expect(listAttendees(world.services, event.id, other.id)).rejects.toMatchObject({
        status: 403,
      });
      await joinEvent(world.services, event.id, other.id);
      const people = await listAttendees(world.services, event.id, author.id);
      expect(people.some((p) => p.email === "petro@example.com")).toBe(true);
    } finally {
      await world.close();
    }
  });

  it("rejects mass assignment of authorId", async () => {
    const world = await makeWorld();
    try {
      const a = await user(world.services, "Аня", "anya2@example.com");
      const b = await user(world.services, "Богдан", "bogdan@example.com");
      await expect(
        createEvent(world.services, a.id, {
          title: "Хакатон",
          description: "ні",
          startsAt: future,
          capacity: 5,
          isPublic: true,
          authorId: b.id,
        }),
      ).rejects.toBeInstanceOf(AppError);
    } finally {
      await world.close();
    }
  });

  it("stores XSS payloads as plain text comments", async () => {
    const world = await makeWorld();
    try {
      const author = await user(world.services, "Олег", "oleh@example.com");
      const event = await createEvent(world.services, author.id, {
        title: "<script>alert(1)</script> Вечірка",
        description: "ok",
        startsAt: future,
        capacity: 5,
        isPublic: true,
      });
      const payload = `<script>alert('xss')</script>`;
      await addComment(world.services, event.id, author.id, { body: payload });
      const comments = await listComments(world.services, event.id);
      expect(comments[0]?.body).toBe(payload);
    } finally {
      await world.close();
    }
  });

  it("counts seats on join and cancel; rejects past events", async () => {
    const world = await makeWorld();
    try {
      const host = await user(world.services, "Ліза", "liza@example.com");
      const guest = await user(world.services, "Тарас", "taras@example.com");
      const event = await createEvent(world.services, host.id, {
        title: "Настілки",
        description: "Катан",
        startsAt: future,
        capacity: 2,
        isPublic: true,
      });
      await joinEvent(world.services, event.id, host.id);
      await joinEvent(world.services, event.id, guest.id);
      let viewed = await getEventForViewer(world.services, event.id, host.id);
      expect(viewed._count.rsvps).toBe(2);
      await cancelRsvp(world.services, event.id, guest.id);
      viewed = await getEventForViewer(world.services, event.id, host.id);
      expect(viewed._count.rsvps).toBe(1);

      await expect(
        createEvent(world.services, host.id, {
          title: "Минула",
          description: "ні",
          startsAt: past,
          capacity: 3,
          isPublic: true,
        }),
      ).rejects.toMatchObject({ code: "past_event" });
    } finally {
      await world.close();
    }
  });

  it("does not overbook the last seat under concurrency", async () => {
    const world = await makeWorld();
    try {
      const host = await user(world.services, "Хост", "host@example.com");
      const event = await createEvent(world.services, host.id, {
        title: "Останнє місце",
        description: "гонка",
        startsAt: future,
        capacity: 3,
        isPublic: true,
      });
      const guests = await Promise.all(
        Array.from({ length: 12 }, (_, i) => user(world.services, `Гість${i}`, `guest${i}@example.com`)),
      );
      const results = await Promise.allSettled(
        guests.map((g) => joinEvent(world.services, event.id, g.id)),
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const full = results.filter(
        (r) => r.status === "rejected" && r.reason instanceof AppError && r.reason.code === "full",
      ).length;
      expect(ok).toBe(3);
      expect(full).toBe(9);
      const viewed = await getEventForViewer(world.services, event.id, host.id);
      expect(viewed._count.rsvps).toBe(3);
    } finally {
      await world.close();
    }
  });
});

describe("uploads and csrf origin", () => {
  it("rejects SVG and HTML by magic bytes", () => {
    expect(detectImageType(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(detectImageType(Buffer.from("<html><body>hi</body></html>"))).toBeNull();
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(detectImageType(png)).toBe("png");
  });

  it("rejects cross-origin mutations", () => {
    expect(() =>
      assertSameOrigin({
        origin: "https://evil.test",
        host: "localhost:3000",
      }),
    ).toThrow(AppError);
    expect(() =>
      assertSameOrigin({
        origin: "http://localhost:3000",
        host: "localhost:3000",
      }),
    ).not.toThrow();
  });
});
