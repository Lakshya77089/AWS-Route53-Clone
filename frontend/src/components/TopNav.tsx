"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, HelpCircle, Settings, ChevronDown, Sun, Moon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

export default function TopNav() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState("");

  if (!user || pathname === "/login") return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header
      className="h-10 flex-shrink-0 flex items-center px-2 text-sm relative z-30"
      style={{
        backgroundColor: "var(--aws-topnav)",
        borderBottom: "1px solid var(--aws-topnav-border)",
      }}
    >
      {/* Logo + service name */}
      <Link href="/" className="flex items-center gap-2 px-2 h-full">
        <span className="text-[#ff9900] font-bold text-base leading-none tracking-tight">
          aws
        </span>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <span className="text-white text-sm font-medium">Route 53</span>
      </Link>

      {/* Search */}
      <div className="flex-1 flex justify-center px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = search.trim();
            router.push(q ? `/hosted-zones?q=${encodeURIComponent(q)}` : "/hosted-zones");
          }}
          className="relative w-full max-w-md"
        >
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" />
          <input
            type="text"
            placeholder="Search hosted zones"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs rounded bg-white/10 text-white placeholder-white/50 border border-white/10 focus:outline-none focus:border-white/30"
          />
        </form>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1 px-2 h-full text-white/80">
        <button className="px-2 py-1.5 text-xs rounded hover:bg-white/10 transition-colors flex items-center gap-1">
          Global
          <ChevronDown className="w-3 h-3" />
        </button>
        <button
          onClick={toggle}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Notifications">
          <Bell className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Help">
          <HelpCircle className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
        <div className="relative">
          <button
            onClick={() => setAccountOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-white/10 transition-colors text-xs"
          >
            <span className="w-5 h-5 rounded-full bg-[var(--aws-primary)] flex items-center justify-center text-[10px] font-bold text-white">
              {user.username[0].toUpperCase()}
            </span>
            <span>{user.username}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {accountOpen && (
            <>
              <div className="fixed inset-0" onClick={() => setAccountOpen(false)} />
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded shadow-lg border z-40 py-1"
                style={{ backgroundColor: "var(--aws-surface)", borderColor: "var(--aws-border)" }}
              >
                <div className="px-3 py-2 text-xs border-b" style={{ borderColor: "var(--aws-border-divider)", color: "var(--aws-text-secondary)" }}>
                  Signed in as
                  <div className="font-medium" style={{ color: "var(--aws-text)" }}>
                    {user.username}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                  style={{ color: "var(--aws-text)" }}
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
