import {
  Briefcase,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Primary sidebar destinations (App Router paths under the admin app). */
export const adminNavItems: AdminNavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/users", label: "Users", icon: Users },
  { href: "/scrapers", label: "Scrapers", icon: RefreshCw },
  { href: "/logs", label: "Logs", icon: FileText },
];
