"use client";

import { Activity, Clock, MessageSquare, RefreshCw } from "lucide-react";

import { PageLoader } from "@/components/PageLoader";
import type { AdminRealtimeResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

function ChatMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div className="mt-3 text-3xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export function LiveChatMonitor() {
  const { data, loading, error, refresh } = useAdminData<AdminRealtimeResponse>(
    "/api/admin/realtime",
    { refreshMs: 15000 },
  );

  if (loading && !data) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Live Chat Monitor</h2>
          <p className="mt-1 text-sm text-gray-600">
            Focused view of the active conversation sample from the admin APIs.
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <ChatMetric
          label="Active Conversations"
          value={data?.metrics.activeChats ?? 0}
          icon={Activity}
        />
        <ChatMetric
          label="Messages Last Hour"
          value={data?.metrics.messagesLastHour ?? 0}
          icon={MessageSquare}
        />
        <ChatMetric
          label="Avg Messages / Chat"
          value={data?.metrics.avgMessagesPerConversation ?? 0}
          icon={Clock}
        />
        <ChatMetric
          label="Active Sessions"
          value={data?.metrics.activeSessions ?? 0}
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {data?.activeChats.map((chat) => (
          <div key={chat.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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
            <div className="mt-4 space-y-3">
              {chat.messages.slice(-3).map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl p-3 ${
                    message.role === "assistant"
                      ? "bg-blue-50 text-gray-900"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                    {message.role} • {message.timeLabel}
                  </div>
                  <p className="text-sm leading-6">{message.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>{chat.messageCount} total messages</span>
              <span>{chat.lastUpdatedLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
