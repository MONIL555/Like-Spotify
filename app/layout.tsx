import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers/Providers";
import Script from "next/script";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: '%s | SpotTunes',
    default: 'SpotTunes - Your Personal Web Music Player',
  },
  manifest: "/manifest.json",
  description: 'A modern, high-performance web music player built with Next.js.',
  keywords: ['music', 'player', 'youtube', 'streaming', 'audio', 'nextjs'],
  authors: [{ name: 'Antigravity' }],
  creator: 'Antigravity',
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SpotTunes",
    title: "SpotTunes — Your Music, Your Way",
    description: "Stream your favorite music with SpotTunes.",
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
    <html lang="en" className={cn("dark h-[100dvh] w-full overflow-hidden", inter.variable, "font-sans", geist.variable)}>
      <body className="h-[100dvh] w-full overflow-hidden bg-background text-foreground font-sans antialiased">
        <Providers>
          {children}
        </Providers>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('Service Worker registration successful with scope: ', registration.scope);
                  },
                  function(err) {
                    console.log('Service Worker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
