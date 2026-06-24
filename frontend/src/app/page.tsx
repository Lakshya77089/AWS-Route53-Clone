"use client";

import { useAuth } from "@/lib/auth-context";
import { Globe, Activity, ArrowRightLeft, Server, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const services = [
  {
    name: "Hosted Zones",
    icon: Globe,
    href: "/hosted-zones",
    desc: "Manage your DNS zones",
  },
  {
    name: "Traffic Policies",
    icon: ArrowRightLeft,
    href: "/traffic-policies",
    desc: "DNS traffic management",
    coming: true,
  },
  {
    name: "Health Checks",
    icon: Activity,
    href: "/health-checks",
    desc: "Endpoint health monitoring",
    coming: true,
  },
  {
    name: "Resolver",
    icon: Server,
    href: "/resolver",
    desc: "Hybrid DNS resolution",
    coming: true,
  },
  {
    name: "Profiles",
    icon: Wrench,
    href: "/profiles",
    desc: "Resolver configuration profiles",
    coming: true,
  },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--aws-text)" }}>
          Dashboard
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--aws-text-secondary)" }}
        >
          Welcome to Route 53 Console, {user.username}
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => {
          const Icon = s.icon;
          const card = (
            <div
              className="rounded-lg border p-5 h-full transition-shadow hover:shadow-md"
              style={{
                backgroundColor: "var(--aws-card)",
                borderColor: "var(--aws-border)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--aws-bg)" }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: "var(--aws-blue)" }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{s.name}</h3>
                    {s.coming && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: "#fafafa",
                          color: "var(--aws-text-secondary)",
                        }}
                      >
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--aws-text-secondary)" }}
                  >
                    {s.desc}
                  </p>
                </div>
              </div>
            </div>
          );

          return (
            <Link key={s.name} href={s.href!}>
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
