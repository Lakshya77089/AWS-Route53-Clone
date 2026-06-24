"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Route,
  LayoutDashboard,
  Globe,
  ArrowRightLeft,
  Activity,
  UserCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
}

import type React from "react";

const navItems: { section: string; items: NavItem[] }[] = [
  {
    section: "Route53",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/hosted-zones", label: "Hosted Zones", icon: Globe },
    ],
  },
  {
    section: "Other",
    items: [
      {
        href: "/traffic-policies",
        label: "Traffic Policies",
        icon: Route,
        comingSoon: true,
      },
      {
        href: "/health-checks",
        label: "Health Checks",
        icon: Activity,
        comingSoon: true,
      },
      {
        href: "/resolver",
        label: "Resolver",
        icon: ArrowRightLeft,
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
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user || pathname === "/login") {
    return null;
  }

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col"
      style={{ backgroundColor: "var(--aws-sidebar)" }}
    >
      {/* AWS Logo Bar */}
      <div className="px-4 py-3 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <Route className="w-5 h-5 text-[var(--aws-primary)]" />
          <span className="text-white text-sm font-semibold">Route 53</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/40">
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
                  className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? "text-white font-medium"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: "var(--aws-sidebar-hover)" }
                      : undefined
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.comingSoon ? (
                    <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  ) : (
                    isActive && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/40" />
                    )
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-[var(--aws-primary)] flex items-center justify-center text-xs font-bold text-white">
            {user.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/80 truncate">
              {user.username}
            </div>
            <div className="text-[10px] text-white/40">Administrator</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 rounded transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
