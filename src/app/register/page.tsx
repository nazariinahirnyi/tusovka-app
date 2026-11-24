import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { currentUser } from "@/server/current-user";

export const metadata: Metadata = { title: "Реєстрація" };

export default async function RegisterPage() {
  if (await currentUser()) redirect("/");
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-line bg-cream p-8 shadow-(--shadow)">
      <h1 className="display text-3xl">Реєстрація</h1>
      <p className="mt-2 mb-6 text-muted">Створіть акаунт, щоб збирати людей і ходити на події.</p>
      <RegisterForm />
    </div>
  );
}
