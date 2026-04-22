"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  RefreshCw,
  Server,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageLoader } from "@/components/PageLoader";
import type { AdminBehaviorPageResponse, AdminMetricCard } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

const toneMap: Record<AdminMetricCard["tone"], string> = {
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  green: "bg-emerald-50 text-emerald-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-700",
};

export function APIMonitoring() {
  const { data, loading, error, refresh } = useAdminData<AdminBehaviorPageResponse>(
    "/api/admin/behavior",
  );
  const [dateRange, setDateRange] = useState("24h");
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const totals = useMemo(() => {
    const trend = data?.activityTrend ?? [];
    return {
      sessions: trend.reduce((sum, item) => sum + item.sessions, 0),
      messages: trend.reduce((sum, item) => sum + item.messages, 0),
      searches: trend.reduce((sum, item) => sum + item.searches, 0),
    };
  }, [data]);

  if (loading && !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">API Monitoring & Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Current admin coverage for throughput, workload, and recent conversation-driven API
            demand.
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Server className="h-4 w-4" />
            <select
              value={providerFilter}
              onChange={(event) => setProviderFilter(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
            >
              <option value="all">All providers</option>
              <option value="internal">Internal only</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Activity className="h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
            </select>
          </div>
          <div className="ml-auto rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Endpoint latency, status codes, p95/p99, and API-key telemetry are not yet stored.
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data?.metrics.slice(0, 5).map((metric) => (
          <div key={metric.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{metric.value}</p>
                <p className="mt-2 text-sm text-gray-500">{metric.description}</p>
              </div>
              <div className={`rounded-xl p-3 ${toneMap[metric.tone]}`}>
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Observed Endpoint Workload</h2>
        <p className="mt-1 text-sm text-gray-600">
          Recent conversation sessions are used as the current proxy for endpoint/API workload.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Session</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Messages</th>
                <th className="px-4 py-3 font-medium">Searches</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentActivity ?? []).slice(0, 8).map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.displayId}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{item.userLabel}</td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{item.messageCount}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{item.searchCount}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{item.updatedLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Request Volume Analytics</h2>
          <p className="mt-1 text-sm text-gray-600">
            Session, message, and search throughput grouped by activity trend buckets.
          </p>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.activityTrend ?? []}>
                <defs>
                  <linearGradient id="apiSessionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#3B82F6"
                  fill="url(#apiSessionsGradient)"
                  name="Sessions"
                />
                <Line type="monotone" dataKey="messages" stroke="#8B5CF6" strokeWidth={2} name="Messages" />
                <Line type="monotone" dataKey="searches" stroke="#10B981" strokeWidth={2} name="Searches" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Search Load Distribution</h2>
          <p className="mt-1 text-sm text-gray-600">
            Distribution of how often sessions trigger search-heavy API behavior.
          </p>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.searchDistribution ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Message & Duration Diagnostics</h2>
          <p className="mt-1 text-sm text-gray-600">
            Current admin behavior analytics support message-volume and session-duration inspection,
            but not true error logs or latency percentiles.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.messageDistribution ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} angle={-12} textAnchor="end" height={60} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.sessionDurationDistribution ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} angle={-12} textAnchor="end" height={60} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Unsupported Telemetry</h2>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              No per-endpoint latency, p95/p99, or status-code history is currently stored.
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              API key inventory, quota usage, and real cost-per-provider management need dedicated
              backend config tables and telemetry.
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">Observed workload totals</p>
              <p className="mt-2 text-sm text-gray-600">
                {totals.sessions.toLocaleString()} sessions, {totals.messages.toLocaleString()} messages,
                {" "}
                and {totals.searches.toLocaleString()} searches in the current activity window.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
