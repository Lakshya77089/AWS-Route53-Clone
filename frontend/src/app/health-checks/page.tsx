"use client";

import { Activity } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export default function HealthChecksPage() {
  return (
    <ComingSoon
      title="Health Checks"
      description="Monitor the health and performance of your endpoints, and get notified when they become unavailable."
      icon={Activity}
    />
  );
}
