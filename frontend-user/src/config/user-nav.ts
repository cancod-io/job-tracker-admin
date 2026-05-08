import { Bookmark, Briefcase, LayoutGrid, type LucideIcon } from "lucide-react";

export type UserNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const userPrimaryNav: UserNavItem[] = [
  { href: "/", label: "Jobs", icon: LayoutGrid },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/saved", label: "Saved jobs", icon: Bookmark },
];
