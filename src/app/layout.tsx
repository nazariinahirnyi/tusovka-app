import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { currentUser } from "@/server/current-user";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Тусовка",
    template: "%s · Тусовка",
  },
  description: "Збирайся на події з обмеженою кількістю місць.",
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await currentUser();
  return (
    <html lang="uk" className={`${manrope.variable} ${unbounded.variable} h-full`}>
      <body className="grain flex min-h-full flex-col antialiased">
        <Header user={user} />
        <div id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
