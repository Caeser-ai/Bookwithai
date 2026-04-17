"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Search, Users as UsersIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageLoader } from "@/components/PageLoader";
import type { AdminUsersPageResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

const toneMap = {
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  green: "bg-emerald-50 text-emerald-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-700",
};

export function Users() {
  const { data, loading, error, refresh } = useAdminData<AdminUsersPageResponse>(
    "/api/admin/users",
  );
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data?.users ?? [];

    return (data?.users ?? []).filter((user) =>
      [
        user.displayId,
        user.name,
        user.email,
        user.nationality,
        user.cabinClass,
        user.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [data?.users, query]);

  if (loading && !data) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            Live user analytics built from the user database plus chat session activity.
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
        {data?.metrics.map((metric) => (
          <div key={metric.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{metric.value}</p>
                <p className="mt-2 text-sm text-gray-500">{metric.description}</p>
              </div>
              <div className={`rounded-xl p-3 ${toneMap[metric.tone]}`}>
                <UsersIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Growth And Activity</h2>
            <p className="text-sm text-gray-600">
              Daily new users, active users, sessions, and searches over the last week.
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.growthTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="newUsers" stroke="#2563eb" strokeWidth={3} />
                <Line type="monotone" dataKey="activeUsers" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="searches" stroke="#f59e0b" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Prompt Themes</h2>
            <p className="text-sm text-gray-600">
              Most common user chat prompts observed in the chat database.
            </p>
          </div>
          <div className="space-y-3">
            {data?.topPrompts.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="mt-1 text-xs text-gray-500">{item.count} conversations</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Country Distribution</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.distributions.countries ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="label" type="category" width={90} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Gender Distribution</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.distributions.genders ?? []}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  fill="#10b981"
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {[
          { title: "Cabin Preference", data: data?.distributions.cabinClasses ?? [], color: "#8b5cf6" },
          { title: "Seat Preference", data: data?.distributions.seatPreferences ?? [], color: "#10b981" },
          { title: "Flight Timing", data: data?.distributions.flightTimings ?? [], color: "#f59e0b" },
        ].map((section) => (
          <div key={section.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
            </div>
            <div className="space-y-3">
              {section.data.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="text-gray-500">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.max((item.count / Math.max(section.data[0]?.count ?? 1, 1)) * 100, 8)}%`,
                        backgroundColor: section.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
            <p className="text-sm text-gray-600">
              Registered accounts enriched with trip, alert, feedback, and chat activity counts.
            </p>
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Activity</th>
                <th className="px-4 py-3 font-medium">Saved Data</th>
                <th className="px-4 py-3 font-medium">Preferences</th>
                <th className="px-4 py-3 font-medium">Profile</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 align-top">
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {user.displayId} • Joined {user.joinedLabel}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <p>{user.nationality}</p>
                    <p className="text-xs text-gray-500">{user.gender}</p>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {user.status}
                    </span>
                    <p className="mt-2 text-xs text-gray-500">{user.lastActiveLabel}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <p>{user.sessionCount} sessions</p>
                    <p>{user.messageCount} messages</p>
                    <p>{user.searchCount} searches</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <p>{user.tripCount} trips</p>
                    <p>{user.alertCount} alerts</p>
                    <p>{user.feedbackCount} feedback</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <p>{user.cabinClass}</p>
                    <p>{user.seatPreference}</p>
                    <p>{user.flightTiming}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <p>{user.profileCompletion}% complete</p>
                    <p>{user.engagementScore}/100 engagement</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
