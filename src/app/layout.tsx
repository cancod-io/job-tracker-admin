import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { themeInlineScript } from "@/lib/theme";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Admin · TrackCod",
    template: "%s · Admin",
  },
  description: "Manage scraped jobs, users, and application data.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInlineScript() }} />
      </head>
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <div className="relative min-h-screen">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary/[0.07] to-transparent md:h-64"
                aria-hidden
              />
              <div className="relative">{children}</div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
