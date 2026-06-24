"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import api, { authHeaders } from "@/lib/api";
import type { HostedZone } from "@/types";
import {
  Plus,
  Search,
  Globe,
  Edit3,
  Trash2,
  ChevronRight,
  RotateCw,
  Lock,
  Unlock,
} from "lucide-react";
import Modal from "@/components/Modal";

interface ZoneFormState {
  name: string;
  description: string;
  private_zone: boolean;
}

export default function HostedZonesPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<HostedZone | null>(null);
  const [showDelete, setShowDelete] = useState<HostedZone | null>(null);
  const [form, setForm] = useState<ZoneFormState>({
    name: "",
    description: "",
    private_zone: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/hosted-zones", {
        headers: authHeaders(),
        params: { search, page, page_size: pageSize },
      });
      setZones(res.data.zones);
      setTotal(res.data.total);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) fetchZones();
  }, [user, fetchZones]);

  const handleCreate = async () => {
    if (!form.name) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/hosted-zones", form, { headers: authHeaders() });
      setShowCreate(false);
      setForm({ name: "", description: "", private_zone: false });
      await fetchZones();
      toast.success(`Hosted zone "${form.name}" created`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const message = e.response?.data?.detail || "Failed to create hosted zone";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!showEdit || !form.name) return;
    setSaving(true);
    setError("");
    try {
      await api.put(`/hosted-zones/${showEdit.id}`, form, {
        headers: authHeaders(),
      });
      setShowEdit(null);
      setForm({ name: "", description: "", private_zone: false });
      await fetchZones();
      toast.success(`Hosted zone "${form.name}" updated`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const message = e.response?.data?.detail || "Failed to update hosted zone";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    const name = showDelete.name;
    try {
      await api.delete(`/hosted-zones/${showDelete.id}`, {
        headers: authHeaders(),
      });
      setShowDelete(null);
      await fetchZones();
      toast.success(`Hosted zone "${name}" deleted`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail || "Failed to delete hosted zone");
    }
  };

  const openCreate = () => {
    setForm({ name: "", description: "", private_zone: false });
    setError("");
    setShowCreate(true);
  };

  const openEdit = (z: HostedZone) => {
    setForm({
      name: z.name,
      description: z.description ?? "",
      private_zone: z.private_zone,
    });
    setError("");
    setShowEdit(z);
  };

  const totalPages = Math.ceil(total / pageSize);

  if (authLoading || !user) return null;

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-1 text-xs mb-4"
        style={{ color: "var(--aws-text-secondary)" }}
      >
        <span>Route 53</span>
        <ChevronRight className="w-3 h-3" />
        <span className="font-medium" style={{ color: "var(--aws-text)" }}>
          Hosted Zones
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Hosted Zones</h1>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--aws-text-secondary)" }}
          >
            {total} hosted zone{total !== 1 ? "s" : ""}
          </p>
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
          Create Hosted Zone
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--aws-text-secondary)" }}
        />
        <input
          type="text"
          placeholder="Search hosted zones..."
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

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RotateCw
            className="w-5 h-5 animate-spin"
            style={{ color: "var(--aws-primary)" }}
          />
        </div>
      ) : zones.length === 0 ? (
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
          <p className="text-sm font-medium">No hosted zones found</p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--aws-text-secondary)" }}
          >
            {search
              ? "Try a different search term"
              : "Create your first hosted zone to get started"}
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
                  Domain Name
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">
                  Description
                </th>
                <th className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">
                  Records
                </th>
                <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr
                  key={zone.id}
                  className="border-t cursor-pointer hover:bg-blue-50/30 transition-colors"
                  style={{ borderTopColor: "var(--aws-border)" }}
                  onClick={() => router.push(`/hosted-zones/${zone.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Globe
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "var(--aws-blue)" }}
                      />
                      <span
                        className="font-medium"
                        style={{ color: "var(--aws-blue)" }}
                      >
                        {zone.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
                      style={{
                        backgroundColor: zone.private_zone
                          ? "#fef3c7"
                          : "#eff6ff",
                        color: zone.private_zone
                          ? "#92400e"
                          : "var(--aws-blue)",
                        border: `1px solid ${zone.private_zone ? "#fde68a" : "#bfdbfe"}`,
                      }}
                    >
                      {zone.private_zone ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                      {zone.private_zone ? "Private" : "Public"}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: "var(--aws-text-secondary)" }}
                  >
                    {zone.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">{zone.record_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(zone);
                      }}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      title="Edit"
                    >
                      <Edit3
                        className="w-4 h-4"
                        style={{ color: "var(--aws-text-secondary)" }}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDelete(zone);
                      }}
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
              ))}
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

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Hosted Zone"
      >
        <ZoneForm form={form} onChange={setForm} />
        {error && (
          <p className="text-xs mt-2" style={{ color: "var(--aws-red)" }}>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setShowCreate(false)}
            className="px-3 py-1.5 text-sm border rounded"
            style={{ borderColor: "var(--aws-border)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.name}
            className="px-3 py-1.5 text-sm font-semibold text-white rounded disabled:opacity-50"
            style={{ backgroundColor: "var(--aws-blue)" }}
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!showEdit}
        onClose={() => setShowEdit(null)}
        title="Edit Hosted Zone"
      >
        <ZoneForm form={form} onChange={setForm} />
        {error && (
          <p className="text-xs mt-2" style={{ color: "var(--aws-red)" }}>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setShowEdit(null)}
            className="px-3 py-1.5 text-sm border rounded"
            style={{ borderColor: "var(--aws-border)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleEdit}
            disabled={saving || !form.name}
            className="px-3 py-1.5 text-sm font-semibold text-white rounded disabled:opacity-50"
            style={{ backgroundColor: "var(--aws-blue)" }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!showDelete}
        onClose={() => setShowDelete(null)}
        title="Delete Hosted Zone?"
      >
        <p className="text-sm">
          Are you sure you want to delete <strong>{showDelete?.name}</strong>?
          This will also delete all DNS records in this zone.
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

function ZoneForm({
  form,
  onChange,
}: {
  form: ZoneFormState;
  onChange: (f: ZoneFormState) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold mb-1">
          Domain Name <span style={{ color: "var(--aws-red)" }}>*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="example.com"
          className="w-full px-3 py-1.5 text-sm border rounded"
          style={{ borderColor: "var(--aws-border)" }}
        />
        <p
          className="text-[10px] mt-1"
          style={{ color: "var(--aws-text-secondary)" }}
        >
          Enter a domain name with a trailing dot (e.g., example.com.)
        </p>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Description</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Optional description"
          className="w-full px-3 py-1.5 text-sm border rounded"
          style={{ borderColor: "var(--aws-border)" }}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-2">Type</label>
        <div className="flex gap-4">
          {[false, true].map((isPrivate) => (
            <label
              key={String(isPrivate)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                checked={form.private_zone === isPrivate}
                onChange={() => onChange({ ...form, private_zone: isPrivate })}
                className="accent-[var(--aws-blue)]"
              />
              <span className="text-sm">
                {isPrivate ? "Private" : "Public"}
              </span>
            </label>
          ))}
        </div>
        <p
          className="text-[10px] mt-1"
          style={{ color: "var(--aws-text-secondary)" }}
        >
          {form.private_zone
            ? "Private zones are accessible only from within your VPCs"
            : "Public zones route traffic on the internet"}
        </p>
      </div>
    </div>
  );
}
