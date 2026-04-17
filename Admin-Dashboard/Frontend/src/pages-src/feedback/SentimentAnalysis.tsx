"use client";

import { Smile, Meh, Frown, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { PageLoader } from "@/components/PageLoader";
import type { AdminFeedbackSummaryResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

export function SentimentAnalysis() {
  const { data, loading, error, refresh } = useAdminData<AdminFeedbackSummaryResponse>("/api/admin/feedback/summary");
  if (loading && !data) return <PageLoader />;

  const total = (data?.statusBreakdown ?? []).reduce((s, i) => s + i.count, 0);
  const resolved = data?.statusBreakdown.find((i) => i.label === "Resolved")?.count ?? 0;
  const open = data?.statusBreakdown.find((i) => i.label === "Open")?.count ?? 0;
  const investigating = data?.statusBreakdown.find((i) => i.label === "Investigating")?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Sentiment Analysis</h2>
          <p className="text-sm text-gray-600 mt-1">Live proxy sentiment from feedback handling states.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            Last updated: {data?.generatedLabel ?? "Unavailable"}
          </div>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><RefreshCw className="h-4 w-4" />Refresh</button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-600">Positive (Resolved)</span><Smile className="w-6 h-6 text-green-600" /></div><div className="text-3xl font-semibold text-gray-900">{resolved}</div><div className="mt-3 text-sm text-gray-600">{total ? ((resolved/total)*100).toFixed(1) : "0"}% of total</div></div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-600">Neutral (Investigating)</span><Meh className="w-6 h-6 text-yellow-600" /></div><div className="text-3xl font-semibold text-gray-900">{investigating}</div><div className="mt-3 text-sm text-gray-600">{total ? ((investigating/total)*100).toFixed(1) : "0"}% of total</div></div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-600">Negative (Open)</span><Frown className="w-6 h-6 text-red-600" /></div><div className="text-3xl font-semibold text-gray-900">{open}</div><div className="mt-3 text-sm text-gray-600">{total ? ((open/total)*100).toFixed(1) : "0"}% of total</div></div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Trend</h3>
        <div className="h-96"><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.trend ?? []}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Line type="monotone" dataKey="feedback" stroke="#2563eb" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}
