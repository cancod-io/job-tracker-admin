import {
  Briefcase,
  Building2,
  Link2,
  Settings,
  Shield,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When set, item is shown only if the signed-in user has this permission. */
  permission?: string;
};

/** Primary sidebar destinations (App Router paths under the admin app). */
export const adminNavItems: AdminNavItem[] = [
  { href: "/jobs", label: "Jobs", icon: Briefcase, permission: "jobs.read" },
  { href: "/users", label: "Users", icon: Users, permission: "users.read" },
  { href: "/companies", label: "Companies", icon: Building2, permission: "companies.read" },
  {
    href: "/settings/api-config",
    label: "API Configuration",
    icon: Settings,
    permission: "api_config.read",
  },
  { href: "/scam-urls", label: "Block Lists", icon: ShieldAlert, permission: "scam_urls.read" },
  // { href: "/career-urls", label: "Career URLs", icon: Link2, permission: "career_urls.read" },
  {
    href: "/permissions",
    label: "Role Permissions",
    icon: Shield,
    permission: "permissions.manage",
  },
];
