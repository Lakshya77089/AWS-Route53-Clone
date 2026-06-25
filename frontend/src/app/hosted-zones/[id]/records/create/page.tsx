"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useCreateRecordMutation, apiErrorMessage } from "@/store/api";
import type { DNSRecord, RecordType } from "@/types";
import { ChevronRight } from "lucide-react";
import RecordForm from "@/components/RecordForm";

export default function CreateRecordPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = useState<Partial<DNSRecord>>({
    type: "A" as RecordType,
    name: "",
    value: "",
    ttl: 300,
  });
  const [error, setError] = useState("");
  const [createRecord, { isLoading: saving }] = useCreateRecordMutation();

  if (authLoading || !user) return null;

  const handleCreate = async () => {
    if (!form.name || !form.value || !form.type) return;
    setError("");
    try {
      await createRecord({ zoneId: id, body: form }).unwrap();
      toast.success(`${form.type} record "${form.name}" created`);
      router.push(`/hosted-zones/${id}`);
    } catch (err: unknown) {
      const message = apiErrorMessage(err, "Failed to create record");
      setError(message);
      toast.error(message);
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
        <Link href={`/hosted-zones/${id}`}>Records</Link>
        <ChevronRight className="w-3 h-3" />
        <span style={{ color: "var(--aws-text)" }}>Create record</span>
      </div>

      <h1 className="text-2xl font-normal mb-1" style={{ color: "var(--aws-text)" }}>
        Create record
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--aws-text-secondary)" }}>
        A record defines where you want to route traffic for your domain.
      </p>

      <div
        className="rounded border p-5"
        style={{ backgroundColor: "var(--aws-card)", borderColor: "var(--aws-border)" }}
      >
        <h2 className="text-base font-semibold mb-4">Record details</h2>
        <RecordForm form={form} onChange={setForm} />
      </div>

      {error && (
        <p className="text-sm mt-3" style={{ color: "var(--aws-red)" }}>
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={() => router.push(`/hosted-zones/${id}`)}
          className="btn-secondary px-4 py-1.5 text-sm rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={saving || !form.name || !form.value}
          className="btn-primary px-4 py-1.5 text-sm font-medium rounded disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create record"}
        </button>
      </div>
    </div>
  );
}
