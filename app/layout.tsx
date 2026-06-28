import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers/Providers";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: '%s | SoundWave',
    default: 'SoundWave - Your Personal Web Music Player',
  },
  description: 'A modern, high-performance web music player built with Next.js.',
  keywords: ['music', 'player', 'youtube', 'streaming', 'audio', 'nextjs'],
  authors: [{ name: 'Antigravity' }],
  creator: 'Antigravity',
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SoundWave",
    title: "SoundWave — Your Music, Your Way",
    description: "Stream your favorite music with SoundWave.",
  },
  robots: {
    index: false, // Private app — no indexing
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", inter.variable, "font-sans", geist.variable)}>
      <body className="h-full bg-background text-foreground font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
