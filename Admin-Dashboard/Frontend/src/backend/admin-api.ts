import {
  BackendAdminApiMonitoringResponse,
  BackendAdminAiPerformanceResponse,
  BackendAdminBehaviorResponse,
  BackendAdminFeedbackDetail,
  BackendAdminFeedbackResponse,
  BackendAdminFeedbackSummaryV2Response,
  BackendAdminFunnelResponse,
  BackendAdminMetricsOverviewResponse,
  BackendAdminRetentionResponse,
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

function withDays(path: string, days?: number): string {
  if (!days) return path;
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}days=${encodeURIComponent(String(days))}`;
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
    process.env.ADMIN_BACKEND_URL ??
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_API_BASE ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "https://bookwithai-t9b1.vercel.app/";
  const adminToken = process.env.ADMIN_TOKEN ?? process.env.BACKEND_ADMIN_TOKEN;

  if (!adminToken) {
    throw new AdminBackendError(
      "ADMIN_TOKEN is missing. Set the same ADMIN_TOKEN value in Admin-Dashboard/Frontend/.env.local and the Website/backend environment.",
      500,
    );
  }

  return { baseUrl, adminToken };
}

function getBackendTimeoutMs(): number {
  const raw = process.env.ADMIN_BACKEND_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed >= 5_000) {
    return parsed;
  }
  // 60s is generous enough for the first cold build of admin data, but still
  // short enough to prevent the browser from hanging on a stuck backend.
  return 60_000;
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
  const timeoutMs = getBackendTimeoutMs();
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");
  headers.set("x-admin-token", adminToken);

  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    response = await fetch(buildBackendUrl(baseUrl, path), {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AdminBackendError(
        `Admin backend timed out after ${Math.round(timeoutMs / 1000)}s for ${path}.`,
        504,
      );
    }
    throw new AdminBackendError(
      `Could not reach the website backend at ${baseUrl}. Start the real backend first and then refresh the admin dashboard.`,
      502,
    );
  } finally {
    clearTimeout(timeoutId);
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

export async function getAdminOverviewMetrics(days?: number) {
  return fetchAdminBackend<BackendAdminMetricsOverviewResponse>(
    withDays("/api/admin/metrics/overview", days),
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

export async function getAdminUsersAnalytics(days?: number) {
  return fetchAdminBackend<BackendAdminUsersAnalyticsResponse>(
    withDays("/api/admin/users/analytics", days),
  );
}

export async function getAdminFunnelAnalytics(days?: number) {
  return fetchAdminBackend<BackendAdminFunnelResponse>(withDays("/api/admin/funnel", days));
}

export async function getAdminBehaviorAnalytics(days?: number) {
  return fetchAdminBackend<BackendAdminBehaviorResponse>(withDays("/api/admin/behavior", days));
}

export async function getAdminAiPerformance(days?: number) {
  return fetchAdminBackend<BackendAdminAiPerformanceResponse>(
    withDays("/api/admin/ai/performance", days),
  );
}

export async function getAdminFeedbackSummaryV2() {
  return fetchAdminBackend<BackendAdminFeedbackSummaryV2Response>(
    "/api/admin/feedback/summary",
  );
}

export async function getAdminRetention(days?: number) {
  return fetchAdminBackend<BackendAdminRetentionResponse>(
    withDays("/api/admin/retention", days),
  );
}

export async function getAdminApiMonitoring(days?: number) {
  const window = days ? `${days}d` : undefined;
  const path = window ? `/api/admin/api-monitoring?window=${encodeURIComponent(window)}` : "/api/admin/api-monitoring";
  return fetchAdminBackend<BackendAdminApiMonitoringResponse>(
    path,
  );
}

export async function getBackendHealth() {
  return fetchAdminBackend<{ status?: string; version?: string; service?: string }>(
    "/api/health",
  );
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
