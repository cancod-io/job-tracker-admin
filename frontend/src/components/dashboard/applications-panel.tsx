import { CheckCircle2, Clock3, FileText, GraduationCap, ShieldCheck } from "lucide-react";

const applicationItems = [
  { title: "Senior Shopify Engineer", company: "Northstar Retail", status: "Applied" },
  {
    title: "Shopify Plus Solutions Developer",
    company: "ScaleCart Agency",
    status: "Interview Scheduled",
  },
  { title: "Junior Theme Developer", company: "Pixel Loom", status: "Pending" },
];

const statusIcon = {
  Applied: <CheckCircle2 className="size-4 text-primary" />,
  Pending: <Clock3 className="size-4 text-amber-500" />,
  "Interview Scheduled": <GraduationCap className="size-4 text-accent" />,
};

export function ApplicationsPanel() {
  return (
    <aside
      id="applications"
      className="scroll-mt-24 space-y-4 md:scroll-mt-28"
      aria-label="Applications sidebar"
    >
      <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <h3 className="mb-1">My applications</h3>
        <p className="mb-4 text-xs">
          Track progress from first apply click to interview scheduling.
        </p>
        <ul className="space-y-3">
          {applicationItems.map((item) => (
            <li key={item.title} className="rounded-xl border bg-background p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">{item.title}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {statusIcon[item.status as keyof typeof statusIcon]}
                  {item.status}
                </span>
              </div>
              <p className="text-xs">{item.company}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <h3 className="mb-1">MVP feature scope</h3>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="inline-flex items-center gap-2">
            <FileText className="size-3.5 text-primary" aria-hidden />
            Dashboard search and smart filtering
          </li>
          <li className="inline-flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden />
            User profile and application tracking
          </li>
          <li className="inline-flex items-center gap-2">
            <Clock3 className="size-3.5 text-amber-600" aria-hidden />
            Scheduled scraping and optional alerts
          </li>
        </ul>
      </section>
    </aside>
  );
}
