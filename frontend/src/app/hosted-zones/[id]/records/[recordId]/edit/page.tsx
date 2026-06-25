"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import {
  useGetRecordQuery,
  useUpdateRecordMutation,
  apiErrorMessage,
} from "@/store/api";
import type { DNSRecord } from "@/types";
import { ChevronRight, RotateCw } from "lucide-react";
import RecordForm from "@/components/RecordForm";

export default function EditRecordPage() {
  const { id, recordId } = useParams<{ id: string; recordId: string }>();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = useState<Partial<DNSRecord> | null>(null);
  const [seededId, setSeededId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const {
    data: record,
    isLoading: loading,
    isError,
  } = useGetRecordQuery(
    { zoneId: id, recordId },
    { skip: !user },
  );
  const [updateRecord, { isLoading: saving }] = useUpdateRecordMutation();

  // Seed the editable form when a new record loads. Adjusting state during
  // render (the React-recommended pattern) instead of using an effect.
  if (record && seededId !== record.id) {
    setForm(record);
    setSeededId(record.id);
  }

  if (authLoading || !user) return null;

  const handleSave = async () => {
    if (!form || !form.name || !form.value) return;
    setError("");
    try {
      await updateRecord({ zoneId: id, recordId, body: form }).unwrap();
      toast.success(`${form.type} record "${form.name}" updated`);
      router.push(`/hosted-zones/${id}`);
    } catch (err: unknown) {
      const message = apiErrorMessage(err, "Failed to update record");
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
        <span style={{ color: "var(--aws-text)" }}>Edit record</span>
      </div>

      <h1 className="text-2xl font-normal mb-6" style={{ color: "var(--aws-text)" }}>
        Edit record
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RotateCw className="w-5 h-5 animate-spin" style={{ color: "var(--aws-blue)" }} />
        </div>
      ) : isError || !form ? (
        <p className="text-sm" style={{ color: "var(--aws-red)" }}>
          Record not found.
        </p>
      ) : (
        <>
          <div
            className="rounded border p-5"
            style={{ backgroundColor: "var(--aws-card)", borderColor: "var(--aws-border)" }}
          >
            <h2 className="text-base font-semibold mb-4">Record details</h2>
            <RecordForm form={form} onChange={setForm} editing />
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
              onClick={handleSave}
              disabled={saving || !form.name || !form.value}
              className="btn-primary px-4 py-1.5 text-sm font-medium rounded disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
