export function seatsWord(n: number): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return "місце";
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return "місця";
  return "місць";
}

export function seatsLeftLabel(n: number): string {
  if (n <= 0) return "Місць немає";
  return `Залишилось ${n} ${seatsWord(n)}`;
}

export function peopleWord(n: number): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return "учасник";
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return "учасники";
  return "учасників";
}

export function coverGradient(seed: string): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const a = Math.abs(hash) % 360;
  const b = Math.abs(hash * 7) % 360;
  return `linear-gradient(135deg, hsl(${a} 42% 32%), hsl(${b} 38% 16%))`;
}
