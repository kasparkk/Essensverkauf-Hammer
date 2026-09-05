import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser, publicUser } from "@/lib/auth";
import Nav from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarryConnect – Freier Platz im Gepäck ist ein Kurierdienst",
  description:
    "CarryConnect verbindet Reisende mit ungenutztem Gepäckplatz und Leute, die etwas transportiert oder besorgt brauchen.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav user={user ? publicUser(user) : null} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
