"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Server,
  Settings,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageLoader } from "@/components/PageLoader";
import type { AdminRealtimeResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

export function PlatformHealth() {
  const { data, loading, error, refresh } = useAdminData<AdminRealtimeResponse>(
    "/api/admin/realtime",
    { refreshMs: 30000 },
  );
  const [dateRange, setDateRange] = useState("24h");
  const [environment, setEnvironment] = useState("production");
  const [serviceFilter, setServiceFilter] = useState("all");

  if (loading && !data) return <PageLoader />;

  const statusLabel =
    (data?.metrics.activeSessions ?? 0) > 0 ? "Realtime activity available" : "Waiting for activity";
  const healthCards = [
    { label: "Active Sessions", value: data?.metrics.activeSessions ?? 0, color: "text-blue-600" },
    { label: "Active Chats", value: data?.metrics.activeChats ?? 0, color: "text-purple-600" },
    { label: "Messages Last Hour", value: data?.metrics.messagesLastHour ?? 0, color: "text-emerald-600" },
    {
      label: "Avg Msg / Conversation",
      value: data?.metrics.avgMessagesPerConversation ?? 0,
      color: "text-orange-600",
    },
    { label: "Authenticated Users", value: data?.metrics.authenticatedUsers ?? 0, color: "text-cyan-600" },
    { label: "Guest Sessions", value: data?.metrics.guestSessions ?? 0, color: "text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Platform Health Monitoring</h1>
          <p className="mt-1 text-sm text-gray-600">
            Realtime operational signals from current session and conversation activity.
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
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
              <option value="1h">Last 1 hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Server className="h-4 w-4" />
            <select
              value={environment}
              onChange={(event) => setEnvironment(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Settings className="h-4 w-4" />
            <select
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
            >
              <option value="all">All services</option>
              <option value="chat">Chat sessions</option>
              <option value="admin">Admin APIs</option>
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            {statusLabel}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {healthCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">{card.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${card.color}`}>{card.value}</p>
            <p className="mt-2 text-sm text-gray-500">Live from the admin realtime polling endpoint</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversation Load Trend</h2>
          <p className="text-sm text-gray-600">
            Observed message volume across the most recently loaded chat sessions.
          </p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.sessionChart ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Realtime Activity Feed</h2>
          </div>
          <div className="space-y-3">
            {(data?.activityFeed ?? []).map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.action}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.userLabel} • {item.relativeTime}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.status === "Active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Live Session Sample</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(data?.activeChats ?? []).map((chat) => ({
                  label: chat.displayId,
                  messages: chat.messageCount,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} hide />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="messages" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {(data?.activeChats ?? []).slice(0, 4).map((chat) => (
              <div key={chat.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{chat.userLabel}</p>
                    <p className="text-xs text-gray-500">{chat.lastMessagePreview}</p>
                  </div>
                  <span className="text-xs text-gray-500">{chat.messageCount} msgs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Supported Health Signals</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">Session Load</p>
              <p className="mt-1 text-sm text-gray-600">
                Supported through active sessions, message counts, and activity feed data.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">Authenticated vs Guest Split</p>
              <p className="mt-1 text-sm text-gray-600">
                Backed by realtime session ownership on current admin endpoints.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">Recent Operational Activity</p>
              <p className="mt-1 text-sm text-gray-600">
                Derived from newly updated chat sessions rather than infrastructure probes.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Not Tracked Yet</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              CPU, memory, disk, uptime, network throughput, and true service health require a real
              infrastructure telemetry pipeline.
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              API latency percentiles and frontend page-load timings are not persisted in the current
              user/chat databases.
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              This page keeps the Figma operational layout but replaces unsupported widgets with
              truthful realtime chat-activity signals.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
