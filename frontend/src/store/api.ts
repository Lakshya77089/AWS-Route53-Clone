import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import type { DNSRecord, HostedZone } from "@/types";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:8000/api",
  prepareHeaders: (headers) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// Wrap the base query so a 401 clears the token and redirects to /login,
// mirroring the previous axios interceptor behavior.
const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, store, extraOptions) => {
  const result = await rawBaseQuery(args, store, extraOptions);
  if (result.error?.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("token");
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
  return result;
};

interface Paginated {
  total: number;
  page: number;
  page_size: number;
}

interface PaginatedZones extends Paginated {
  zones: HostedZone[];
}
interface PaginatedRecords extends Paginated {
  records: DNSRecord[];
}

interface LoginResponse {
  user: { id: number; username: string };
  token: string;
}

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Zone", "Record"],
  endpoints: (build) => ({
    // ─── Auth ──────────────────────────────────────────────────────────
    me: build.query<{ id: number; username: string }, void>({
      query: () => "/auth/me",
    }),
    login: build.mutation<
      LoginResponse,
      { username: string; password: string }
    >({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),

    // ─── Hosted Zones ──────────────────────────────────────────────────
    listZones: build.query<
      PaginatedZones,
      { search?: string; page?: number; page_size?: number }
    >({
      query: (params) => ({ url: "/hosted-zones", params }),
      providesTags: ["Zone"],
    }),
    getZone: build.query<HostedZone, string>({
      query: (id) => `/hosted-zones/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Zone", id }],
    }),
    createZone: build.mutation<
      HostedZone,
      { name: string; description?: string; private_zone: boolean }
    >({
      query: (body) => ({ url: "/hosted-zones", method: "POST", body }),
      invalidatesTags: ["Zone"],
    }),
    updateZone: build.mutation<
      HostedZone,
      { id: string; description?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/hosted-zones/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ["Zone", { type: "Zone", id }],
    }),
    deleteZone: build.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/hosted-zones/${id}`, method: "DELETE" }),
      invalidatesTags: ["Zone"],
    }),

    // ─── DNS Records ───────────────────────────────────────────────────
    listRecords: build.query<
      PaginatedRecords,
      {
        zoneId: string;
        search?: string;
        type?: string;
        page?: number;
        page_size?: number;
      }
    >({
      query: ({ zoneId, ...params }) => ({
        url: `/hosted-zones/${zoneId}/records`,
        params,
      }),
      providesTags: ["Record"],
    }),
    getRecord: build.query<DNSRecord, { zoneId: string; recordId: string }>({
      query: ({ zoneId, recordId }) =>
        `/hosted-zones/${zoneId}/records/${recordId}`,
    }),
    createRecord: build.mutation<
      DNSRecord,
      { zoneId: string; body: Partial<DNSRecord> }
    >({
      query: ({ zoneId, body }) => ({
        url: `/hosted-zones/${zoneId}/records`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Record", "Zone"],
    }),
    updateRecord: build.mutation<
      DNSRecord,
      { zoneId: string; recordId: string; body: Partial<DNSRecord> }
    >({
      query: ({ zoneId, recordId, body }) => ({
        url: `/hosted-zones/${zoneId}/records/${recordId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Record", "Zone"],
    }),
    deleteRecord: build.mutation<
      { message: string },
      { zoneId: string; recordId: string }
    >({
      query: ({ zoneId, recordId }) => ({
        url: `/hosted-zones/${zoneId}/records/${recordId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Record", "Zone"],
    }),

    // ─── Import / Export ───────────────────────────────────────────────
    importZone: build.mutation<
      { imported: number; skipped: number; errors: string[] },
      { zoneId: string; content: string }
    >({
      query: ({ zoneId, content }) => ({
        url: `/hosted-zones/${zoneId}/import`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["Record", "Zone"],
    }),
  }),
});

export const {
  useMeQuery,
  useLoginMutation,
  useListZonesQuery,
  useGetZoneQuery,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
  useListRecordsQuery,
  useGetRecordQuery,
  useCreateRecordMutation,
  useUpdateRecordMutation,
  useDeleteRecordMutation,
  useImportZoneMutation,
} = api;

/** Pull a human-readable message out of an RTK Query error. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { data?: { detail?: string } } | undefined;
  return e?.data?.detail || fallback;
}

// Export is a raw download (file response), so it stays outside RTK Query's
// JSON cache and uses fetch directly.
export async function exportZone(
  zoneId: string,
  format: "json" | "bind",
): Promise<string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(
    `http://localhost:8000/api/hosted-zones/${zoneId}/export?format=${format}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  if (!res.ok) throw new Error("Export failed");
  return res.text();
}
