"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, type LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function ComingSoon({
  title,
  description,
  icon: Icon,
}: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="p-6">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1 text-xs mb-4 hover:underline"
        style={{ color: "var(--aws-text-secondary)" }}
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Dashboard
      </button>

      <div
        className="flex flex-col items-center justify-center text-center rounded-lg border py-20"
        style={{
          backgroundColor: "var(--aws-card)",
          borderColor: "var(--aws-border)",
        }}
      >
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--aws-bg)" }}
        >
          <Icon className="w-7 h-7" style={{ color: "var(--aws-blue)" }} />
        </div>
        <h1 className="text-lg font-bold">{title}</h1>
        <p
          className="text-sm mt-1 max-w-sm"
          style={{ color: "var(--aws-text-secondary)" }}
        >
          {description}
        </p>
        <span
          className="mt-4 text-xs px-2 py-1 rounded font-medium"
          style={{
            backgroundColor: "#fafafa",
            color: "var(--aws-text-secondary)",
          }}
        >
          Coming Soon
        </span>
      </div>
    </div>
  );
}
