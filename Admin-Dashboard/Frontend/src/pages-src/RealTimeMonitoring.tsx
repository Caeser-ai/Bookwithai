"use client";

import { useState } from "react";
import {
  Activity,
  MessageSquare,
  RefreshCw,
  User,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageLoader } from "@/components/PageLoader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminConversationCard, AdminRealtimeResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

function Metric({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function RealTimeMonitoring() {
  const { data, loading, error, refresh } = useAdminData<AdminRealtimeResponse>(
    "/api/admin/realtime",
    { refreshMs: 15000 },
  );
  const [selectedChat, setSelectedChat] = useState<AdminConversationCard | null>(null);

  if (loading && !data) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Real-Time Monitoring</h2>
          <p className="mt-1 text-sm text-gray-600">
            Polling every 15 seconds using the new Week 1 admin backend layer.
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Metric
          label="Active Sessions"
          value={data?.metrics.activeSessions ?? 0}
          description="Updated in the last 10 minutes"
          icon={Activity}
        />
        <Metric
          label="Messages Last Hour"
          value={data?.metrics.messagesLastHour ?? 0}
          description="Based on recent conversation detail fetched from admin APIs"
          icon={MessageSquare}
        />
        <Metric
          label="Avg Messages / Conversation"
          value={data?.metrics.avgMessagesPerConversation ?? 0}
          description="Average across the active chat sample"
          icon={MessageSquare}
        />
        <Metric
          label="Loaded Sessions"
          value={data?.metrics.loadedSessions ?? 0}
          description="Recent sessions currently visible to the dashboard"
          icon={Users}
        />
        <Metric
          label="Authenticated Users"
          value={data?.metrics.authenticatedUsers ?? 0}
          description="Sessions currently tied to a backend user id"
          icon={User}
        />
        <Metric
          label="Guest Sessions"
          value={data?.metrics.guestSessions ?? 0}
          description="Anonymous session traffic in the current sample"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Conversation Volume</h3>
            <p className="text-sm text-gray-600">
              Message counts from the most recently loaded sessions.
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.sessionChart ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="messages" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Activity Feed</h3>
            <p className="text-sm text-gray-600">
              Derived from the newest sessions available to the admin API.
            </p>
          </div>
          <div className="space-y-3">
            {data?.activityFeed.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">{event.action}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      event.status === "Active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{event.userLabel}</p>
                <p className="mt-1 text-xs text-gray-500">{event.relativeTime}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Conversations</h3>
          <p className="text-sm text-gray-600">
            Click any card to inspect the latest message history.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {data?.activeChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className="rounded-xl border border-gray-200 p-5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{chat.userLabel}</p>
                  <p className="text-xs text-gray-500">{chat.displayId}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    chat.status === "Active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {chat.status}
                </span>
              </div>
              <p className="mt-4 text-sm text-gray-700">{chat.lastMessagePreview}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>{chat.messageCount} messages</span>
                <span>{chat.lastUpdatedLabel}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={Boolean(selectedChat)} onOpenChange={(open) => !open && setSelectedChat(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Conversation Detail</DialogTitle>
          </DialogHeader>
          {selectedChat ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-900">{selectedChat.userLabel}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedChat.displayId} • {selectedChat.messageCount} messages •{" "}
                  {selectedChat.lastUpdatedLabel}
                </p>
              </div>
              <div className="max-h-[420px] space-y-3 overflow-y-auto">
                {selectedChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-xl p-4 ${
                      message.role === "assistant"
                        ? "ml-8 bg-blue-50 text-gray-900"
                        : "mr-8 bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      {message.role} • {message.timeLabel}
                    </div>
                    <p className="text-sm leading-6">{message.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
