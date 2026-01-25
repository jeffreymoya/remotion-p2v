import { Video, Settings, LucideIcon } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export const navigation: NavItem[] = [
  { name: "Projects", href: "/projects", icon: Video },
  { name: "Settings", href: "/settings", icon: Settings },
];
