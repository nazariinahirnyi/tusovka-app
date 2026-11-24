import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";
import { currentUser } from "@/server/current-user";
import { assertSafeReturnPath } from "@/server/origin";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Увійти" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = assertSafeReturnPath(typeof params.next === "string" ? params.next : "/");
  if (await currentUser()) redirect(nextPath);
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-line bg-cream p-8 shadow-(--shadow)">
      <h1 className="display text-3xl">Увійти</h1>
      <p className="mt-2 mb-6 text-muted">Раді знову бачити. Час на тусовку.</p>
      <LoginForm nextPath={nextPath} />
    </div>
  );
}
