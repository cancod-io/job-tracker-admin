import { Gauge, Layers3 } from "lucide-react";
import { stackDecisions } from "@/types/architecture";

export function TechStackPanel() {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="size-4 text-primary" />
        <h3>Performance Stack Decisions</h3>
      </div>
      <ul className="space-y-3">
        {stackDecisions.map((item) => (
          <li key={item.area} className="rounded-xl border bg-background p-3">
            <p className="text-xs uppercase tracking-wide">{item.area}</p>
            <p className="mt-1 text-sm font-medium text-foreground">{item.decision}</p>
            <p className="mt-1 text-xs">{item.reason}</p>
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Layers3 className="size-3.5 text-accent" />
              {item.impact}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
