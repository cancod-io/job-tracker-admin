import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-6xl space-y-8">{children}</div>
    </div>
  );
}
