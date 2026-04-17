"use client";

import { RefreshCw, TrendingUp, Users } from "lucide-react";

import { PageLoader } from "@/components/PageLoader";
import type { AdminGrowthPageResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

export function Retention() {
  const { data, loading, error, refresh } = useAdminData<AdminGrowthPageResponse>(
    "/api/admin/growth",
  );

  if (loading && !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Retention Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Live retention and engagement trend view from growth analytics data.
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Growth Trend</h2>
          </div>
          <div className="space-y-3">
            {data?.growthTrend.slice(-8).map((point) => (
              <div key={point.label} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{point.label}</span>
                  <span className="text-gray-500">{point.activeUsers} active users</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {point.users} new • {point.sessions} sessions • {point.searches} searches
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Funnel Stage Retention</h2>
          </div>
          <div className="space-y-3">
            {data?.funnelStages.map((stage) => (
              <div key={stage.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{stage.label}</span>
                  <span className="text-gray-500">
                    {stage.count.toLocaleString()} ({stage.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${Math.max(2, stage.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
