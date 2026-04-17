"use client";

import { RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageLoader } from "@/components/PageLoader";
import type { AdminBehaviorPageResponse, AdminFunnelPageResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

export function AIPerformance() {
  const growth = useAdminData<AdminFunnelPageResponse>("/api/admin/funnel");
  const behavior = useAdminData<AdminBehaviorPageResponse>("/api/admin/behavior");

  if ((growth.loading || behavior.loading) && !growth.data && !behavior.data) return <PageLoader />;

  const error = growth.error || behavior.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">AI Performance</h1>
          <p className="mt-1 text-sm text-gray-600">Live AI conversation/search funnel and behavior performance data.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            Last updated: {growth.data?.generatedLabel ?? behavior.data?.generatedLabel ?? "Unavailable"}
          </div>
          <button onClick={() => { void growth.refresh(); void behavior.refresh(); }} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-600">Conversations</p><p className="mt-2 text-3xl font-semibold text-gray-900">{growth.data?.stages.find((s) => s.key === "conversations")?.count ?? 0}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-600">Flight Searches</p><p className="mt-2 text-3xl font-semibold text-gray-900">{growth.data?.stages.find((s) => s.key === "searches")?.count ?? 0}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-600">Redirect Clicks</p><p className="mt-2 text-3xl font-semibold text-gray-900">{growth.data?.stages.find((s) => s.key === "redirects")?.count ?? 0}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-600">Avg Searches/Session</p><p className="mt-2 text-3xl font-semibold text-gray-900">{behavior.data?.metrics.find((m) => m.id === "avg-searches")?.value ?? "0"}</p></div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">AI Funnel Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth.data?.trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="searches" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="redirects" stroke="#059669" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Hourly AI Activity</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={behavior.data?.activityTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="messages" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                <Bar dataKey="searches" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
