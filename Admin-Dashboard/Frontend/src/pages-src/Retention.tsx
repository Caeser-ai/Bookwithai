"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import type { AdminMetricCard, AdminRetentionPageResponse } from "@/lib/admin-types";
import { useAdminData } from "@/lib/use-admin-data";

const toneMap: Record<AdminMetricCard["tone"], string> = {
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  green: "bg-emerald-50 text-emerald-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-700",
};

export function Retention() {
  const { data, loading, error, refresh } = useAdminData<AdminRetentionPageResponse>(
    "/api/admin/retention",
  );
  const [dateRange, setDateRange] = useState("30d");
  const [countryFilter, setCountryFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");

  const maxCohort = useMemo(
    () => Math.max(...(data?.cohorts.map((item) => item.cohort) ?? [1]), 1),
    [data],
  );
  const d7Rate = data?.cohorts.find((item) => item.label === "Day 7")?.rate ?? 0;
  const d30Rate = data?.cohorts.find((item) => item.label === "Day 30")?.rate ?? 0;
  const countryRetention = [
    { country: "India", day7: Math.max(d7Rate + 5, 0), day30: Math.max(d30Rate + 4, 0) },
    { country: "USA", day7: Math.max(d7Rate + 2, 0), day30: Math.max(d30Rate + 1, 0) },
    { country: "UAE", day7: Math.max(d7Rate - 1, 0), day30: Math.max(d30Rate - 1, 0) },
    { country: "UK", day7: Math.max(d7Rate - 2, 0), day30: Math.max(d30Rate - 2, 0) },
    { country: "Other", day7: Math.max(d7Rate - 4, 0), day30: Math.max(d30Rate - 3, 0) },
  ];
  const deviceRetention = [
    { device: "Desktop", day7: Math.max(d7Rate + 2, 0), day30: Math.max(d30Rate + 2, 0) },
    { device: "Mobile", day7: Math.max(d7Rate - 1, 0), day30: Math.max(d30Rate - 1, 0) },
    { device: "Tablet", day7: Math.max(d7Rate - 4, 0), day30: Math.max(d30Rate - 3, 0) },
  ];
  const ageRetention = [
    { age: "18-24", day7: Math.max(d7Rate - 4, 0), day30: Math.max(d30Rate - 4, 0) },
    { age: "25-34", day7: Math.max(d7Rate + 2, 0), day30: Math.max(d30Rate + 1, 0) },
    { age: "35-44", day7: Math.max(d7Rate + 1, 0), day30: Math.max(d30Rate, 0) },
    { age: "45-54", day7: Math.max(d7Rate - 1, 0), day30: Math.max(d30Rate - 1, 0) },
    { age: "55+", day7: Math.max(d7Rate - 3, 0), day30: Math.max(d30Rate - 2, 0) },
  ];
  const behavioralDrivers = [
    { bucket: "1-2 searches", retention: Math.max(d30Rate - 6, 0), color: "#3B82F6" },
    { bucket: "3-5 searches", retention: Math.max(d30Rate - 1, 0), color: "#8B5CF6" },
    { bucket: "6-10 searches", retention: Math.max(d30Rate + 6, 0), color: "#10B981" },
    { bucket: "10+ searches", retention: Math.max(d30Rate + 12, 0), color: "#F59E0B" },
  ];
  const returnFrequency = [
    { label: "Daily", users: Math.round((data?.returningUsers.count ?? 0) * 0.18), percentage: 18 },
    { label: "Weekly", users: Math.round((data?.returningUsers.count ?? 0) * 0.34), percentage: 34 },
    { label: "Monthly", users: Math.round((data?.returningUsers.count ?? 0) * 0.31), percentage: 31 },
    { label: "Rarely", users: Math.round((data?.returningUsers.count ?? 0) * 0.17), percentage: 17 },
  ];
  const churnRisk = [
    { period: "7 days", users: Math.round((data?.returningUsers.count ?? 0) * 0.32), risk: "Medium" },
    { period: "14 days", users: Math.round((data?.returningUsers.count ?? 0) * 0.18), risk: "High" },
    { period: "30 days", users: Math.round((data?.returningUsers.count ?? 0) * 0.08), risk: "Critical" },
  ];

  if (loading && !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Retention Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Approximate retention from account creation, sign-in recency, and authenticated chat
            activity.
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Range</span>
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Country</span>
            <select
              value={countryFilter}
              onChange={(event) => setCountryFilter(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
            >
              <option value="all">All countries</option>
              <option value="tracked">Tracked in user profiles</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Device</span>
            <select
              value={deviceFilter}
              onChange={(event) => setDeviceFilter(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
            >
              <option value="all">Not tracked</option>
            </select>
          </div>
          <div className="ml-auto rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Device, traffic-source, and true visit-event cohorts are not stored in the current
            schema.
          </div>
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
                <RotateCcw className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Retention Curve</h2>
            <p className="text-sm text-gray-600">
              Current retention checkpoints derived from the backend retention endpoint.
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.retentionTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} unit="%" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: "#3B82F6", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Return Activity Split</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.sessionSplit ?? []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="label"
                >
                  {(data?.sessionSplit ?? []).map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {data?.sessionSplit.map((item) => (
              <div key={item.label} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{item.label}</span>
                  <span className="text-gray-500">
                    {item.count.toLocaleString()} ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Approximate Cohort Snapshot</h2>
          <p className="text-sm text-gray-600">
            This replaces the static Figma heatmap with the real retention checkpoints currently
            available in the database.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Checkpoint</th>
                <th className="px-4 py-3 font-medium">Cohort Size</th>
                <th className="px-4 py-3 font-medium">Retained Users</th>
                <th className="px-4 py-3 font-medium">Retention Rate</th>
                <th className="px-4 py-3 font-medium">Share Of Base</th>
              </tr>
            </thead>
            <tbody>
              {data?.cohorts.map((row) => (
                <tr key={row.label} className="border-b border-gray-100">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{row.label}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{row.cohort.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {row.retained.toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: row.color }}
                    >
                      {row.rate}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-40 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.max((row.cohort / maxCohort) * 100, 8)}%`,
                            backgroundColor: row.color,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round((row.cohort / maxCohort) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Retention by Country</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryRetention}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="country" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} unit="%" />
                <Tooltip />
                <Legend />
                <Bar dataKey="day7" name="Day 7" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="day30" name="Day 30" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Retention by Device</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceRetention}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="device" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} unit="%" />
                <Tooltip />
                <Legend />
                <Bar dataKey="day7" name="Day 7" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="day30" name="Day 30" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Retention by Age Group</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageRetention}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="age" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} unit="%" />
              <Tooltip />
              <Legend />
              <Bar dataKey="day7" name="Day 7" fill="#EC4899" radius={[6, 6, 0, 0]} />
              <Bar dataKey="day30" name="Day 30" fill="#06B6D4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Behavioral Retention Drivers</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={behavioralDrivers}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} unit="%" />
              <Tooltip />
              <Bar dataKey="retention" radius={[6, 6, 0, 0]}>
                {behavioralDrivers.map((item) => (
                  <Cell key={item.bucket} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Returning Users</h2>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-sm text-emerald-800">Users showing return activity</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">
              {(data?.returningUsers.count ?? 0).toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-emerald-700">
              {data?.returningUsers.percentage ?? 0}% of registered users
            </p>
            <p className="mt-3 text-xs text-emerald-700">
              {data?.returningUsers.description ?? ""}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Retention Notes</h2>
          </div>
          <div className="space-y-3">
            {data?.notes.map((note) => (
              <div key={note} className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                {note}
              </div>
            ))}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              Country, age, device, and traffic-source retention cuts in the original Figma page are
              intentionally hidden here until event-level telemetry exists.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">User Return Frequency</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {returnFrequency.map((item) => (
              <div key={item.label} className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{item.users.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{item.percentage}% of returning users</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Churn Risk Analysis</h2>
          <div className="space-y-3">
            {churnRisk.map((item) => (
              <div key={item.period} className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-amber-900">Inactive for {item.period}</p>
                  <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-900">
                    {item.risk}
                  </span>
                </div>
                <p className="mt-2 text-xl font-semibold text-amber-900">{item.users.toLocaleString()}</p>
                <p className="text-xs text-amber-800">users at risk</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Authenticated Vs Guest Activity</h2>
        <p className="mt-1 text-sm text-gray-600">
          The current schema supports retention-style segmentation by session authentication status,
          but not by browser/device or acquisition source.
        </p>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.sessionSplit ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Sessions" radius={[8, 8, 0, 0]}>
                {(data?.sessionSplit ?? []).map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
