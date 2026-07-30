import {
  BarChart3,
  Briefcase,
  Building2,
  KeyRound,
  Settings,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Leaf link in the admin sidebar. */
export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When set, item is shown only if the signed-in user has this permission. */
  permission?: string;
  /** When true, item is shown only to administrators (backend admin role). */
  adminOnly?: boolean;
};

/** Collapsible parent section in the admin sidebar. */
export type AdminNavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  children: AdminNavItem[];
};

/**
 * Sidebar structure:
 * - Jobs → Analytics, Users, Companies, API Configuration, Block Lists
 * - Credentials → Credentials (admin-only vault)
 *
 * Note: Job Listings (/jobs) stays under Jobs so the jobs board remains reachable.
 */
export const adminNavGroups: AdminNavGroup[] = [
  {
    id: "jobs",
    label: "Jobs",
    icon: Briefcase,
    children: [
      {
        href: "/analytics",
        label: "Analytics",
        icon: BarChart3,
        permission: "stats.read",
      },
      { href: "/jobs", label: "Job Listings", icon: Briefcase, permission: "jobs.read" },
      { href: "/users", label: "Users", icon: Users, permission: "users.read" },
      { href: "/companies", label: "Companies", icon: Building2, permission: "companies.read" },
      {
        href: "/settings/api-config",
        label: "API Configuration",
        icon: Settings,
        permission: "api_config.read",
      },
      { href: "/scam-urls", label: "Block Lists", icon: ShieldAlert, permission: "scam_urls.read" },
    ],
  },
  {
    id: "credentials",
    label: "Credentials",
    icon: KeyRound,
    children: [
      {
        href: "/settings/secure-credentials",
        label: "Credentials",
        icon: KeyRound,
        adminOnly: true,
      },
    ],
  },
];

/** Flat list of all leaf items (for redirects / access checks). */
export const adminNavItems: AdminNavItem[] = adminNavGroups.flatMap((group) => group.children);
