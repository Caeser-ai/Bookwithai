"use client";

import { RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageLoader } from "@/components/PageLoader";
import type { AdminFunnelPageResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

const toneMap = {
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  green: "bg-emerald-50 text-emerald-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-700",
};

export function UserFunnel() {
  const { data, loading, error, refresh } = useAdminData<AdminFunnelPageResponse>(
    "/api/admin/funnel",
  );

  if (loading && !data) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Funnel</h1>
          <p className="mt-1 text-sm text-gray-600">
            Live conversion steps from user registration through search and redirect activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            Last updated: {data?.generatedLabel ?? "Unavailable"}
          </div>
          <button
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
        {data?.metrics.map((metric) => (
          <div key={metric.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{metric.value}</p>
                <p className="mt-2 text-sm text-gray-500">{metric.description}</p>
              </div>
              <div className={`rounded-xl p-3 ${toneMap[metric.tone]}`}>
                <RefreshCw className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Stage Volume</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.stages ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} angle={-15} textAnchor="end" height={70} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Drop-Off Hotspots</h2>
          </div>
          <div className="space-y-4">
            {data?.dropOffs.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <span className="text-sm text-gray-500">{item.dropCount}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: `${Math.max(item.dropPercentage, 6)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">{item.dropPercentage}% drop-off</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Seven-Day Funnel Trend</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="conversations" stroke="#2563eb" strokeWidth={3} />
              <Line type="monotone" dataKey="searches" stroke="#10b981" strokeWidth={3} />
              <Line type="monotone" dataKey="redirects" stroke="#f59e0b" strokeWidth={3} />
              <Line type="monotone" dataKey="trips" stroke="#8b5cf6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Routes</h2>
          </div>
          <div className="space-y-3">
            {data?.topRoutes.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="mt-1 text-xs text-gray-500">{item.count} trips</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Prompts</h2>
          </div>
          <div className="space-y-3">
            {data?.topPrompts.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="mt-1 text-xs text-gray-500">{item.count} prompts</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
