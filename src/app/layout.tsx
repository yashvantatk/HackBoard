import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hackboard — Voice-First War Room for Multi-Hackathon Sprinters",
  description: "Hold your Wispr key and ramble. Hackboard extracts hackathons, deadlines in IST, live countdowns, task estimates, Kanban, and Mermaid Gantt timeline. 100% local-first with zero API keys.",
  keywords: ["hackathon", "war room", "wispr flow", "voice-first", "kanban", "mermaid gantt", "deadlines", "nextjs", "local-first"],
  authors: [{ name: "Hackboard Team" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Hackboard — Voice-First Hackathon War Room",
    description: "Voice-driven deadline tracking and task war room for multi-hackathon sprinters. 100% local-first with zero API keys.",
    type: "website",
    locale: "en_US",
    siteName: "Hackboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hackboard — Voice-First Hackathon War Room",
    description: "Voice-driven deadline tracking and task war room for multi-hackathon sprinters.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
