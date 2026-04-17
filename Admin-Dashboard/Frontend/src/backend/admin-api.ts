import {
  BackendAdminBehaviorResponse,
  BackendAdminFeedbackDetail,
  BackendAdminFeedbackResponse,
  BackendAdminFunnelResponse,
  BackendAdminMetricsOverviewResponse,
  BackendAdminSessionDetail,
  BackendAdminSessionsResponse,
  BackendAdminUsersAnalyticsResponse,
  UiFeedbackStatus,
} from "@/lib/admin-types";

export class AdminBackendError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "AdminBackendError";
    this.status = status;
  }
}

function normalizeBase(base: string): string {
  return base.replace(/\/+$/, "");
}

function buildBackendUrl(base: string, path: string): string {
  const normalizedBase = normalizeBase(base);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedBase.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${normalizedBase}${normalizedPath.slice(4)}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

function getBackendConfig() {
  const baseUrl =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_API_BASE ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "http://localhost:8000";
  const adminToken = process.env.ADMIN_TOKEN ?? process.env.BACKEND_ADMIN_TOKEN;

  if (!adminToken) {
    throw new AdminBackendError(
      "ADMIN_TOKEN is missing. Set the same ADMIN_TOKEN value in Admin-Dashboard/Frontend/.env.local and the Website/backend environment.",
      500,
    );
  }

  return { baseUrl, adminToken };
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function fetchAdminBackend<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { baseUrl, adminToken } = getBackendConfig();
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");
  headers.set("x-admin-token", adminToken);

  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(buildBackendUrl(baseUrl, path), {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new AdminBackendError(
      `Could not reach the website backend at ${baseUrl}. Start the real backend first and then refresh the admin dashboard.`,
      502,
    );
  }

  const payload = await parseJson<{ detail?: string } & T>(response);

  if (!response.ok) {
    throw new AdminBackendError(
      payload?.detail || `Admin backend request failed with ${response.status}.`,
      response.status,
    );
  }

  if (!payload) {
    throw new AdminBackendError("Admin backend returned an empty response.", 502);
  }

  return payload as T;
}

export function mapUiStatusToBackend(status: UiFeedbackStatus) {
  switch (status) {
    case "Open":
      return "new";
    case "Investigating":
      return "in_review";
    case "Resolved":
      return "resolved";
    case "Closed":
      return "dismissed";
    default:
      return "new";
  }
}

export async function getAdminOverviewMetrics() {
  return fetchAdminBackend<BackendAdminMetricsOverviewResponse>(
    "/api/admin/metrics/overview",
  );
}

export async function getAdminFeedbackList(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetchAdminBackend<BackendAdminFeedbackResponse>(`/api/admin/feedback${query}`);
}

export async function getAdminFeedbackDetail(feedbackId: string) {
  return fetchAdminBackend<BackendAdminFeedbackDetail>(
    `/api/admin/feedback/${encodeURIComponent(feedbackId)}`,
  );
}

export async function patchAdminFeedbackStatus(
  feedbackId: string,
  status: UiFeedbackStatus,
) {
  const backendStatus = mapUiStatusToBackend(status);
  return fetchAdminBackend<{ ok: boolean }>(
    `/api/admin/feedback/${encodeURIComponent(feedbackId)}?status=${encodeURIComponent(backendStatus)}`,
    {
      method: "PATCH",
    },
  );
}

export async function getAdminSessionsList() {
  return fetchAdminBackend<BackendAdminSessionsResponse>("/api/admin/sessions");
}

export async function getAdminSessionDetail(sessionId: string) {
  return fetchAdminBackend<BackendAdminSessionDetail>(
    `/api/admin/sessions/${encodeURIComponent(sessionId)}`,
  );
}

export async function getAdminUsersAnalytics() {
  return fetchAdminBackend<BackendAdminUsersAnalyticsResponse>(
    "/api/admin/users/analytics",
  );
}

export async function getAdminFunnelAnalytics() {
  return fetchAdminBackend<BackendAdminFunnelResponse>("/api/admin/funnel");
}

export async function getAdminBehaviorAnalytics() {
  return fetchAdminBackend<BackendAdminBehaviorResponse>("/api/admin/behavior");
}

export function getRouteError(err: unknown) {
  if (err instanceof AdminBackendError) {
    return {
      status: err.status,
      detail: err.message,
    };
  }

  return {
    status: 500,
    detail: err instanceof Error ? err.message : "Unexpected admin API failure.",
  };
}
