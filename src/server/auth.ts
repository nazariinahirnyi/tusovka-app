import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { newId, newSessionToken, sha256 } from "@/server/crypto";
import type { AppServices } from "@/server/db";
import { AppError } from "@/server/errors";
import { dummyVerify, hashPassword, verifyPassword } from "@/server/passwords";
import {
  LOGIN_IP_LIMIT,
  LOGIN_LIMIT,
  LOGIN_WINDOW_MS,
  REGISTER_LIMIT,
  REGISTER_WINDOW_MS,
} from "@/server/rate-limit";
import { loginSchema, parseOrThrow, registerSchema } from "@/server/validation";

const SESSION_DAYS = 14;
const GENERIC_LOGIN = "Невірний email або пароль";

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
};

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, displayName: user.displayName };
}

export async function registerUser(
  services: AppServices,
  input: unknown,
  ip: string,
): Promise<{ user: PublicUser; sessionToken: string }> {
  if (!services.limiter.consume(`register-ip:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS)) {
    throw new AppError(429, "rate_limited", "Забагато спроб. Спробуйте пізніше.");
  }

  const data = parseOrThrow(registerSchema, input);
  const passwordHash = await hashPassword(data.password);
  try {
    const user = await services.prisma.user.create({
      data: {
        id: newId(),
        email: data.email,
        passwordHash,
        displayName: data.displayName,
      },
    });
    const sessionToken = await createSession(services, user.id);
    return { user: toPublicUser(user), sessionToken };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "email_taken", "Цей email уже зареєстровано");
    }
    throw error;
  }
}

export async function loginUser(
  services: AppServices,
  input: unknown,
  ip: string,
): Promise<{ user: PublicUser; sessionToken: string }> {
  const data = parseOrThrow(loginSchema, input);
  // Per-account key does not include IP: a spoofed X-Forwarded-For must not reset it.
  const emailKey = `login-email:${data.email}`;
  const ipKey = `login-ip:${ip}`;
  if (
    !services.limiter.consume(emailKey, LOGIN_LIMIT, LOGIN_WINDOW_MS) ||
    !services.limiter.consume(ipKey, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS)
  ) {
    await dummyVerify(data.password);
    throw new AppError(429, "rate_limited", "Забагато спроб. Спробуйте пізніше.");
  }

  const user = await services.prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    await dummyVerify(data.password);
    throw new AppError(401, "invalid_credentials", GENERIC_LOGIN);
  }

  const ok = await verifyPassword(user.passwordHash, data.password);
  if (!ok) {
    throw new AppError(401, "invalid_credentials", GENERIC_LOGIN);
  }

  const sessionToken = await createSession(services, user.id);
  return { user: toPublicUser(user), sessionToken };
}

export async function createSession(services: AppServices, userId: string): Promise<string> {
  const token = newSessionToken();
  const expiresAt = new Date(services.now().getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await services.prisma.session.deleteMany({
    where: { userId, expiresAt: { lte: services.now() } },
  });
  await services.prisma.session.create({
    data: {
      id: newId(),
      userId,
      tokenHash: sha256(token),
      expiresAt,
    },
  });
  return token;
}

export async function getSessionUser(
  services: AppServices,
  token: string | null | undefined,
): Promise<PublicUser | null> {
  if (!token) return null;
  const session = await services.prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt.getTime() <= services.now().getTime()) {
    if (session) {
      await services.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }
  return toPublicUser(session.user);
}

export async function logoutUser(services: AppServices, token: string | null | undefined): Promise<void> {
  if (!token) return;
  await services.prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
}

export async function requireUser(
  services: AppServices,
  token: string | null | undefined,
): Promise<PublicUser> {
  const user = await getSessionUser(services, token);
  if (!user) {
    throw new AppError(401, "unauthenticated", "Увійдіть, щоб продовжити");
  }
  return user;
}

export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
