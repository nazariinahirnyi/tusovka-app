import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { currentUser } from "@/server/current-user";
import { assertSafeReturnPath } from "@/server/origin";

export const metadata: Metadata = { title: "Реєстрація" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = assertSafeReturnPath(typeof params.next === "string" ? params.next : "/");
  if (await currentUser()) redirect(nextPath);
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-line bg-cream p-8 shadow-(--shadow)">
      <h1 className="display text-3xl">Реєстрація</h1>
      <p className="mt-2 mb-6 text-muted">Створіть акаунт, щоб збирати людей і ходити на події.</p>
      <RegisterForm nextPath={nextPath} />
    </div>
  );
}
