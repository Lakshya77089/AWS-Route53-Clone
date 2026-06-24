"use client";

import { Server } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export default function ResolverPage() {
  return (
    <ComingSoon
      title="Resolver"
      description="Hybrid DNS resolution between your on-premises networks and your VPCs."
      icon={Server}
    />
  );
}
