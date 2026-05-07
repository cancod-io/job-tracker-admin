"use client";

import { useState, type ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopBar } from "@/components/admin/admin-top-bar";

export function AdminDashboardShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <AdminSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar onMenuClick={() => setMobileNavOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 scroll-mt-0 outline-none focus:outline-none md:px-5 md:pb-8 md:pt-2"
        >
          <div className="mx-auto max-w-6xl px-3 py-4 sm:px-0 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
