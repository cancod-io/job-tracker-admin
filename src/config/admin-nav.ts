import { KeyRound, Users, type LucideIcon } from "lucide-react";

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

export const adminNavGroups: AdminNavGroup[] = [
  {
    id: "people",
    label: "People",
    icon: Users,
    children: [{ href: "/users", label: "Users", icon: Users, permission: "users.read" }],
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
