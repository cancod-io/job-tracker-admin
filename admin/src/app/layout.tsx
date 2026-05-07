import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Open_Sans } from "next/font/google";
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
  title: {
    default: "Admin · Shopify Job Tracker",
    template: "%s · Admin",
  },
  description: "Manage scraped jobs, users, and application data.",
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
        <AuthProvider>
          <div className="relative min-h-screen">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/[0.06] to-transparent md:h-56"
              aria-hidden
            />
            <div className="relative">{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
