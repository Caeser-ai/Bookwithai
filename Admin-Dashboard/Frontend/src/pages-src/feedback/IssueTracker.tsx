"use client";

import { RefreshCw } from "lucide-react";

import { PageLoader } from "@/components/PageLoader";
import type { AdminFeedbackListResponse, UiFeedbackStatus } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

const COLUMNS: { label: UiFeedbackStatus; color: string }[] = [
  { label: "Open", color: "bg-gray-100" },
  { label: "Investigating", color: "bg-blue-100" },
  { label: "Resolved", color: "bg-green-100" },
  { label: "Closed", color: "bg-gray-200" },
];

export function IssueTracker() {
  const { data, loading, error, refresh } = useAdminData<AdminFeedbackListResponse>("/api/admin/feedback");

  if (loading && !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Issue Tracker</h2>
          <p className="text-sm text-gray-600 mt-1">Live issue board from feedback queue statuses.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            Last updated: {data?.generatedLabel ?? "Unavailable"}
          </div>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><RefreshCw className="h-4 w-4" />Refresh</button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const issues = (data?.items ?? []).filter((item) => item.status === column.label);
          return (
            <div key={column.label} className="w-80 flex-shrink-0">
              <div className={`${column.color} rounded-lg p-3 mb-3`}>
                <h3 className="font-semibold text-gray-900 flex items-center justify-between">{column.label}<span className="text-sm bg-white px-2 py-0.5 rounded">{issues.length}</span></h3>
              </div>
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div key={issue.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-gray-500">{issue.displayId}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${issue.priority === "Critical" ? "bg-red-100 text-red-800" : issue.priority === "High" ? "bg-orange-100 text-orange-800" : issue.priority === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>{issue.priority}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">{issue.messagePreview}</p>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{issue.category}</span>
                      <span>{issue.assignedTo}</span>
                    </div>
                  </div>
                ))}
                {issues.length === 0 ? <div className="text-center py-8 text-gray-400 text-sm">No issues</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
