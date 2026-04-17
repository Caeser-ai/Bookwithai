"use client";

import { ExternalLink, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";

import { PageLoader } from "@/components/PageLoader";
import type { AdminFunnelPageResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

export function RedirectAnalytics() {
  const { data, loading, error, refresh } = useAdminData<AdminFunnelPageResponse>(
    "/api/admin/funnel",
  );

  if (loading && !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Redirect Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Live redirect funnel and route conversion signals from backend data.
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
        {data?.metrics.map((metric) => (
          <div key={metric.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{metric.value}</p>
            <p className="mt-2 text-sm text-gray-500">{metric.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Funnel Drop-offs</h2>
          <div className="space-y-3">
            {data?.dropOffs.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{item.label}</span>
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    {item.dropPercentage.toFixed(1)}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{item.dropCount.toLocaleString()} users/events</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Top Redirect Routes</h2>
          <div className="space-y-3">
            {data?.topRoutes.map((route) => (
              <div key={route.label} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{route.label}</span>
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    {route.count.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Redirect metrics are live from tracked conversation-to-link events.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
