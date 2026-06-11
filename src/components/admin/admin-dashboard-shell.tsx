"use client";

import { useState, type ReactNode } from "react";
import { AdminPermissionRedirect } from "@/components/admin/admin-permission-redirect";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopBar } from "@/components/admin/admin-top-bar";

export function AdminDashboardShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col bg-background md:flex-row">
      <AdminPermissionRedirect />
      <div
        className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_45%)]"
        aria-hidden
      />
      <AdminSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col md:ml-64">
        <AdminTopBar onMenuClick={() => setMobileNavOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 scroll-mt-0 outline-none focus:outline-none"
        >
          <div className="w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  