"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageLoader } from "@/components/PageLoader";
import type { AdminOverviewResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

const iconMap = {
  search: Search,
  sessions: Activity,
  feedback: MessageSquare,
  open: AlertTriangle,
  resolved: CheckCircle2,
  users: Users,
  messages: MessageSquare,
};

const toneMap = {
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  green: "bg-emerald-50 text-emerald-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-700",
};

export function Overview() {
  const { data, loading, error, refresh } = useAdminData<AdminOverviewResponse>(
    "/api/admin/overview",
  );

  if (loading && !data) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Platform Overview</h1>
          <p className="mt-1 text-sm text-gray-600">
            Week 1 live admin summary powered by current backend admin APIs.
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
        {data?.metrics.map((metric) => {
          const Icon = iconMap[metric.icon];
          return (
            <div
              key={metric.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">{metric.description}</p>
                </div>
                <div
                  className={`rounded-xl p-3 ${toneMap[metric.tone]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">7-Day Activity Trend</h2>
            <p className="text-sm text-gray-600">
              Session and feedback volume visible through the current admin API surface.
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessions" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="feedback" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Feedback Status</h2>
            <p className="text-sm text-gray-600">
              Distribution from the latest feedback records.
            </p>
          </div>
          <div className="space-y-4">
            {data?.feedbackBreakdown.map((item) => {
              const total =
                data.feedbackBreakdown.reduce((sum, value) => sum + value.count, 0) || 1;
              const percentage = Math.round((item.count / total) * 100);

              return (
                <div key={item.status}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.status}</span>
                    <span className="text-gray-500">
                      {item.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
            <p className="text-sm text-gray-600">
              Latest conversations available via current backend admin APIs.
            </p>
          </div>
          <div className="space-y-3">
            {data?.recentSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.userLabel}
                    </p>
                    <p className="text-xs text-gray-500">{session.displayId}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      session.status === "Active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-700">{session.lastMessagePreview}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{session.messageCount} messages</span>
                  <span>{session.relativeUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
            <p className="text-sm text-gray-600">
              Latest feedback normalized into dashboard-ready categories and priorities.
            </p>
          </div>
          <div className="space-y-3">
            {data?.recentFeedback.map((feedback) => (
              <div
                key={feedback.id}
                className="rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{feedback.email}</p>
                    <p className="text-xs text-gray-500">{feedback.displayId}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {feedback.category}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-700">{feedback.messagePreview}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                  <span className="rounded-full bg-orange-50 px-2 py-1 font-medium text-orange-700">
                    {feedback.priority}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700">
                    {feedback.status}
                  </span>
                  <span className="text-gray-500">{feedback.relativeSubmitted}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
