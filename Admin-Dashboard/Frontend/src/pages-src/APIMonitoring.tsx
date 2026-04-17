"use client";

import { Activity, AlertTriangle, RefreshCw, Server } from "lucide-react";

import { PageLoader } from "@/components/PageLoader";
import type { AdminBehaviorPageResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

export function APIMonitoring() {
  const { data, loading, error, refresh } = useAdminData<AdminBehaviorPageResponse>(
    "/api/admin/behavior",
  );

  if (loading && !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">API Monitoring</h1>
          <p className="mt-1 text-sm text-gray-600">
            Live API and conversation throughput health from backend analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            Last updated: {data?.generatedLabel ?? "Unavailable"}
          </span>
          <button
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data?.metrics.slice(0, 4).map((metric) => (
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
            <Activity className="h-4 w-4 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Hourly Activity</h2>
          </div>
          <div className="space-y-3">
            {data?.activityTrend.slice(-8).map((point) => (
              <div key={point.label} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{point.label}</span>
                  <span className="text-gray-500">{point.sessions} sessions</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {point.messages} messages • {point.searches} searches
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Endpoint Activity</h2>
          </div>
          <div className="space-y-3">
            {data?.recentActivity.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.displayId}</p>
                  <p className="text-xs text-gray-500">{item.userLabel}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{item.searchCount} searches</p>
                  <p>{item.updatedLabel}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Live values are sourced from current conversation/session APIs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
