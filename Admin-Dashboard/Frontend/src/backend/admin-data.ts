import {
  addDays,
  format,
  formatDistanceToNowStrict,
  isSameDay,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

import {
  getAdminBehaviorAnalytics,
  getAdminFeedbackDetail,
  getAdminFeedbackList,
  getAdminFunnelAnalytics,
  getAdminOverviewMetrics,
  getAdminSessionDetail,
  getAdminSessionsList,
  getAdminUsersAnalytics,
  patchAdminFeedbackStatus,
} from "@/backend/admin-api";
import type {
  AdminBehaviorPageResponse,
  AdminConversationCard,
  AdminFeedbackDetailItem,
  AdminFeedbackItem,
  AdminFeedbackListResponse,
  AdminFeedbackSummaryResponse,
  AdminFunnelPageResponse,
  AdminGrowthPageResponse,
  AdminOverviewResponse,
  AdminRealtimeResponse,
  AdminSessionItem,
  AdminUsersPageResponse,
  AdminUsersTableItem,
  BackendAdminBehaviorResponse,
  BackendAdminDistributionItem,
  BackendAdminFeedbackDetail,
  BackendAdminFeedbackSummary,
  BackendAdminFunnelResponse,
  BackendAdminSessionDetail,
  BackendAdminSessionMessage,
  BackendAdminSessionSummary,
  BackendAdminUsersAnalyticsResponse,
  BackendFeedbackStatus,
  UiFeedbackPriority,
  UiFeedbackStatus,
} from "@/lib/admin-types";

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  try {
    return parseISO(value);
  } catch {
    return null;
  }
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatMetricValue(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatRelativeTime(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "Unknown";

  return formatDistanceToNowStrict(date, { addSuffix: true });
}

function formatAbsoluteTime(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "Unknown";

  return format(date, "yyyy-MM-dd HH:mm");
}

function formatClockTime(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "--";

  return format(date, "HH:mm");
}

function toUiStatus(status: string): UiFeedbackStatus {
  switch (status) {
    case "new":
      return "Open";
    case "in_review":
      return "Investigating";
    case "resolved":
      return "Resolved";
    case "dismissed":
      return "Closed";
    default:
      return "Open";
  }
}

function toBackendStatus(status: string): BackendFeedbackStatus {
  switch (status) {
    case "in_review":
      return "in_review";
    case "resolved":
      return "resolved";
    case "dismissed":
      return "dismissed";
    default:
      return "new";
  }
}

function inferFeedbackCategory(input: string): string {
  const text = input.toLowerCase();

  if (/(ai|assistant|chatbot|response)/.test(text)) return "AI Response";
  if (/(redirect|link|open.*website|booking website)/.test(text)) return "Redirect Issue";
  if (/(price|fare|flight time|airline|ticket|search result)/.test(text)) return "Flight Data Issue";
  if (/(mobile|layout|button|screen|ui|ux|design)/.test(text)) return "UI / UX";
  if (/(feature|would like|wish|please add|add )/.test(text)) return "Feature Request";
  if (/(crash|bug|error|broken|fail|cannot|can't|won't)/.test(text)) return "Bug / Error";
  if (/(search|filter|date|calendar)/.test(text)) return "Search Experience";

  return "General";
}

function inferFeedbackPriority(input: string, backendStatus: BackendFeedbackStatus): UiFeedbackPriority {
  const text = input.toLowerCase();

  if (/(crash|payment|broken|cannot book|can't book|security|incorrect price)/.test(text)) {
    return "Critical";
  }

  if (backendStatus === "in_review") return "High";
  if (/(wrong|incorrect|error|fail|issue|not work|can't|cannot|missing)/.test(text)) {
    return "High";
  }

  if (/(feature|request|suggest|improve|better)/.test(text)) {
    return "Low";
  }

  return "Medium";
}

function buildDisplayId(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function buildFeedbackItem(
  feedback: BackendAdminFeedbackSummary,
  fullMessage?: string | null,
): AdminFeedbackItem {
  const message = fullMessage ?? feedback.message_preview ?? "";
  const backendStatus = toBackendStatus(feedback.status);
  const category = inferFeedbackCategory(message);
  const priority = inferFeedbackPriority(message, backendStatus);

  return {
    id: feedback.id,
    displayId: buildDisplayId("FB", feedback.id),
    submittedAt: feedback.created_at,
    submittedLabel: formatAbsoluteTime(feedback.created_at),
    relativeSubmitted: formatRelativeTime(feedback.created_at),
    name: feedback.name?.trim() || "Anonymous user",
    email: feedback.email?.trim() || "No email",
    messagePreview: feedback.message_preview || "",
    message: fullMessage ?? null,
    status: toUiStatus(feedback.status),
    backendStatus,
    category,
    priority,
    assignedTo: feedback.status === "in_review" ? "Admin Review Queue" : "Unassigned",
  };
}

function buildFeedbackDetail(detail: BackendAdminFeedbackDetail): AdminFeedbackDetailItem {
  const item = buildFeedbackItem(
    {
      id: detail.id,
      created_at: detail.created_at,
      name: detail.name,
      email: detail.email,
      status: detail.status,
      message_preview: detail.message.slice(0, 160),
    },
    detail.message,
  );

  return {
    ...item,
    updatedAt: detail.updated_at,
    updatedLabel: detail.updated_at ? formatAbsoluteTime(detail.updated_at) : null,
    contextChat: detail.context_chat ?? [],
    contextFlights: detail.context_flights,
    contextPage: detail.context_page,
  };
}

function buildSessionItem(session: BackendAdminSessionSummary): AdminSessionItem {
  const userLabel = session.user_id
    ? `User ${session.user_id.slice(0, 8)}`
    : "Guest session";
  const updatedAt = toDate(session.updated_at);
  const isActive = updatedAt ? updatedAt >= subDays(new Date(), 0) && (Date.now() - updatedAt.getTime()) <= 10 * 60 * 1000 : false;

  return {
    id: session.id,
    displayId: buildDisplayId("SES", session.id),
    userId: session.user_id,
    userLabel,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    updatedLabel: formatAbsoluteTime(session.updated_at),
    relativeUpdated: formatRelativeTime(session.updated_at),
    messageCount: session.message_count,
    lastMessagePreview: session.last_message_preview || "No messages yet",
    status: isActive ? "Active" : "Idle",
  };
}

function buildConversationMessage(message: BackendAdminSessionMessage) {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.created_at,
    timeLabel: formatClockTime(message.created_at),
  };
}

function buildConversationCard(detail: BackendAdminSessionDetail): AdminConversationCard {
  const latestMessage = detail.messages.at(-1);
  const updatedAt = detail.updated_at ?? latestMessage?.created_at ?? null;
  const updated = toDate(updatedAt);
  const isActive = updated ? (Date.now() - updated.getTime()) <= 10 * 60 * 1000 : false;

  return {
    id: detail.id,
    displayId: buildDisplayId("SES", detail.id),
    userLabel: detail.user_id ? `User ${detail.user_id.slice(0, 8)}` : "Guest session",
    userId: detail.user_id,
    status: isActive ? "Active" : "Idle",
    messageCount: detail.messages.length,
    lastUpdated: updatedAt,
    lastUpdatedLabel: formatRelativeTime(updatedAt),
    lastMessagePreview: latestMessage?.content || "Conversation just started",
    messages: detail.messages.slice(-6).map(buildConversationMessage),
  };
}

function buildSevenDaySeries(dates: Array<string | null | undefined>) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(today, 6 - index);

    return {
      date,
      label: format(date, "MMM d"),
      count: 0,
    };
  });

  for (const value of dates) {
    const date = toDate(value);
    if (!date) continue;

    const bucket = days.find((day) => isSameDay(day.date, date));
    if (bucket) {
      bucket.count += 1;
    }
  }

  return days.map(({ label, count }) => ({ label, count }));
}

function groupByCount<T>(
  items: T[],
  getKey: (item: T) => string,
) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function inferActivityAction(preview: string) {
  const text = preview.toLowerCase();

  if (/(flight|search|ticket|route)/.test(text)) return "Searching for flights";
  if (/(save|trip|booking)/.test(text)) return "Saving travel details";
  if (/(weather|map|visa)/.test(text)) return "Requesting travel assistance";
  if (/(price alert|deal alert|alert)/.test(text)) return "Managing price alerts";

  return "Active AI conversation";
}

function formatSecondsAsDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0m";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function titleize(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildDistribution(items: BackendAdminDistributionItem[], limit = 6) {
  return items
    .filter((item) => item.count > 0)
    .slice(0, limit);
}

function buildAdminUserRow(
  user: BackendAdminUsersAnalyticsResponse["users"][number],
): AdminUsersTableItem {
  return {
    id: user.id,
    displayId: buildDisplayId("USR", user.id),
    name: user.name,
    email: user.email,
    nationality: user.nationality ?? "Unknown",
    gender: user.gender ?? "Unknown",
    role: titleize(user.role),
    status: titleize(user.status),
    joinedLabel: formatAbsoluteTime(user.created_at),
    lastActiveLabel: formatRelativeTime(user.last_active_at),
    sessionCount: user.session_count,
    messageCount: user.message_count,
    searchCount: user.search_count,
    tripCount: user.trip_count,
    alertCount: user.alert_count,
    feedbackCount: user.feedback_count,
    profileCompletion: user.profile_completion,
    engagementScore: user.engagement_score,
    cabinClass: user.cabin_class ?? "Unknown",
    seatPreference: user.seat_preference ?? "Unknown",
    flightTiming: user.flight_timing ?? "Unknown",
  };
}

export async function getOverviewPageData(): Promise<AdminOverviewResponse> {
  const [overview, feedbackResponse, sessionsResponse] = await Promise.all([
    getAdminOverviewMetrics(),
    getAdminFeedbackList(),
    getAdminSessionsList(),
  ]);

  const feedbackItems = feedbackResponse.feedback.map((item) => buildFeedbackItem(item));
  const sessionItems = sessionsResponse.sessions.map((session) => buildSessionItem(session));
  const totalFeedback = feedbackItems.length;
  const openFeedback = feedbackItems.filter((item) => item.status === "Open").length;
  const investigatingFeedback = feedbackItems.filter((item) => item.status === "Investigating").length;
  const resolvedFeedback = feedbackItems.filter((item) => item.status === "Resolved").length;
  const generatedAt = new Date();

  const sessionSeries = buildSevenDaySeries(sessionsResponse.sessions.map((session) => session.created_at));
  const feedbackSeries = buildSevenDaySeries(feedbackResponse.feedback.map((item) => item.created_at));

  return {
    generatedAt: generatedAt.toISOString(),
    generatedLabel: format(generatedAt, "yyyy-MM-dd HH:mm"),
    metrics: [
      {
        id: "searches",
        label: "Total Searches",
        value: formatMetricValue(overview.total_searches),
        description: "Flight search events captured in AI chat",
        icon: "search",
        tone: "blue",
      },
      {
        id: "active-sessions",
        label: "Active Sessions",
        value: formatMetricValue(overview.active_sessions),
        description: "Sessions updated in the last 10 minutes",
        icon: "sessions",
        tone: "purple",
      },
      {
        id: "feedback-total",
        label: "Feedback Received",
        value: formatMetricValue(totalFeedback),
        description: "Latest 100 feedback records from the backend",
        icon: "feedback",
        tone: "green",
      },
      {
        id: "feedback-open",
        label: "Open Feedback",
        value: formatMetricValue(openFeedback + investigatingFeedback),
        description: "Needs review or action from the admin team",
        icon: "open",
        tone: "orange",
      },
      {
        id: "feedback-resolved",
        label: "Resolved Feedback",
        value: formatMetricValue(resolvedFeedback),
        description: "Resolved feedback entries in the current dataset",
        icon: "resolved",
        tone: "green",
      },
      {
        id: "loaded-sessions",
        label: "Sessions Loaded",
        value: formatMetricValue(sessionItems.length),
        description: "Most recent sessions visible through current admin APIs",
        icon: "messages",
        tone: "blue",
      },
    ],
    trend: sessionSeries.map((point, index) => ({
      label: point.label,
      sessions: point.count,
      feedback: feedbackSeries[index]?.count ?? 0,
    })),
    feedbackBreakdown: [
      { status: "Open", count: feedbackItems.filter((item) => item.status === "Open").length },
      { status: "Investigating", count: feedbackItems.filter((item) => item.status === "Investigating").length },
      { status: "Resolved", count: feedbackItems.filter((item) => item.status === "Resolved").length },
      { status: "Closed", count: feedbackItems.filter((item) => item.status === "Closed").length },
    ],
    recentSessions: sessionItems.slice(0, 6),
    recentFeedback: feedbackItems.slice(0, 6),
  };
}

export async function getFeedbackSummaryData(): Promise<AdminFeedbackSummaryResponse> {
  const feedbackResponse = await getAdminFeedbackList();
  const items = feedbackResponse.feedback.map((item) => buildFeedbackItem(item));
  const generatedAt = new Date();
  const today = startOfDay(generatedAt);
  const newToday = items.filter((item) => {
    const submitted = toDate(item.submittedAt);
    return submitted ? submitted >= today : false;
  }).length;
  const inReview = items.filter((item) => item.status === "Investigating").length;
  const resolved = items.filter((item) => item.status === "Resolved").length;
  const closed = items.filter((item) => item.status === "Closed").length;
  const aiRelated = items.filter((item) => item.category === "AI Response").length;

  return {
    generatedAt: generatedAt.toISOString(),
    generatedLabel: format(generatedAt, "yyyy-MM-dd HH:mm"),
    metrics: [
      {
        id: "total-feedback",
        label: "Total Feedback",
        value: formatMetricValue(items.length),
        description: "Records available through current admin feedback APIs",
        icon: "feedback",
        tone: "blue",
      },
      {
        id: "today-feedback",
        label: "New Today",
        value: formatMetricValue(newToday),
        description: "Feedback submitted today",
        icon: "open",
        tone: "orange",
      },
      {
        id: "in-review",
        label: "In Review",
        value: formatMetricValue(inReview),
        description: "Feedback actively being investigated",
        icon: "sessions",
        tone: "purple",
      },
      {
        id: "resolved-feedback",
        label: "Resolved",
        value: formatMetricValue(resolved),
        description: "Resolved feedback items",
        icon: "resolved",
        tone: "green",
      },
      {
        id: "closed-feedback",
        label: "Closed",
        value: formatMetricValue(closed),
        description: "Dismissed or closed items",
        icon: "feedback",
        tone: "red",
      },
      {
        id: "ai-related",
        label: "AI Related",
        value: formatMetricValue(aiRelated),
        description: "Feedback mentioning AI chat quality or behavior",
        icon: "messages",
        tone: "blue",
      },
    ],
    trend: buildSevenDaySeries(feedbackResponse.feedback.map((item) => item.created_at)).map((point) => ({
      label: point.label,
      feedback: point.count,
    })),
    recentFeedback: items.slice(0, 6),
    categoryBreakdown: groupByCount(items, (item) => item.category).slice(0, 6),
    priorityBreakdown: groupByCount(items, (item) => item.priority) as { label: UiFeedbackPriority; count: number }[],
    statusBreakdown: groupByCount(items, (item) => item.status) as { label: UiFeedbackStatus; count: number }[],
  };
}

export async function getFeedbackInboxData(): Promise<AdminFeedbackListResponse> {
  const feedbackResponse = await getAdminFeedbackList();
  const items = feedbackResponse.feedback.map((item) => buildFeedbackItem(item));
  const generatedAt = new Date();

  return {
    generatedAt: generatedAt.toISOString(),
    generatedLabel: format(generatedAt, "yyyy-MM-dd HH:mm"),
    counts: {
      total: items.length,
      open: items.filter((item) => item.status === "Open").length,
      investigating: items.filter((item) => item.status === "Investigating").length,
      resolved: items.filter((item) => item.status === "Resolved").length,
      closed: items.filter((item) => item.status === "Closed").length,
    },
    items,
  };
}

export async function getFeedbackDetailData(feedbackId: string) {
  const detail = await getAdminFeedbackDetail(feedbackId);
  return buildFeedbackDetail(detail);
}

export async function updateFeedbackStatus(feedbackId: string, status: UiFeedbackStatus) {
  await patchAdminFeedbackStatus(feedbackId, status);
  return getFeedbackDetailData(feedbackId);
}

export async function getRealtimeData(): Promise<AdminRealtimeResponse> {
  const [overview, sessionsResponse] = await Promise.all([
    getAdminOverviewMetrics(),
    getAdminSessionsList(),
  ]);
  const sessionSummaries = sessionsResponse.sessions.map((session) => buildSessionItem(session));
  const recentSessions = sessionsResponse.sessions.slice(0, 6);
  const sessionDetails = (
    await Promise.all(
      recentSessions.map(async (session) => {
        try {
          return await getAdminSessionDetail(session.id);
        } catch {
          return null;
        }
      }),
    )
  ).filter((detail): detail is BackendAdminSessionDetail => Boolean(detail));

  const activeChats = sessionDetails.map(buildConversationCard);
  const messages = sessionDetails.flatMap((detail) => detail.messages);
  const oneHourAgo = addDays(new Date(), 0).getTime() - 60 * 60 * 1000;
  const messagesLastHour = messages.filter((message) => {
    const date = toDate(message.created_at);
    return date ? date.getTime() >= oneHourAgo : false;
  }).length;
  const generatedAt = new Date();

  return {
    generatedAt: generatedAt.toISOString(),
    generatedLabel: format(generatedAt, "yyyy-MM-dd HH:mm"),
    metrics: {
      activeSessions: overview.active_sessions,
      loadedSessions: sessionSummaries.length,
      activeChats: activeChats.length,
      messagesLastHour,
      avgMessagesPerConversation: activeChats.length
        ? Number((messages.length / activeChats.length).toFixed(1))
        : 0,
      authenticatedUsers: sessionSummaries.filter((session) => Boolean(session.userId)).length,
      guestSessions: sessionSummaries.filter((session) => !session.userId).length,
    },
    sessionChart: recentSessions.map((session) => ({
      label: buildDisplayId("SES", session.id).slice(-4),
      messages: session.message_count,
    })),
    activityFeed: sessionSummaries.slice(0, 8).map((session) => ({
      id: session.id,
      action: inferActivityAction(session.lastMessagePreview),
      userLabel: session.userLabel,
      relativeTime: session.relativeUpdated,
      status: session.status,
    })),
    activeChats,
  };
}

export async function getUsersPageData(): Promise<AdminUsersPageResponse> {
  const analytics = await getAdminUsersAnalytics();
  const generatedAt = analytics.generated_at;

  return {
    generatedAt,
    generatedLabel: formatAbsoluteTime(generatedAt),
    metrics: [
      {
        id: "total-users",
        label: "Total Users",
        value: formatMetricValue(analytics.totals.total_users),
        description: "Registered users in the user database",
        icon: "users",
        tone: "blue",
      },
      {
        id: "active-users",
        label: "Active 30 Days",
        value: formatMetricValue(analytics.totals.active_users_last_30d),
        description: "Users with recent sign-in or chat activity",
        icon: "sessions",
        tone: "green",
      },
      {
        id: "new-users",
        label: "New This Week",
        value: formatMetricValue(analytics.totals.new_users_last_7d),
        description: "Users created in the last 7 days",
        icon: "open",
        tone: "purple",
      },
      {
        id: "avg-searches",
        label: "Avg Searches / User",
        value: analytics.totals.avg_searches_per_user.toFixed(1),
        description: "Flight search activity pulled from chat data",
        icon: "search",
        tone: "orange",
      },
      {
        id: "avg-sessions",
        label: "Avg Sessions / User",
        value: analytics.totals.avg_sessions_per_user.toFixed(1),
        description: "Authenticated chat sessions per registered user",
        icon: "messages",
        tone: "blue",
      },
      {
        id: "users-with-trips",
        label: "Users With Trips",
        value: formatMetricValue(analytics.totals.users_with_trips),
        description: "Users who have saved at least one trip",
        icon: "resolved",
        tone: "green",
      },
    ],
    growthTrend: analytics.growth_7d.map((point) => ({
      label: format(parseISO(point.date), "MMM d"),
      newUsers: point.new_users,
      activeUsers: point.active_users,
      sessions: point.sessions,
      searches: point.searches,
    })),
    distributions: {
      countries: buildDistribution(analytics.distributions.countries),
      genders: buildDistribution(analytics.distributions.genders),
      cabinClasses: buildDistribution(analytics.distributions.cabin_classes),
      seatPreferences: buildDistribution(analytics.distributions.seat_preferences),
      flightTimings: buildDistribution(analytics.distributions.flight_timings),
    },
    topPrompts: buildDistribution(analytics.top_prompts),
    topRoutes: buildDistribution(analytics.top_routes),
    topSearchRoutes: buildDistribution(analytics.top_search_routes ?? []),
    users: analytics.users.map(buildAdminUserRow),
  };
}

export async function getGrowthPageData(): Promise<AdminGrowthPageResponse> {
  const [analytics, funnel] = await Promise.all([
    getAdminUsersAnalytics(),
    getAdminFunnelAnalytics(),
  ]);
  const generatedAt = analytics.generated_at;

  return {
    generatedAt,
    generatedLabel: formatAbsoluteTime(generatedAt),
    metrics: [
      {
        id: "users-30d",
        label: "New Users 30 Days",
        value: formatMetricValue(analytics.totals.new_users_last_30d),
        description: "Growth in registered users over the last month",
        icon: "users",
        tone: "blue",
      },
      {
        id: "messages-24h",
        label: "Messages 24 Hours",
        value: formatMetricValue(analytics.totals.messages_last_24h),
        description: "Recent engagement measured from chat activity",
        icon: "messages",
        tone: "purple",
      },
      {
        id: "searches-total",
        label: "Total Searches",
        value: formatMetricValue(analytics.totals.total_searches),
        description: "Flight searches found in the chat database",
        icon: "search",
        tone: "green",
      },
      {
        id: "distinct-search-routes",
        label: "Distinct search routes",
        value: formatMetricValue(analytics.totals.distinct_search_routes ?? 0),
        description: "Unique origin→destination pairs inferred from flight result messages",
        icon: "open",
        tone: "purple",
      },
      {
        id: "redirects",
        label: "Redirect Events",
        value: formatMetricValue(analytics.totals.redirect_messages),
        description: "Booking redirects detected in assistant responses",
        icon: "open",
        tone: "orange",
      },
      {
        id: "users-with-alerts",
        label: "Users With Alerts",
        value: formatMetricValue(analytics.totals.users_with_alerts),
        description: "Users who currently have a saved price alert",
        icon: "feedback",
        tone: "red",
      },
      {
        id: "users-with-feedback",
        label: "Users With Feedback",
        value: formatMetricValue(analytics.totals.users_with_feedback),
        description: "Registered users who submitted feedback",
        icon: "resolved",
        tone: "green",
      },
    ],
    growthTrend: funnel.trend_7d.map((point, index) => ({
      label: format(parseISO(point.date), "MMM d"),
      users: analytics.growth_7d[index]?.new_users ?? 0,
      activeUsers: analytics.growth_7d[index]?.active_users ?? 0,
      sessions: point.conversations,
      searches: point.searches,
      redirects: point.redirects,
    })),
    acquisitionBreakdown: buildDistribution(analytics.distributions.countries),
    funnelStages: funnel.stages.map((stage) => ({
      label: stage.label,
      count: stage.count,
      percentage: stage.percentage,
    })),
    topRoutes: buildDistribution(funnel.top_routes),
    topSearchRoutes: buildDistribution(funnel.top_search_routes ?? []),
    topPrompts: buildDistribution(funnel.top_prompts),
  };
}

export async function getFunnelPageData(): Promise<AdminFunnelPageResponse> {
  const funnel = await getAdminFunnelAnalytics();
  const generatedAt = funnel.generated_at;

  return {
    generatedAt,
    generatedLabel: formatAbsoluteTime(generatedAt),
    metrics: [
      {
        id: "funnel-start",
        label: "Top Of Funnel",
        value: formatMetricValue(funnel.stages[0]?.count ?? 0),
        description: funnel.stages[0]?.label ?? "Registered users",
        icon: "users",
        tone: "blue",
      },
      {
        id: "funnel-chat",
        label: "Chat Sessions",
        value: formatMetricValue(
          funnel.stages.find((stage) => stage.key === "conversations")?.count ?? 0,
        ),
        description: "Sessions created in the chat database",
        icon: "sessions",
        tone: "purple",
      },
      {
        id: "funnel-search",
        label: "Flight Searches",
        value: formatMetricValue(
          funnel.stages.find((stage) => stage.key === "searches")?.count ?? 0,
        ),
        description: "Search events found in assistant conversations",
        icon: "search",
        tone: "green",
      },
      {
        id: "funnel-redirect",
        label: "Redirect Clicks",
        value: formatMetricValue(
          funnel.stages.find((stage) => stage.key === "redirects")?.count ?? 0,
        ),
        description: "Detected outbound booking redirects",
        icon: "open",
        tone: "orange",
      },
    ],
    stages: funnel.stages,
    trend: funnel.trend_7d.map((point) => ({
      label: format(parseISO(point.date), "MMM d"),
      conversations: point.conversations,
      searches: point.searches,
      redirects: point.redirects,
      trips: point.trips,
    })),
    dropOffs: funnel.drop_offs.map((item) => ({
      id: `${item.from_key}-${item.to_key}`,
      label: `${item.from_label} -> ${item.to_label}`,
      dropCount: item.drop_count,
      dropPercentage: item.drop_percentage,
    })),
    topRoutes: buildDistribution(funnel.top_routes),
    topPrompts: buildDistribution(funnel.top_prompts),
  };
}

export async function getBehaviorPageData(): Promise<AdminBehaviorPageResponse> {
  const behavior: BackendAdminBehaviorResponse = await getAdminBehaviorAnalytics();
  const generatedAt = behavior.generated_at;

  return {
    generatedAt,
    generatedLabel: formatAbsoluteTime(generatedAt),
    metrics: [
      {
        id: "session-count",
        label: "Sessions",
        value: formatMetricValue(behavior.totals.session_count),
        description: "Conversation sessions found in the chat database",
        icon: "sessions",
        tone: "blue",
      },
      {
        id: "active-sessions",
        label: "Active Sessions",
        value: formatMetricValue(behavior.totals.active_sessions),
        description: "Updated within the last 10 minutes",
        icon: "messages",
        tone: "green",
      },
      {
        id: "avg-searches-session",
        label: "Avg Searches / Session",
        value: behavior.totals.avg_searches_per_session.toFixed(1),
        description: "Flight search density across conversations",
        icon: "search",
        tone: "orange",
      },
      {
        id: "avg-messages-session",
        label: "Avg Messages / Session",
        value: behavior.totals.avg_messages_per_session.toFixed(1),
        description: "Average message count per conversation",
        icon: "feedback",
        tone: "purple",
      },
      {
        id: "avg-duration",
        label: "Avg Session Length",
        value: formatSecondsAsDuration(behavior.totals.avg_session_duration_seconds),
        description: "Based on session created and updated timestamps",
        icon: "resolved",
        tone: "green",
      },
      {
        id: "messages-24h",
        label: "Messages 24 Hours",
        value: formatMetricValue(behavior.totals.messages_last_24h),
        description: "Recent throughput across all chat sessions",
        icon: "messages",
        tone: "red",
      },
    ],
    searchDistribution: buildDistribution(behavior.search_distribution, 8),
    messageDistribution: buildDistribution(behavior.message_distribution, 8),
    sessionDurationDistribution: buildDistribution(
      behavior.session_duration_distribution,
      8,
    ),
    activityTrend: behavior.hourly_activity.map((item) => ({
      label: item.label,
      sessions: item.sessions,
      messages: item.messages,
      searches: item.searches,
    })),
    topRoutes: buildDistribution(behavior.top_routes),
    topPrompts: buildDistribution(behavior.top_prompts),
    recentActivity: behavior.recent_activity.map((item) => ({
      id: item.session_id,
      displayId: buildDisplayId("SES", item.session_id),
      userLabel: item.user_id ? `User ${item.user_id.slice(0, 8)}` : "Guest session",
      updatedLabel: formatRelativeTime(item.updated_at),
      messageCount: item.message_count,
      searchCount: item.search_count,
      status: item.status,
      lastMessagePreview: item.last_message_preview || "Conversation just started",
    })),
  };
}
