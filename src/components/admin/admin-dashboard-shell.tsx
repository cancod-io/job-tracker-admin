"use client";

import { useState, type ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopBar } from "@/components/admin/admin-top-bar";

export function AdminDashboardShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col bg-background md:flex-row">
      <div
        className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_45%)]"
        aria-hidden
      />
      <AdminSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <AdminTopBar onMenuClick={() => setMobileNavOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 scroll-mt-0 outline-none focus:outline-none md:px-6 md:pb-8 md:pt-3"
        >
          <div className="mx-auto max-w-[1200px] px-3 py-4 sm:px-0 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
