export type StackDecision = {
  area: string;
  decision: string;
  reason: string;
  impact: string;
};

export const stackDecisions: StackDecision[] = [
  {
    area: "Frontend runtime",
    decision: "Next.js App Router with SSR + ISR",
    reason: "Faster first render for job listings and excellent SEO compared to SPA-only delivery.",
    impact: "Better Core Web Vitals and scalable hybrid rendering.",
  },
  {
    area: "Styling",
    decision: "Tailwind CSS + design tokens",
    reason: "Small utility footprint, predictable spacing, and fast component delivery.",
    impact: "Consistent UI with low CSS overhead.",
  },
  {
    area: "Component system",
    decision: "Shadcn/UI-ready foundation",
    reason: "Accessible primitives without heavy runtime cost.",
    impact: "Faster feature building with maintainable components.",
  },
  {
    area: "State management",
    decision: "Zustand",
    reason: "Tiny bundle, minimal boilerplate, and ergonomic client state for filters/status.",
    impact: "Smooth interactions with low complexity.",
  },
  {
    area: "Logo/image delivery",
    decision: "Next/Image with allowed remote hosts and AVIF/WebP",
    reason: "Automatic optimization and stable dimensions reduce layout shift.",
    impact: "Improved LCP and visual stability.",
  },
];
