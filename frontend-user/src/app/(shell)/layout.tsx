import type { ReactNode } from "react";
import { MainAppShell } from "@/components/layout/main-app-shell";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return <MainAppShell>{children}</MainAppShell>;
}
