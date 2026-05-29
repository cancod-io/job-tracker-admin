import {
  Briefcase,
  Building2,
  FileText,
  LayoutDashboard,
  Link2,
  Terminal,
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
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/career-urls", label: "Career URLs", icon: Link2 },
  { href: "/scrapers", label: "Scrapers", icon: Terminal },
  { href: "/logs", label: "Logs", icon: FileText },
];
