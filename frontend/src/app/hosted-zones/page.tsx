"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useShortcuts } from "@/lib/use-shortcuts";
import {
  useListZonesQuery,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
  apiErrorMessage,
} from "@/store/api";
import type { HostedZone } from "@/types";
import {
  Plus,
  Search,
  Globe,
  ChevronRight,
  ChevronDown,
  RotateCw,
  Lock,
  Unlock,
} from "lucide-react";
import Modal from "@/components/Modal";

export default function HostedZonesPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showEdit, setShowEdit] = useState<HostedZone | null>(null);
  const [showDelete, setShowDelete] = useState<HostedZone[] | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const actionsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data, isLoading: loading } = useListZonesQuery(
    { search, page, page_size: pageSize },
    { skip: !user },
  );
  const zones = data?.zones ?? [];
  const total = data?.total ?? 0;
  const [updateZone, { isLoading: saving }] = useUpdateZoneMutation();
  const [deleteZone] = useDeleteZoneMutation();

  useShortcuts([
    { key: "/", handler: () => searchRef.current?.focus() },
    { key: "c", handler: () => router.push("/hosted-zones/create") },
  ]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const handleEdit = async () => {
    if (!showEdit) return;
    setError("");
    try {
      await updateZone({ id: showEdit.id, description }).unwrap();
      setShowEdit(null);
      toast.success(`Hosted zone "${showEdit.name}" updated`);
    } catch (err: unknown) {
      const message = apiErrorMessage(err, "Failed to update hosted zone");
      setError(message);
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    const targets = showDelete;
    try {
      await Promise.all(targets.map((z) => deleteZone(z.id).unwrap()));
      setShowDelete(null);
      setSelected(new Set());
      toast.success(
        targets.length === 1
          ? `Hosted zone "${targets[0].name}" deleted`
          : `${targets.length} hosted zones deleted`,
      );
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, "Failed to delete hosted zone"));
    }
  };

  const openEdit = (z: HostedZone) => {
    setDescription(z.description ?? "");
    setError("");
    setShowEdit(z);
    setActionsOpen(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === zones.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(zones.map((z) => z.id)));
    }
  };

  const selectedZones = zones.filter((z) => selected.has(z.id));
  const totalPages = Math.ceil(total / pageSize);

  if (authLoading || !user) return null;

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div
        className="aws-breadcrumb flex items-center gap-1 text-xs mb-3"
        style={{ color: "var(--aws-text-secondary)" }}
      >
        <Link href="/">Route 53</Link>
        <ChevronRight className="w-3 h-3" />
        <span style={{ color: "var(--aws-text)" }}>Hosted zones</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-normal" style={{ color: "var(--aws-text)" }}>
          Hosted zones{" "}
          <span className="text-base" style={{ color: "var(--aws-text-secondary)" }}>
            ({total})
          </span>
        </h1>
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
                  style={{ backgroundColor: "var(--aws-surface)", borderColor: "var(--aws-border)" }}
                >
                  <button
                    disabled={selectedZones.length !== 1}
                    onClick={() => selectedZones.length === 1 && openEdit(selectedZones[0])}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Edit
                  </button>
                  <button
                    disabled={selectedZones.length === 0}
                    onClick={() => {
                      setShowDelete(selectedZones);
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
          <button
            onClick={() => router.push("/hosted-zones/create")}
            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create hosted zone
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--aws-text-secondary)" }}
        />
        <input
          ref={searchRef}
          type="text"
          placeholder="Find hosted zones  (press / to focus)"
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
            style={{ color: "var(--aws-blue)" }}
          />
        </div>
      ) : zones.length === 0 ? (
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
                    checked={zones.length > 0 && selected.size === zones.length}
                    onChange={toggleSelectAll}
                    className="accent-[var(--aws-blue)]"
                  />
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs">
                  Domain name
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs">
                  Type
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs">
                  Description
                </th>
                <th className="text-center px-4 py-2.5 font-semibold text-xs">
                  Record count
                </th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr
                  key={zone.id}
                  className="border-t cursor-pointer transition-colors"
                  style={{
                    borderTopColor: "var(--aws-border-divider)",
                    backgroundColor: selected.has(zone.id) ? "var(--aws-blue-bg)" : undefined,
                  }}
                  onClick={() => router.push(`/hosted-zones/${zone.id}`)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(zone.id)}
                      onChange={() => toggleSelect(zone.id)}
                      className="accent-[var(--aws-blue)]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Globe
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "var(--aws-blue)" }}
                      />
                      <span
                        className="font-medium hover:underline"
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
                          ? "var(--aws-orange-bg)"
                          : "var(--aws-blue-bg)",
                        color: zone.private_zone ? "#8a6116" : "var(--aws-blue)",
                        border: `1px solid ${zone.private_zone ? "#f2dba0" : "#bde0fe"}`,
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
                </tr>
              ))}
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

      {/* Edit Modal — only the description is editable, matching real Route 53 behavior */}
      <Modal
        open={!!showEdit}
        onClose={() => setShowEdit(null)}
        title="Edit hosted zone"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Domain name</label>
            <div
              className="w-full px-3 py-1.5 text-sm border rounded font-mono"
              style={{ borderColor: "var(--aws-border)", backgroundColor: "var(--aws-bg)" }}
            >
              {showEdit?.name}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-1.5 text-sm border rounded"
              style={{ borderColor: "var(--aws-border)" }}
            />
          </div>
        </div>
        {error && (
          <p className="text-xs mt-2" style={{ color: "var(--aws-red)" }}>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setShowEdit(null)}
            className="btn-secondary px-3 py-1.5 text-sm rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleEdit}
            disabled={saving}
            className="btn-primary px-3 py-1.5 text-sm font-medium rounded disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!showDelete}
        onClose={() => setShowDelete(null)}
        title={showDelete && showDelete.length === 1 ? "Delete hosted zone?" : "Delete hosted zones?"}
      >
        <p className="text-sm">
          {showDelete && showDelete.length === 1 ? (
            <>
              Are you sure you want to delete <strong>{showDelete[0].name}</strong>?
              This will also delete all DNS records in this zone.
            </>
          ) : (
            <>
              Are you sure you want to delete <strong>{showDelete?.length}</strong>{" "}
              hosted zones? This will also delete all DNS records in these zones.
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
