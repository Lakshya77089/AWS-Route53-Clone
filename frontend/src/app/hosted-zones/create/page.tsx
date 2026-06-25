"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import api, { authHeaders } from "@/lib/api";
import { ChevronRight } from "lucide-react";

export default function CreateHostedZonePage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privateZone, setPrivateZone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (authLoading || !user) return null;

  const handleCreate = async () => {
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      await api.post(
        "/hosted-zones",
        { name, description, private_zone: privateZone },
        { headers: authHeaders() },
      );
      toast.success(`Hosted zone "${name}" created`);
      router.push("/hosted-zones");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const message = e.response?.data?.detail || "Failed to create hosted zone";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      {/* Breadcrumb */}
      <div
        className="aws-breadcrumb flex items-center gap-1 text-xs mb-3"
        style={{ color: "var(--aws-text-secondary)" }}
      >
        <Link href="/">Route 53</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/hosted-zones">Hosted zones</Link>
        <ChevronRight className="w-3 h-3" />
        <span style={{ color: "var(--aws-text)" }}>Create hosted zone</span>
      </div>

      <h1 className="text-2xl font-normal mb-1" style={{ color: "var(--aws-text)" }}>
        Create hosted zone
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--aws-text-secondary)" }}>
        A hosted zone is a container for records, which include information about how
        you want to route traffic for a domain.
      </p>

      <div
        className="rounded border p-5"
        style={{ backgroundColor: "var(--aws-card)", borderColor: "var(--aws-border)" }}
      >
        <h2 className="text-base font-semibold mb-4">Hosted zone configuration</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">
              Domain name <span style={{ color: "var(--aws-red)" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="example.com"
              className="w-full max-w-md px-3 py-1.5 text-sm border rounded"
              style={{ borderColor: "var(--aws-border)" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--aws-text-secondary)" }}>
              This is the name of the domain that you want to route traffic for.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this hosted zone"
              className="w-full max-w-md px-3 py-1.5 text-sm border rounded"
              style={{ borderColor: "var(--aws-border)" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!privateZone}
                  onChange={() => setPrivateZone(false)}
                  className="mt-0.5 accent-[var(--aws-blue)]"
                />
                <span>
                  <span className="text-sm font-medium block">Public hosted zone</span>
                  <span className="text-xs" style={{ color: "var(--aws-text-secondary)" }}>
                    Routes traffic on the internet.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={privateZone}
                  onChange={() => setPrivateZone(true)}
                  className="mt-0.5 accent-[var(--aws-blue)]"
                />
                <span>
                  <span className="text-sm font-medium block">Private hosted zone</span>
                  <span className="text-xs" style={{ color: "var(--aws-text-secondary)" }}>
                    Routes traffic within one or more VPCs.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm mt-3" style={{ color: "var(--aws-red)" }}>
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={() => router.push("/hosted-zones")}
          className="btn-secondary px-4 py-1.5 text-sm rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={saving || !name}
          className="btn-primary px-4 py-1.5 text-sm font-medium rounded disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create hosted zone"}
        </button>
      </div>
    </div>
  );
}
