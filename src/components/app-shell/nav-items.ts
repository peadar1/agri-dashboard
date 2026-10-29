import {
  CalendarClock,
  FileText,
  LayoutDashboard,
  MapPinned,
  ReceiptEuro,
  Settings,
  Tractor,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Tractor },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/deadlines", label: "Deadlines", icon: CalendarClock },
  { href: "/invoices", label: "Invoices", icon: ReceiptEuro },
  { href: "/map", label: "Farm map", icon: MapPinned },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
