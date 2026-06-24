"use client";

import type { DNSRecord, RecordType } from "@/types";
import { RECORD_TYPES } from "@/types";

interface RecordFormProps {
  form: Partial<DNSRecord>;
  onChange: (f: Partial<DNSRecord>) => void;
  editing?: boolean;
}

const TTL_PRESETS = [
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
  { label: "1 hour", value: 3600 },
  { label: "1 day", value: 86400 },
];

type TypeDefaults = Pick<
  Partial<DNSRecord>,
  "priority" | "weight" | "port" | "flags" | "tag"
>;

const EMPTY_DEFAULTS: TypeDefaults = {
  priority: null,
  weight: null,
  port: null,
  flags: null,
  tag: null,
};

const TYPE_DEFAULTS: Record<RecordType, TypeDefaults> = {
  A: EMPTY_DEFAULTS,
  AAAA: EMPTY_DEFAULTS,
  CNAME: EMPTY_DEFAULTS,
  TXT: EMPTY_DEFAULTS,
  NS: EMPTY_DEFAULTS,
  PTR: EMPTY_DEFAULTS,
  MX: { ...EMPTY_DEFAULTS, priority: 10 },
  SRV: { ...EMPTY_DEFAULTS, priority: 0, weight: 0, port: 443 },
  CAA: { ...EMPTY_DEFAULTS, flags: 0, tag: "issue" },
};

const TYPE_HELP: Partial<Record<RecordType, string>> = {
  A: "IPv4 address, e.g. 192.0.2.1",
  AAAA: "IPv6 address, e.g. 2001:db8::1",
  CNAME: "Canonical name, e.g. www.example.com.",
  MX: "Mail server hostname, e.g. mail.example.com.",
  NS: "Name server hostname, e.g. ns1.example.com.",
  PTR: "Pointer to hostname, e.g. example.com.",
  SRV: "Target hostname, e.g. sip.example.com.",
  TXT: "Text string, e.g. v=spf1 include:example.com ~all",
  CAA: "CA domain name, e.g. letsencrypt.org",
};

export default function RecordForm({
  form,
  onChange,
  editing,
}: RecordFormProps) {
  const type = (form.type ?? "A") as RecordType;

  return (
    <div className="space-y-3">
      {/* Record Name */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Record Name <span style={{ color: "var(--aws-red)" }}>*</span>
        </label>
        <input
          type="text"
          value={form.name ?? ""}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="www, api, or @ for root"
          className="w-full px-3 py-1.5 text-sm border rounded font-mono"
          style={{ borderColor: "var(--aws-border)" }}
        />
      </div>

      {/* Record Type - read-only when editing */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Record Type <span style={{ color: "var(--aws-red)" }}>*</span>
        </label>
        {editing ? (
          <div
            className="w-full px-3 py-1.5 text-sm border rounded font-semibold"
            style={{
              borderColor: "var(--aws-border)",
              backgroundColor: "#f8fafc",
            }}
          >
            {type}
          </div>
        ) : (
          <select
            value={type}
            onChange={(e) =>
              onChange({
                ...form,
                type: e.target.value as RecordType,
                ...TYPE_DEFAULTS[e.target.value as RecordType],
              })
            }
            className="w-full px-3 py-1.5 text-sm border rounded"
            style={{ borderColor: "var(--aws-border)" }}
          >
            {RECORD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Value */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Value <span style={{ color: "var(--aws-red)" }}>*</span>
        </label>
        <textarea
          value={form.value ?? ""}
          onChange={(e) => onChange({ ...form, value: e.target.value })}
          placeholder={TYPE_HELP[type] ?? "Record value"}
          rows={type === "TXT" ? 3 : 2}
          className="w-full px-3 py-1.5 text-sm border rounded resize-none font-mono"
          style={{ borderColor: "var(--aws-border)" }}
        />
        {TYPE_HELP[type] && (
          <p
            className="text-[10px] mt-0.5"
            style={{ color: "var(--aws-text-secondary)" }}
          >
            {TYPE_HELP[type]}
          </p>
        )}
      </div>

      {/* TTL */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          TTL (seconds)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={form.ttl ?? 300}
            min={0}
            onChange={(e) =>
              onChange({ ...form, ttl: parseInt(e.target.value) || 300 })
            }
            className="flex-1 px-3 py-1.5 text-sm border rounded"
            style={{ borderColor: "var(--aws-border)" }}
          />
          <div className="flex gap-1">
            {TTL_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onChange({ ...form, ttl: p.value })}
                className="px-2 py-1 text-[10px] border rounded transition-colors"
                style={{
                  borderColor:
                    form.ttl === p.value
                      ? "var(--aws-blue)"
                      : "var(--aws-border)",
                  color:
                    form.ttl === p.value
                      ? "var(--aws-blue)"
                      : "var(--aws-text-secondary)",
                  backgroundColor:
                    form.ttl === p.value ? "#eff6ff" : "transparent",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MX Priority */}
      {type === "MX" && (
        <div>
          <label className="block text-xs font-semibold mb-1">Priority</label>
          <input
            type="number"
            value={form.priority ?? 10}
            min={0}
            onChange={(e) =>
              onChange({ ...form, priority: parseInt(e.target.value) || 10 })
            }
            className="w-full px-3 py-1.5 text-sm border rounded"
            style={{ borderColor: "var(--aws-border)" }}
          />
          <p
            className="text-[10px] mt-0.5"
            style={{ color: "var(--aws-text-secondary)" }}
          >
            Lower value = higher priority (e.g. 10 is higher priority than 20)
          </p>
        </div>
      )}

      {/* SRV fields: priority, weight, port */}
      {type === "SRV" && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-semibold mb-1">Priority</label>
            <input
              type="number"
              value={form.priority ?? 0}
              min={0}
              onChange={(e) =>
                onChange({ ...form, priority: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-1.5 text-sm border rounded"
              style={{ borderColor: "var(--aws-border)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Weight</label>
            <input
              type="number"
              value={form.weight ?? 0}
              min={0}
              onChange={(e) =>
                onChange({ ...form, weight: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-1.5 text-sm border rounded"
              style={{ borderColor: "var(--aws-border)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Port</label>
            <input
              type="number"
              value={form.port ?? 443}
              min={1}
              max={65535}
              onChange={(e) =>
                onChange({ ...form, port: parseInt(e.target.value) || 443 })
              }
              className="w-full px-3 py-1.5 text-sm border rounded"
              style={{ borderColor: "var(--aws-border)" }}
            />
          </div>
        </div>
      )}

      {/* CAA fields: flags, tag */}
      {type === "CAA" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold mb-1">Flags</label>
            <input
              type="number"
              value={form.flags ?? 0}
              min={0}
              max={255}
              onChange={(e) =>
                onChange({ ...form, flags: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-1.5 text-sm border rounded"
              style={{ borderColor: "var(--aws-border)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Tag</label>
            <select
              value={form.tag ?? "issue"}
              onChange={(e) => onChange({ ...form, tag: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border rounded"
              style={{ borderColor: "var(--aws-border)" }}
            >
              <option value="issue">issue</option>
              <option value="issuewild">issuewild</option>
              <option value="iodef">iodef</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
