import { ApplicationsPanel } from "@/components/dashboard/applications-panel";
import { FilterToolbar } from "@/components/dashboard/filter-toolbar";
import { JobsList } from "@/components/dashboard/jobs-list";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";

export default function HomePage() {
  return (
    <>
      <PageHeader
        className="border-border/60 pb-5 md:pb-6"
        title="Find Shopify roles"
        description="Search and filter a full-width job feed, then track applications in one place—similar flow to modern job boards."
        breadcrumbs={[{ label: "Jobs" }]}
      />
      <AppShell>
        <div className="flex flex-col gap-5 md:gap-6">
          <FilterToolbar />
          <ApplicationsPanel />
          <JobsList />
        </div>
      </AppShell>
    </>
  );
}
