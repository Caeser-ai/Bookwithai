"use client";

import { RefreshCw, Settings as SettingsIcon, Shield, Users } from "lucide-react";
import { useState } from "react";

import { PageLoader } from "@/components/PageLoader";
import type { AdminOverviewResponse, AdminUsersPageResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

export function Settings() {
  const overview = useAdminData<AdminOverviewResponse>("/api/admin/overview");
  const users = useAdminData<AdminUsersPageResponse>("/api/admin/users");

  const [featureFlags, setFeatureFlags] = useState({
    aiChat: true,
    redirectTracking: true,
    feedbackCollection: true,
    exportAccess: true,
  });

  const loading = overview.loading && users.loading && !overview.data && !users.data;
  if (loading) return <PageLoader />;

  const toggleFlag = (key: keyof typeof featureFlags) => {
    setFeatureFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Settings page now backed by live admin API totals and activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              void overview.refresh();
              void users.refresh();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {overview.error || users.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {overview.error ?? users.error}
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
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Feature Toggles</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(featureFlags).map(([key, enabled]) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <span className="text-sm text-gray-800">{key}</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleFlag(key as keyof typeof featureFlags)}
                />
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Toggle state is local UI for now; cards and users are live-backed.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Most Active Users</h2>
          </div>
          <div className="space-y-3">
            {users.data?.users.slice(0, 8).map((user) => (
              <div key={user.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{user.email}</span>
                  <span className="text-xs text-gray-500">{user.role}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {user.sessionCount} sessions • {user.searchCount} searches • {user.lastActiveLabel}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              User activity and admin metrics are now live from backend endpoints.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
