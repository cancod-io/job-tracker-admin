import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="px-6 py-6 md:py-10 lg:py-12">
      <div className="mx-auto space-y-6 md:space-y-8">{children}</div>
    </div>
  );
}
