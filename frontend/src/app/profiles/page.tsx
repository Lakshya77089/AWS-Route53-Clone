"use client";

import { Wrench } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export default function ProfilesPage() {
  return (
    <ComingSoon
      title="Profiles"
      description="Resolver configuration profiles for consistent DNS settings across your VPCs."
      icon={Wrench}
    />
  );
}
