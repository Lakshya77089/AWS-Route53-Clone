export interface HostedZone {
  id: string;
  name: string;
  description: string | null;
  private_zone: boolean;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface DNSRecord {
  id: string;
  zone_id: string;
  name: string;
  type: RecordType;
  value: string;
  ttl: number;
  priority: number | null;
  weight: number | null;
  port: number | null;
  flags: number | null;
  tag: string | null;
  created_at: string;
  updated_at: string;
}

export type RecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "NS"
  | "PTR"
  | "SRV"
  | "TXT"
  | "CAA";

export const RECORD_TYPES: RecordType[] = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "PTR",
  "SRV",
  "TXT",
  "CAA",
];
