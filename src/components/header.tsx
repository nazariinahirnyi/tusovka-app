import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import type { PublicUser } from "@/server/auth";

export function Header({ user }: { user: PublicUser | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-sand/85 backdrop-blur-md">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-cream focus:px-3 focus:py-2"
      >
        Перейти до змісту
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 rounded-xl">
          <Logo />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm font-medium">
          <Link className="rounded-full px-3 py-2 text-ink/80 hover:bg-cream hover:text-ink" href="/">
            Події
          </Link>
          {user ? (
            <>
              <Link
                className="rounded-full px-3 py-2 text-ink/80 hover:bg-cream hover:text-ink"
                href="/events/new"
              >
                Створити
              </Link>
              <Link
                className="rounded-full px-3 py-2 text-ink/80 hover:bg-cream hover:text-ink"
                href="/profile"
              >
                Профіль
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-2 text-ink/80 hover:bg-cream hover:text-ink"
                >
                  Вийти
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="rounded-full px-3 py-2 text-ink/80 hover:bg-cream" href="/login">
                Увійти
              </Link>
              <Link
                className="rounded-full bg-ink px-4 py-2 text-cream hover:bg-ember"
                href="/register"
              >
                Реєстрація
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
