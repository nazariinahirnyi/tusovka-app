import { z } from "zod";
import { parseKyivDateTime } from "@/lib/datetime";
import { AppError } from "@/server/errors";

export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;
export const NAME_MIN = 2;
export const NAME_MAX = 40;
export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 5000;
export const COMMENT_MAX = 1000;
export const CAPACITY_MAX = 10_000;
export const SEARCH_MAX = 120;

const emailSchema = z
  .string()
  .trim()
  .min(3, "Вкажіть email")
  .max(EMAIL_MAX, "Email занадто довгий")
  .email("Некоректний email")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Пароль має містити щонайменше ${PASSWORD_MIN} символів`)
  .max(PASSWORD_MAX, "Пароль занадто довгий");

const displayNameSchema = z
  .string()
  .trim()
  .min(NAME_MIN, "Імʼя занадто коротке")
  .max(NAME_MAX, "Імʼя занадто довге")
  .refine((value) => !value.includes("\0"), "Некоректне імʼя");

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    displayName: displayNameSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Вкажіть пароль").max(PASSWORD_MAX, "Пароль занадто довгий"),
  })
  .strict();

const capacitySchema = z.coerce
  .number({ error: "Вкажіть кількість місць" })
  .int("Кількість місць має бути цілим числом")
  .min(1, "Потрібно щонайменше одне місце")
  .max(CAPACITY_MAX, "Завелика кількість місць");

function parseIsPublic(value: unknown): boolean {
  if (value === true || value === "true" || value === "on" || value === "public") return true;
  if (value === false || value === "false" || value === "private" || value === undefined) {
    return false;
  }
  throw new AppError(400, "invalid_visibility", "Некоректний тип події");
}

const startsAtSchema = z.string().trim().superRefine((value, ctx) => {
  try {
    const date = parseKyivDateTime(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Некоректна дата" });
    }
  } catch {
    ctx.addIssue({ code: "custom", message: "Некоректна дата й час" });
  }
});

export const eventInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(TITLE_MIN, "Назва занадто коротка")
      .max(TITLE_MAX, "Назва занадто довга"),
    description: z
      .string()
      .trim()
      .min(1, "Додайте опис")
      .max(DESCRIPTION_MAX, "Опис занадто довгий"),
    startsAt: startsAtSchema,
    capacity: capacitySchema,
    isPublic: z.unknown().transform(parseIsPublic),
  })
  .strict();

export const commentSchema = z
  .object({
    body: z
      .string()
      .trim()
      .min(1, "Коментар порожній")
      .max(COMMENT_MAX, "Коментар занадто довгий")
      .refine((value) => !value.includes("\0"), "Некоректний коментар"),
  })
  .strict();

export const searchQuerySchema = z
  .string()
  .trim()
  .max(SEARCH_MAX, "Запит занадто довгий");

export function normalizeTitle(title: string): string {
  return title.toLocaleLowerCase("uk-UA").replace(/\s+/g, " ").trim();
}

/** LIKE wildcards are stripped so a search for "%" cannot match every title. */
export function searchNeedle(query: string): string {
  return normalizeTitle(query).replace(/[%_\\]/g, "");
}

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  const first = result.error.issues[0]?.message ?? "Перевірте введені дані";
  throw new AppError(400, "validation", first, fieldErrors);
}

export function eventStartsAtUtc(local: string): Date {
  try {
    return parseKyivDateTime(local);
  } catch {
    throw new AppError(400, "invalid_date", "Некоректна дата й час");
  }
}
