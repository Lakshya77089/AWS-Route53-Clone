"use client";

import { ArrowRightLeft } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export default function TrafficPoliciesPage() {
  return (
    <ComingSoon
      title="Traffic Policies"
      description="DNS traffic management — route traffic based on multiple criteria such as endpoint health, geographic location, and latency."
      icon={ArrowRightLeft}
    />
  );
}
