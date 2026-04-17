"use client";

import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { RefreshCw } from "lucide-react";

import { PageLoader } from "@/components/PageLoader";
import type { AdminFeedbackSummaryResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"];

export function FeedbackAnalytics() {
  const { data, loading, error, refresh } = useAdminData<AdminFeedbackSummaryResponse>("/api/admin/feedback/summary");

  if (loading && !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Feedback Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Live category, status, and trend analytics from admin feedback endpoints.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            Last updated: {data?.generatedLabel ?? "Unavailable"}
          </div>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><RefreshCw className="h-4 w-4" />Refresh</button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback by Category</h3>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data?.categoryBreakdown ?? []} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="label">{(data?.categoryBreakdown ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback by Status</h3>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data?.statusBreakdown ?? []} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="label">{(data?.statusBreakdown ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Trend Over Time</h3>
        <div className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.trend ?? []}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Line type="monotone" dataKey="feedback" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}
