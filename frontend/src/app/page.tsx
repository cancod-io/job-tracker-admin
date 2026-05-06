import { ApplicationsPanel } from "@/components/dashboard/applications-panel";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FilterToolbar } from "@/components/dashboard/filter-toolbar";
import { JobsList } from "@/components/dashboard/jobs-list";
import { TechStackPanel } from "@/components/dashboard/tech-stack-panel";
import { AppShell } from "@/components/layout/app-shell";

export default function HomePage() {
  return (
    <main>
      <AppShell>
        <DashboardHeader />
        <FilterToolbar />
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <JobsList />
          <div className="space-y-4">
            <ApplicationsPanel />
            <TechStackPanel />
          </div>
        </div>
      </AppShell>
    </main>
  );
}
