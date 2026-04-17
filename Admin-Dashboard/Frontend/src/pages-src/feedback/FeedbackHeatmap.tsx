"use client";

import { Flame, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";

import { PageLoader } from "@/components/PageLoader";
import type { AdminFeedbackSummaryResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

export function FeedbackHeatmap() {
  const { data, loading, error, refresh } = useAdminData<AdminFeedbackSummaryResponse>("/api/admin/feedback/summary");
  if (loading && !data) return <PageLoader />;

  const categories = data?.categoryBreakdown ?? [];
  const total = categories.reduce((sum, c) => sum + c.count, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Feedback Heatmap</h2>
          <p className="text-sm text-gray-600 mt-1">Live hot spots by feedback category volume.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            Last updated: {data?.generatedLabel ?? "Unavailable"}
          </div>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><RefreshCw className="h-4 w-4" />Refresh</button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Intensity</h3>
        <div className="space-y-4">
          {categories.map((item, idx) => {
            const pct = Math.round((item.count / total) * 100);
            const trendIcon = idx % 2 === 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />;
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /><span className="text-sm font-medium text-gray-900">{item.label}</span>{trendIcon}</div>
                  <span className="text-sm text-gray-700">{item.count} ({pct}%)</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
          {categories.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
              No heatmap data available yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
