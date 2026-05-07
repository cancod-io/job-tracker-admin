import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Open_Sans } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthProvider } from "@/providers/auth-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["500", "600", "700"],
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Shopify Job Tracker",
  description: "Professional dashboard for tracking remote Shopify opportunities.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${openSans.variable} min-h-screen bg-background antialiased`}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="relative min-h-screen">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary/[0.07] to-transparent md:h-64"
            aria-hidden
          />
          <div className="relative flex min-h-screen flex-col">
            <AuthProvider>
              <SiteHeader />
              {children}
            </AuthProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
