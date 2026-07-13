import type { Metadata } from "next";
import { UnregisterSW } from "@/components/UnregisterSW";
import "./globals.css";

export const metadata: Metadata = {
  title: 'SpotTunes (Rebuild)',
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <UnregisterSW />
        {children}
      </body>
    </html>
  );
}
