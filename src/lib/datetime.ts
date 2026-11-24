const KYIV = "Europe/Kyiv";

function tzParts(utcMs: number, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of formatter.formatToParts(new Date(utcMs))) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  const hour = map.hour === "24" ? 0 : Number(map.hour);
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function tzOffsetMs(utcMs: number, timeZone: string): number {
  const parts = tzParts(utcMs, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - utcMs;
}

export function parseKyivDateTime(local: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!match) {
    throw new Error("invalid_date");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    throw new Error("invalid_date");
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const utc = utcGuess - tzOffsetMs(utcGuess, KYIV);
  const check = tzParts(utc, KYIV);
  if (
    check.year !== year ||
    check.month !== month ||
    check.day !== day ||
    check.hour !== hour ||
    check.minute !== minute
  ) {
    throw new Error("invalid_date");
  }
  return new Date(utc);
}

export function toKyivInputValue(date: Date): string {
  const parts = tzParts(date.getTime(), KYIV);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function formatKyivDate(date: Date): string {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: KYIV,
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatKyivTime(date: Date): string {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: KYIV,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatKyivDateTime(date: Date): string {
  return `${formatKyivDate(date)}, ${formatKyivTime(date)}`;
}

function kyivDayNumber(date: Date): number {
  const parts = tzParts(date.getTime(), KYIV);
  return Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000;
}

export function formatKyivRelative(date: Date, now: Date): string {
  const diff = kyivDayNumber(date) - kyivDayNumber(now);
  if (diff === 0) return "сьогодні";
  if (diff === 1) return "завтра";
  if (diff === -1) return "учора";
  if (diff > 1 && diff < 7) return `через ${diff} дн.`;
  if (diff < -1 && diff > -7) return `${Math.abs(diff)} дн. тому`;
  return formatKyivDate(date);
}

export const KYIV_TIME_ZONE = KYIV;
