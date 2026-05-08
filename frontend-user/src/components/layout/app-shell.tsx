import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

/** Vertical spacing for dashboard modules below the page header. */
export function AppShell({ children }: AppShellProps) {
  return <div className="space-y-6 md:space-y-8">{children}</div>;
}
