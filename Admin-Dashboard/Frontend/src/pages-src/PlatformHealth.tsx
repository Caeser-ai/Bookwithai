"use client";

import { RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageLoader } from "@/components/PageLoader";
import type { AdminRealtimeResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

export function PlatformHealth() {
  const { data, loading, error, refresh } = useAdminData<AdminRealtimeResponse>("/api/admin/realtime", { refreshMs: 30000 });

  if (loading && !data) return <PageLoader />;

  const cards = [
    { label: "Active Sessions", value: data?.metrics.activeSessions ?? 0 },
    { label: "Active Chats", value: data?.metrics.activeChats ?? 0 },
    { label: "Messages Last Hour", value: data?.metrics.messagesLastHour ?? 0 },
    { label: "Avg Msg / Conversation", value: data?.metrics.avgMessagesPerConversation ?? 0 },
    { label: "Authenticated Users", value: data?.metrics.authenticatedUsers ?? 0 },
    { label: "Guest Sessions", value: data?.metrics.guestSessions ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Platform Health</h1>
          <p className="mt-1 text-sm text-gray-600">Live operational health from realtime admin session/activity endpoints.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">Last updated: {data?.generatedLabel ?? "Unavailable"}</div>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Session Message Load</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.sessionChart ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="messages" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Activity Feed</h3>
          <div className="space-y-3">
            {(data?.activityFeed ?? []).map((a) => (
              <div key={a.id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.action}</p>
                    <p className="text-xs text-gray-500">{a.userLabel} • {a.relativeTime}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${a.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
