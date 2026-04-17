"use client";

import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageLoader } from "@/components/PageLoader";
import type { AdminFeedbackSummaryResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

const iconMap = {
  search: Search,
  sessions: AlertTriangle,
  feedback: MessageSquare,
  open: AlertTriangle,
  resolved: CheckCircle2,
  users: MessageSquare,
  messages: MessageSquare,
};

const toneMap = {
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  green: "bg-emerald-50 text-emerald-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-700",
};

export function FeedbackDashboard() {
  const { data, loading, error, refresh } = useAdminData<AdminFeedbackSummaryResponse>(
    "/api/admin/feedback/summary",
  );

  if (loading && !data) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Feedback Dashboard</h2>
          <p className="mt-1 text-sm text-gray-600">
            Week 1 live feedback monitoring built on current admin endpoints.
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
                <div className={`rounded-xl p-3 ${toneMap[metric.tone]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Feedback Trend</h3>
            <p className="text-sm text-gray-600">
              Latest 7-day count based on currently available admin feedback records.
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="feedback"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Status Breakdown</h3>
            <p className="text-sm text-gray-600">
              Review load based on normalized admin feedback states.
            </p>
          </div>
          <div className="space-y-4">
            {data?.statusBreakdown.map((item) => {
              const total =
                data.statusBreakdown.reduce((sum, value) => sum + value.count, 0) || 1;
              const percentage = Math.round((item.count / total) * 100);

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.label}</span>
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
            <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
            <p className="text-sm text-gray-600">
              Heuristically classified from the message content available in current APIs.
            </p>
          </div>
          <div className="space-y-4">
            {data?.categoryBreakdown.map((item) => {
              const total =
                data.categoryBreakdown.reduce((sum, value) => sum + value.count, 0) || 1;
              const percentage = Math.round((item.count / total) * 100);

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="text-gray-500">
                      {item.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Feedback</h3>
            <p className="text-sm text-gray-600">
              Latest items coming straight from the backend feedback queue.
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
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
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
