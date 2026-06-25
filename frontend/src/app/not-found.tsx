"use client";

import Link from "next/link";
import { Compass, ArrowLeft, Globe } from "lucide-react";

export default function NotFound() {
  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div
        className="aws-breadcrumb flex items-center gap-1 text-xs mb-3"
        style={{ color: "var(--aws-text-secondary)" }}
      >
        <Link href="/">Route 53</Link>
        <span>/</span>
        <span style={{ color: "var(--aws-text)" }}>Page not found</span>
      </div>

      <div
        className="flex flex-col items-center justify-center text-center rounded-lg border py-20 px-6"
        style={{
          backgroundColor: "var(--aws-card)",
          borderColor: "var(--aws-border)",
        }}
      >
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center mb-5"
          style={{ backgroundColor: "var(--aws-blue-bg)" }}
        >
          <Compass className="w-8 h-8" style={{ color: "var(--aws-blue)" }} />
        </div>

        <p
          className="text-sm font-semibold tracking-wide mb-1"
          style={{ color: "var(--aws-blue)" }}
        >
          ERROR 404
        </p>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p
          className="text-sm max-w-md mb-6"
          style={{ color: "var(--aws-text-secondary)" }}
        >
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. Check the URL, or head back to a known location.
        </p>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="btn-primary flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <Link
            href="/hosted-zones"
            className="btn-secondary flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded transition-colors"
          >
            <Globe className="w-4 h-4" />
            Hosted zones
          </Link>
        </div>
      </div>
    </div>
  );
}
