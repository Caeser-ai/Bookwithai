"use client";

import { AlertCircle, CheckCircle, HelpCircle, RefreshCw, XCircle } from "lucide-react";

import { PageLoader } from "@/components/PageLoader";
import type { AdminFeedbackSummaryResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

export function AIFeedbackInsights() {
  const { data, loading, error, refresh } = useAdminData<AdminFeedbackSummaryResponse>("/api/admin/feedback/summary");
  if (loading && !data) return <PageLoader />;

  const resolved = data?.statusBreakdown.find((i) => i.label === "Resolved")?.count ?? 0;
  const open = data?.statusBreakdown.find((i) => i.label === "Open")?.count ?? 0;
  const investigating = data?.statusBreakdown.find((i) => i.label === "Investigating")?.count ?? 0;
  const closed = data?.statusBreakdown.find((i) => i.label === "Closed")?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">AI Feedback Insights</h2>
          <p className="text-sm text-gray-600 mt-1">Live quality insights from admin feedback status and categories.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            Last updated: {data?.generatedLabel ?? "Unavailable"}
          </div>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><RefreshCw className="h-4 w-4" />Refresh</button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-600">Resolved Items</span><CheckCircle className="w-5 h-5 text-green-600" /></div><div className="text-3xl font-semibold text-gray-900">{resolved}</div></div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-600">Open Issues</span><HelpCircle className="w-5 h-5 text-yellow-600" /></div><div className="text-3xl font-semibold text-gray-900">{open}</div></div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-600">Investigating</span><AlertCircle className="w-5 h-5 text-orange-600" /></div><div className="text-3xl font-semibold text-gray-900">{investigating}</div></div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"><div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-600">Closed</span><XCircle className="w-5 h-5 text-gray-600" /></div><div className="text-3xl font-semibold text-gray-900">{closed}</div></div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Reported Categories</h3>
        <div className="space-y-3">
          {(data?.categoryBreakdown ?? []).slice(0, 8).map((item) => (
            <div key={item.label} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-600">{item.count} reports</p>
              </div>
            </div>
          ))}
          {(data?.categoryBreakdown?.length ?? 0) === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
              No category data available yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
