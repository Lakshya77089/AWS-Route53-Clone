"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import api, { authHeaders } from "@/lib/api";
import type { HostedZone, DNSRecord } from "@/types";
import { RECORD_TYPES } from "@/types";
import {
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  RotateCw,
  ArrowLeft,
  Globe,
  Filter,
  Lock,
  Unlock,
  Download,
  Upload,
} from "lucide-react";
import Modal from "@/components/Modal";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionsOpen, setActionsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [showDelete, setShowDelete] = useState<DNSRecord[] | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDelete = async () => {
    if (!showDelete) return;
    const targets = showDelete;
    try {
      await Promise.all(
        targets.map((r) =>
          api.delete(`/hosted-zones/${zoneId}/records/${r.id}`, {
            headers: authHeaders(),
          }),
        ),
      );
      setShowDelete(null);
      setSelected(new Set());
      await fetchData();
      toast.success(
        targets.length === 1
          ? `${targets[0].type} record "${targets[0].name}" deleted`
          : `${targets.length} records deleted`,
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail || "Failed to delete record");
    }
  };

  const handleExport = async (format: "json" | "bind") => {
    setExportOpen(false);
    try {
      const res = await api.get(`/hosted-zones/${zoneId}/export`, {
        headers: authHeaders(),
        params: { format },
        responseType: format === "json" ? "json" : "text",
      });
      const data =
        format === "json"
          ? JSON.stringify(res.data, null, 2)
          : (res.data as string);
      const mime = format === "json" ? "application/json" : "text/plain";
      const blob = new Blob([data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = zone?.name.replace(/\.$/, "") || "zone";
      a.href = url;
      a.download = format === "json" ? `${base}.json` : `${base}.zone`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported zone as ${format.toUpperCase()}`);
    } catch {
      toast.error("Failed to export zone");
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file
    if (!file) return;
    try {
      const content = await file.text();
      const res = await api.post(
        `/hosted-zones/${zoneId}/import`,
        { content },
        { headers: authHeaders() },
      );
      const { imported, skipped } = res.data as {
        imported: number;
        skipped: number;
      };
      await fetchData();
      setSelected(new Set());
      if (imported > 0) {
        toast.success(
          `Imported ${imported} record${imported !== 1 ? "s" : ""}` +
            (skipped > 0 ? ` (${skipped} skipped)` : ""),
        );
      } else {
        toast.error("No records imported — check the file format");
      }
    } catch (err: unknown) {
      const ex = err as { response?: { data?: { detail?: string } } };
      toast.error(ex.response?.data?.detail || "Failed to import zone file");
    }
  };

  const toggleSelect = (recId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(recId)) next.delete(recId);
      else next.add(recId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === records.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(records.map((r) => r.id)));
    }
  };

  const selectedRecords = records.filter((r) => selected.has(r.id));
  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RotateCw
          className="w-6 h-6 animate-spin"
          style={{ color: "var(--aws-blue)" }}
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
        className="aws-breadcrumb flex items-center gap-1 text-xs mb-3"
        style={{ color: "var(--aws-text-secondary)" }}
      >
        <Link href="/">Route 53</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/hosted-zones">Hosted zones</Link>
        <ChevronRight className="w-3 h-3" />
        <span style={{ color: "var(--aws-text)" }}>{zone.name}</span>
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
          <h1 className="text-2xl font-normal" style={{ color: "var(--aws-text)" }}>
            {zone.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={actionsRef}>
            <button
              onClick={() => setActionsOpen((v) => !v)}
              className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors"
            >
              Actions
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {actionsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setActionsOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-1 w-44 rounded shadow-lg border z-20 py-1"
                  style={{ backgroundColor: "#fff", borderColor: "var(--aws-border)" }}
                >
                  <button
                    disabled={selectedRecords.length !== 1}
                    onClick={() => {
                      if (selectedRecords.length === 1) {
                        router.push(`/hosted-zones/${zoneId}/records/${selectedRecords[0].id}/edit`);
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Edit
                  </button>
                  <button
                    disabled={selectedRecords.length === 0}
                    onClick={() => {
                      setShowDelete(selectedRecords);
                      setActionsOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: "var(--aws-red)" }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-1 w-44 rounded shadow-lg border z-20 py-1"
                  style={{ backgroundColor: "#fff", borderColor: "var(--aws-border)" }}
                >
                  <button
                    onClick={() => handleExport("json")}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport("bind")}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Export as BIND
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zone,.txt,.bind,text/plain"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            onClick={() => router.push(`/hosted-zones/${zoneId}/records/create`)}
            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create record
          </button>
        </div>
      </div>

      {/* Zone Info Panel */}
      <div
        className="rounded border p-3 mb-4 flex flex-wrap gap-4 text-xs"
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
            Hosted zone ID:{" "}
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
        {zone.description && (
          <div>
            <span
              className="font-semibold"
              style={{ color: "var(--aws-text-secondary)" }}
            >
              Description:{" "}
            </span>
            <span>{zone.description}</span>
          </div>
        )}
      </div>

      <h2 className="text-lg font-normal mb-2" style={{ color: "var(--aws-text)" }}>
        Records ({total})
      </h2>

      {/* Search and Filter */}
      <div className="flex gap-3 mb-3">
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
          className="rounded border p-8 text-center"
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
          className="rounded border overflow-hidden"
          style={{
            backgroundColor: "var(--aws-card)",
            borderColor: "var(--aws-border)",
          }}
        >
          <table className="aws-table w-full text-sm">
            <thead>
              <tr>
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={records.length > 0 && selected.size === records.length}
                    onChange={toggleSelectAll}
                    className="accent-[var(--aws-blue)]"
                  />
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs">
                  Record name
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs">
                  Type
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs">
                  Value
                </th>
                <th className="text-right px-4 py-2.5 font-semibold text-xs">
                  TTL
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
                    className="border-t transition-colors"
                    style={{
                      borderTopColor: "var(--aws-border-divider)",
                      backgroundColor: selected.has(record.id)
                        ? "var(--aws-blue-bg)"
                        : undefined,
                    }}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(record.id)}
                        onChange={() => toggleSelect(record.id)}
                        className="accent-[var(--aws-blue)]"
                      />
                    </td>
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
                borderTopColor: "var(--aws-border-divider)",
                backgroundColor: "var(--aws-table-header)",
              }}
            >
              <span style={{ color: "var(--aws-text-secondary)" }}>
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
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

      {/* Delete Record Modal */}
      <Modal
        open={!!showDelete}
        onClose={() => setShowDelete(null)}
        title={showDelete && showDelete.length === 1 ? "Delete record?" : "Delete records?"}
      >
        <p className="text-sm">
          {showDelete && showDelete.length === 1 ? (
            <>
              Are you sure you want to delete the{" "}
              <span
                className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold rounded mx-0.5"
                style={{
                  backgroundColor: "var(--aws-blue-bg)",
                  color: "var(--aws-blue)",
                  border: "1px solid #bde0fe",
                }}
              >
                {showDelete[0].type}
              </span>{" "}
              record for <strong>{showDelete[0].name}</strong>?
            </>
          ) : (
            <>
              Are you sure you want to delete <strong>{showDelete?.length}</strong> records?
            </>
          )}
        </p>
        <p className="text-xs mt-2" style={{ color: "var(--aws-red)" }}>
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setShowDelete(null)}
            className="btn-secondary px-3 py-1.5 text-sm rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm font-medium text-white rounded"
            style={{ backgroundColor: "var(--aws-red)" }}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
