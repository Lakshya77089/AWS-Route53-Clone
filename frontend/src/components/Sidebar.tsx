"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Route,
  LayoutDashboard,
  Globe,
  ArrowRightLeft,
  Activity,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

import type React from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
}

const navItems: { section: string; items: NavItem[] }[] = [
  {
    section: "Route 53",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/hosted-zones", label: "Hosted zones", icon: Globe },
    ],
  },
  {
    section: "Other services",
    items: [
      {
        href: "/traffic-policies",
        label: "Traffic policies",
        icon: ArrowRightLeft,
        comingSoon: true,
      },
      {
        href: "/health-checks",
        label: "Health checks",
        icon: Activity,
        comingSoon: true,
      },
      {
        href: "/resolver",
        label: "Resolver",
        icon: Route,
        comingSoon: true,
      },
      {
        href: "/profiles",
        label: "Profiles",
        icon: UserCircle,
        comingSoon: true,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || pathname === "/login") {
    return null;
  }

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col border-r"
      style={{
        backgroundColor: "var(--aws-sidebar)",
        borderColor: "var(--aws-sidebar-border)",
      }}
    >
      {/* Service switcher header */}
      <Link
        href="/"
        className="flex items-center justify-between px-4 py-3 border-b text-left transition-colors"
        style={{
          borderColor: "var(--aws-sidebar-border)",
          backgroundColor: "var(--aws-sidebar)",
        }}
      >
        <span className="text-sm font-bold" style={{ color: "var(--aws-text)" }}>
          Route 53
        </span>
        <ChevronDown className="w-4 h-4" style={{ color: "var(--aws-text-secondary)" }} />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((group) => (
          <div key={group.section} className="mb-2">
            <div
              className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide"
              style={{ color: "var(--aws-text-secondary)" }}
            >
              {group.section}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex items-center gap-2 pl-4 pr-3 py-1.5 text-sm transition-colors"
                  style={{
                    color: isActive ? "var(--aws-blue)" : "var(--aws-text)",
                    backgroundColor: isActive
                      ? "var(--aws-sidebar-active)"
                      : "transparent",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-0 bottom-0 w-0.5"
                      style={{ backgroundColor: "var(--aws-blue)" }}
                    />
                  )}
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.comingSoon && (
                    <span
                      className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: "var(--aws-bg)",
                        color: "var(--aws-text-secondary)",
                      }}
                    >
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
