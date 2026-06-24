"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import api, { authHeaders } from "@/lib/api";
import type { HostedZone, DNSRecord, RecordType } from "@/types";
import { RECORD_TYPES } from "@/types";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  ChevronRight,
  RotateCw,
  ArrowLeft,
  Globe,
  Filter,
  Lock,
  Unlock,
} from "lucide-react";
import Modal from "@/components/Modal";
import RecordForm from "@/components/RecordForm";

const TYPE_COLORS: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  A: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  AAAA: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  CNAME: { bg: "#faf5ff", color: "#6b21a8", border: "#e9d5ff" },
  MX: { bg: "#fff7ed", color: "#9a3412", border: "#fed7aa" },
  NS: { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  PTR: { bg: "#fdf4ff", color: "#86198f", border: "#f0abfc" },
  SRV: { bg: "#fefce8", color: "#713f12", border: "#fde68a" },
  TXT: { bg: "#f8fafc", color: "#334155", border: "#e2e8f0" },
  CAA: { bg: "#fff1f2", color: "#9f1239", border: "#fecdd3" },
};

export default function ZoneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const zoneId = id; // UUID string, not integer

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<DNSRecord | null>(null);
  const [showDelete, setShowDelete] = useState<DNSRecord | null>(null);
  const [form, setForm] = useState<Partial<DNSRecord>>({
    type: "A" as RecordType,
    name: "",
    value: "",
    ttl: 300,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [zoneRes, recordsRes] = await Promise.all([
        api.get(`/hosted-zones/${zoneId}`, { headers: authHeaders() }),
        api.get(`/hosted-zones/${zoneId}/records`, {
          headers: authHeaders(),
          params: { search, type: typeFilter, page, page_size: pageSize },
        }),
      ]);
      setZone(zoneRes.data);
      setRecords(recordsRes.data.records);
      setTotal(recordsRes.data.total);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [zoneId, search, typeFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) fetchData();
  }, [user, fetchData]);

  if (authLoading || !user) return null;

  const handleCreate = async () => {
    if (!form.name || !form.value || !form.type) return;
    setSaving(true);
    setError("");
    try {
      await api.post(`/hosted-zones/${zoneId}/records`, form, {
        headers: authHeaders(),
      });
      setShowCreate(false);
      resetForm();
      await fetchData();
      toast.success(`${form.type} record "${form.name}" created`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const message = e.response?.data?.detail || "Failed to create record";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!showEdit || !form.name || !form.value || !form.type) return;
    setSaving(true);
    setError("");
    try {
      await api.put(`/hosted-zones/${zoneId}/records/${showEdit.id}`, form, {
        headers: authHeaders(),
      });
      setShowEdit(null);
      resetForm();
      await fetchData();
      toast.success(`${form.type} record "${form.name}" updated`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const message = e.response?.data?.detail || "Failed to update record";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    const { type, name } = showDelete;
    try {
      await api.delete(`/hosted-zones/${zoneId}/records/${showDelete.id}`, {
        headers: authHeaders(),
      });
      setShowDelete(null);
      await fetchData();
      toast.success(`${type} record "${name}" deleted`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail || "Failed to delete record");
    }
  };

  const resetForm = () =>
    setForm({
      type: "A" as RecordType,
      name: "",
      value: "",
      ttl: 300,
      priority: null,
      weight: null,
      port: null,
      flags: null,
      tag: null,
    });

  const openCreate = () => {
    resetForm();
    setError("");
    setShowCreate(true);
  };

  const openEdit = (r: DNSRecord) => {
    setForm({
      name: r.name,
      type: r.type,
      value: r.value,
      ttl: r.ttl,
      priority: r.priority,
      weight: r.weight,
      port: r.port,
      flags: r.flags,
      tag: r.tag,
    });
    setError("");
    setShowEdit(r);
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RotateCw
          className="w-6 h-6 animate-spin"
          style={{ color: "var(--aws-primary)" }}
        />
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-sm font-medium">Hosted zone not found</p>
        <button
          onClick={() => router.push("/hosted-zones")}
          className="text-sm underline"
          style={{ color: "var(--aws-blue)" }}
        >
          Back to hosted zones
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-1 text-xs mb-4"
        style={{ color: "var(--aws-text-secondary)" }}
      >
        <button
          onClick={() => router.push("/hosted-zones")}
          className="hover:underline"
        >
          Route 53
        </button>
        <ChevronRight className="w-3 h-3" />
        <button
          onClick={() => router.push("/hosted-zones")}
          className="hover:underline"
        >
          Hosted Zones
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="font-medium" style={{ color: "var(--aws-text)" }}>
          {zone.name}
        </span>
      </div>

      {/* Zone Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/hosted-zones")}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Globe className="w-5 h-5" style={{ color: "var(--aws-blue)" }} />
          <div>
            <h1 className="text-xl font-bold">{zone.name}</h1>
            <p
              className="text-xs"
              style={{ color: "var(--aws-text-secondary)" }}
            >
              {total} record{total !== 1 ? "s" : ""}
              {zone.description ? ` — ${zone.description}` : ""}
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white rounded transition-colors"
          style={{ backgroundColor: "var(--aws-blue)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--aws-blue-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--aws-blue)")
          }
        >
          <Plus className="w-4 h-4" />
          Create Record
        </button>
      </div>

      {/* Zone Info Panel */}
      <div
        className="rounded-lg border p-3 mb-4 flex flex-wrap gap-4 text-xs"
        style={{
          backgroundColor: "var(--aws-card)",
          borderColor: "var(--aws-border)",
        }}
      >
        <div>
          <span
            className="font-semibold"
            style={{ color: "var(--aws-text-secondary)" }}
          >
            Zone ID:{" "}
          </span>
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
            {zone.id}
          </code>
        </div>
        <div>
          <span
            className="font-semibold"
            style={{ color: "var(--aws-text-secondary)" }}
          >
            Type:{" "}
          </span>
          <span className="inline-flex items-center gap-1">
            {zone.private_zone ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
            {zone.private_zone ? "Private" : "Public"}
          </span>
        </div>
        <div>
          <span
            className="font-semibold"
            style={{ color: "var(--aws-text-secondary)" }}
          >
            Record count:{" "}
          </span>
          <span>{zone.record_count}</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--aws-text-secondary)" }}
          />
          <input
            type="text"
            placeholder="Search records by name or value..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-sm border rounded"
            style={{
              borderColor: "var(--aws-border)",
              backgroundColor: "var(--aws-card)",
            }}
          />
        </div>
        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--aws-text-secondary)" }}
          />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="pl-9 pr-8 py-1.5 text-sm border rounded appearance-none"
            style={{
              borderColor: "var(--aws-border)",
              backgroundColor: "var(--aws-card)",
            }}
          >
            <option value="">All types</option>
            {RECORD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Records Table */}
      {records.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            backgroundColor: "var(--aws-card)",
            borderColor: "var(--aws-border)",
          }}
        >
          <Globe
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: "var(--aws-text-secondary)" }}
          />
          <p className="text-sm font-medium">No records found</p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--aws-text-secondary)" }}
          >
            {search || typeFilter
              ? "Try different search terms or filters"
              : "Create your first DNS record"}
          </p>
        </div>
      ) : (
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: "var(--aws-card)",
            borderColor: "var(--aws-border)",
          }}
        >
          <table className="aws-table w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--aws-bg)" }}>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">
                  Value
                </th>
                <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">
                  TTL
                </th>
                <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const typeStyle = TYPE_COLORS[record.type] ?? {
                  bg: "#f8fafc",
                  color: "#334155",
                  border: "#e2e8f0",
                };
                return (
                  <tr
                    key={record.id}
                    className="border-t transition-colors hover:bg-blue-50/30"
                    style={{ borderTopColor: "var(--aws-border)" }}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">
                      {record.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded"
                        style={{
                          backgroundColor: typeStyle.bg,
                          color: typeStyle.color,
                          border: `1px solid ${typeStyle.border}`,
                        }}
                      >
                        {record.type}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-xs font-mono max-w-xs truncate"
                      style={{ color: "var(--aws-text-secondary)" }}
                      title={record.value}
                    >
                      {record.priority != null && (
                        <span
                          className="mr-1 text-xs font-normal"
                          style={{ color: "var(--aws-text-secondary)" }}
                        >
                          [{record.priority}]
                        </span>
                      )}
                      {record.value}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {record.ttl}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(record)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Edit3
                          className="w-4 h-4"
                          style={{ color: "var(--aws-text-secondary)" }}
                        />
                      </button>
                      <button
                        onClick={() => setShowDelete(record)}
                        className="p-1 rounded hover:bg-red-50 transition-colors ml-1"
                        title="Delete"
                      >
                        <Trash2
                          className="w-4 h-4"
                          style={{ color: "var(--aws-red)" }}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-2 border-t text-xs"
              style={{
                borderTopColor: "var(--aws-border)",
                backgroundColor: "var(--aws-bg)",
              }}
            >
              <span style={{ color: "var(--aws-text-secondary)" }}>
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 border rounded disabled:opacity-40"
                  style={{ borderColor: "var(--aws-border)" }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 border rounded disabled:opacity-40"
                  style={{ borderColor: "var(--aws-border)" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Record Modal */}
      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setError("");
        }}
        title="Create DNS Record"
      >
        <RecordForm form={form} onChange={setForm} />
        {error && (
          <p className="text-xs mt-2" style={{ color: "var(--aws-red)" }}>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => {
              setShowCreate(false);
              setError("");
            }}
            className="px-3 py-1.5 text-sm border rounded"
            style={{ borderColor: "var(--aws-border)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.name || !form.value}
            className="px-3 py-1.5 text-sm font-semibold text-white rounded disabled:opacity-50"
            style={{ backgroundColor: "var(--aws-blue)" }}
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </Modal>

      {/* Edit Record Modal */}
      <Modal
        open={!!showEdit}
        onClose={() => {
          setShowEdit(null);
          setError("");
        }}
        title="Edit DNS Record"
      >
        <RecordForm form={form} onChange={setForm} editing />
        {error && (
          <p className="text-xs mt-2" style={{ color: "var(--aws-red)" }}>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => {
              setShowEdit(null);
              setError("");
            }}
            className="px-3 py-1.5 text-sm border rounded"
            style={{ borderColor: "var(--aws-border)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleEdit}
            disabled={saving || !form.name || !form.value}
            className="px-3 py-1.5 text-sm font-semibold text-white rounded disabled:opacity-50"
            style={{ backgroundColor: "var(--aws-blue)" }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      {/* Delete Record Modal */}
      <Modal
        open={!!showDelete}
        onClose={() => setShowDelete(null)}
        title="Delete DNS Record?"
      >
        <p className="text-sm">
          Are you sure you want to delete the{" "}
          <span
            className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold rounded mx-0.5"
            style={{
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
            {showDelete?.type}
          </span>{" "}
          record for <strong>{showDelete?.name}</strong>?
        </p>
        <p className="text-xs mt-2" style={{ color: "var(--aws-red)" }}>
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setShowDelete(null)}
            className="px-3 py-1.5 text-sm border rounded"
            style={{ borderColor: "var(--aws-border)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm font-semibold text-white rounded"
            style={{ backgroundColor: "var(--aws-red)" }}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
