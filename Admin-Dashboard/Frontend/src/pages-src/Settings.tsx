"use client";

import { useState } from "react";
import {
  Bell,
  Database,
  FileText,
  Power,
  RefreshCw,
  Settings as SettingsIcon,
  Shield,
  Users,
} from "lucide-react";

import { PageLoader } from "@/components/PageLoader";
import type { AdminOverviewResponse, AdminUsersPageResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

export function Settings() {
  const overview = useAdminData<AdminOverviewResponse>("/api/admin/overview");
  const users = useAdminData<AdminUsersPageResponse>("/api/admin/users");

  const [featureFlags, setFeatureFlags] = useState({
    aiChat: true,
    flightSearch: true,
    routeAnalytics: true,
    redirectTracking: true,
    feedbackSystem: true,
    priceAlerts: false,
  });
  const [notifications, setNotifications] = useState({
    email: true,
    dashboard: true,
    performanceAlerts: true,
    securityAlerts: true,
  });

  const loading = (overview.loading || users.loading) && !overview.data && !users.data;
  if (loading) return <PageLoader />;

  const toggleFeature = (key: keyof typeof featureFlags) => {
    setFeatureFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const error = overview.error ?? users.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Super Admin Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Live admin summaries with truthful read-only fallbacks for settings that do not yet have
            persistence.
          </p>
        </div>
        <button
          onClick={() => {
            void overview.refresh();
            void users.refresh();
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(overview.data?.metrics.slice(0, 2) ?? []).map((metric) => (
          <div key={metric.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{metric.value}</p>
            <p className="mt-2 text-sm text-gray-500">{metric.description}</p>
          </div>
        ))}
        {(users.data?.metrics.slice(0, 2) ?? []).map((metric) => (
          <div key={metric.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{metric.value}</p>
            <p className="mt-2 text-sm text-gray-500">{metric.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Feature Toggles</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(featureFlags).map(([key, enabled]) => (
              <label key={key} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{key}</p>
                  <p className="mt-1 text-xs text-gray-500">Local UI only until backend config storage exists.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleFeature(key as keyof typeof featureFlags)}
                  className="h-4 w-4"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            These toggles intentionally do not persist yet because there is no admin settings model
            or write API behind them.
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Most Active Users</h2>
          </div>
          <div className="space-y-3">
            {(users.data?.powerUsers.length ? users.data.powerUsers : users.data?.users ?? [])
              .slice(0, 8)
              .map((user) => (
                <div key={user.id} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {user.sessionCount} sessions • {user.searchCount} searches •{" "}
                        {user.lastActiveLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                      {user.role}
                    </span>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
            Live user activity comes from the admin analytics endpoints already backing the dashboard.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notification & Alert Settings</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(notifications).map(([key, enabled]) => (
              <label key={key} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{key}</p>
                  <p className="mt-1 text-xs text-gray-500">Read-only UI state for now.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleNotification(key as keyof typeof notifications)}
                  className="h-4 w-4"
                />
              </label>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Notification channels are not persisted because admin preference storage has not been
            added yet.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Security & Access Notes</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">Admin access model</p>
              <p className="mt-1 text-sm text-gray-600">
                This page currently surfaces read-only analytics. Role management, IP allowlists,
                and session timeout settings require dedicated backend support.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">Last overview refresh</p>
              <p className="mt-1 text-sm text-gray-600">{overview.data?.generatedLabel ?? "Unavailable"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">Last user analytics refresh</p>
              <p className="mt-1 text-sm text-gray-600">{users.data?.generatedLabel ?? "Unavailable"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
          </div>
          <div className="space-y-3">
            {(overview.data?.recentFeedback ?? []).slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">{item.category}</p>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{item.messagePreview}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {item.email} • {item.relativeSubmitted}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">System Snapshot</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-900">Registered users</p>
                <span className="text-sm text-gray-700">{users.data?.totalUserCount ?? 0}</span>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-900">Power users surfaced</p>
                <span className="text-sm text-gray-700">{users.data?.powerUsers.length ?? 0}</span>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-900">Recent sessions sampled</p>
                <span className="text-sm text-gray-700">{overview.data?.recentSessions.length ?? 0}</span>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2">
                <Power className="h-4 w-4 text-gray-600" />
                <p className="text-sm text-gray-700">
                  Cache management, backups, and role editing remain intentionally read-only until
                  dedicated admin write APIs are implemented.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
