import { Gauge, Layers3 } from "lucide-react";
import { stackDecisions } from "@/types/architecture";

export function TechStackPanel() {
  return (
    <section
      className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm"
      aria-labelledby="stack-heading"
    >
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="size-4 shrink-0 text-primary" aria-hidden />
        <h3 id="stack-heading">Performance & stack</h3>
      </div>
      <ul className="space-y-3">
        {stackDecisions.map((item) => (
          <li
            key={item.area}
            className="rounded-xl border border-border/70 bg-background/80 p-3 shadow-sm"
          >
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {item.area}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">{item.decision}</p>
            <p className="mt-1 text-xs leading-relaxed">{item.reason}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers3 className="size-3.5 shrink-0 text-primary" aria-hidden />
              {item.impact}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
