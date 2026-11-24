import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { loginUser, logoutUser, getSessionUser, registerUser } from "@/server/auth";
import { AppError } from "@/server/errors";
import { CommentBody } from "@/components/comment-thread";
import { makeWorld, user } from "./helpers";

describe("auth", () => {
  it("registers, logs in, logs out and invalidates the session", async () => {
    const world = await makeWorld();
    try {
      const created = await registerUser(
        world.services,
        { email: "  Olena@Example.com ", password: "correcthorsebatterystaple", displayName: "Олена" },
        "10.0.0.1",
      );
      expect(created.user.email).toBe("olena@example.com");
      expect(await getSessionUser(world.services, created.sessionToken)).toMatchObject({
        email: "olena@example.com",
      });

      await logoutUser(world.services, created.sessionToken);
      expect(await getSessionUser(world.services, created.sessionToken)).toBeNull();

      const logged = await loginUser(
        world.services,
        { email: "olena@example.com", password: "correcthorsebatterystaple" },
        "10.0.0.1",
      );
      expect(logged.user.displayName).toBe("Олена");
      await logoutUser(world.services, logged.sessionToken);
      expect(await getSessionUser(world.services, logged.sessionToken)).toBeNull();
    } finally {
      await world.close();
    }
  });

  it("uses a generic login error and rejects short passwords", async () => {
    const world = await makeWorld();
    try {
      await user(world.services, "Максим", "maksym@example.com");
      await expect(
        loginUser(world.services, { email: "maksym@example.com", password: "wrong-password" }, "1.1.1.1"),
      ).rejects.toMatchObject({ status: 401, message: "Невірний email або пароль" });
      await expect(
        loginUser(world.services, { email: "nobody@example.com", password: "wrong-password" }, "1.1.1.1"),
      ).rejects.toMatchObject({ status: 401, message: "Невірний email або пароль" });
      await expect(
        registerUser(
          world.services,
          { email: "short@example.com", password: "short", displayName: "Короткий" },
          "1.1.1.1",
        ),
      ).rejects.toBeInstanceOf(AppError);
    } finally {
      await world.close();
    }
  });

  it("enforces unique emails", async () => {
    const world = await makeWorld();
    try {
      await user(world.services, "Аня", "anya@example.com");
      await expect(user(world.services, "Інша Аня", "anya@example.com")).rejects.toMatchObject({
        status: 409,
      });
    } finally {
      await world.close();
    }
  });

  it("rate-limits repeated logins", async () => {
    const world = await makeWorld();
    try {
      await user(world.services, "Ігор", "ihor@example.com");
      for (let i = 0; i < 5; i += 1) {
        await loginUser(
          world.services,
          { email: "ihor@example.com", password: "nope-nope-nope" },
          "9.9.9.9",
        ).catch(() => undefined);
      }
      await expect(
        loginUser(world.services, { email: "ihor@example.com", password: "nope-nope-nope" }, "9.9.9.9"),
      ).rejects.toMatchObject({ status: 429 });
    } finally {
      await world.close();
    }
  });
});

describe("xss rendering", () => {
  it("renders comment HTML as text, not as a script", () => {
    const payload = `<script>alert('xss')</script><img src=x onerror=alert(1)>`;
    const html = renderToStaticMarkup(createElement(CommentBody, { body: payload }));
    expect(html).not.toMatch(/<script>/i);
    expect(html).not.toMatch(/<img [^>]*onerror=/i);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("alert(&#x27;xss&#x27;)");
  });
});
