import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser, publicUser } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n/server";
import Nav from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getTranslations();
  return {
    title: dict.meta.title,
    description: dict.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, { locale, dict }] = await Promise.all([
    getCurrentUser(),
    getTranslations(),
  ]);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav
          user={user ? publicUser(user) : null}
          locale={locale}
          labels={dict.nav}
          languageLabel={dict.common.language}
        />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
