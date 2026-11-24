type Bucket = {
  count: number;
  resetAt: number;
};

export class MemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly now: () => number = Date.now) {}

  consume(key: string, limit: number, windowMs: number): boolean {
    const now = this.now();
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (current.count >= limit) {
      return false;
    }
    current.count += 1;
    return true;
  }

  remainingLockMs(key: string): number {
    const current = this.buckets.get(key);
    if (!current) return 0;
    return Math.max(0, current.resetAt - this.now());
  }

  reset(): void {
    this.buckets.clear();
  }
}

export const LOGIN_LIMIT = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_IP_LIMIT = 20;
export const REGISTER_LIMIT = 8;
export const REGISTER_WINDOW_MS = 60 * 60 * 1000;
export const COMMENT_LIMIT = 10;
export const COMMENT_WINDOW_MS = 60 * 1000;
export const RSVP_LIMIT = 30;
export const RSVP_WINDOW_MS = 60 * 1000;
