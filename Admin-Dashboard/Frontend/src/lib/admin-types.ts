export type BackendFeedbackStatus = "new" | "in_review" | "resolved" | "dismissed";
export type UiFeedbackStatus = "Open" | "Investigating" | "Resolved" | "Closed";
export type UiFeedbackPriority = "Critical" | "High" | "Medium" | "Low";

export type BackendAdminMetricsOverviewResponse = {
  total_searches: number;
  active_sessions: number;
  feedback_counts: Partial<Record<BackendFeedbackStatus, number>>;
};

export type BackendAdminSessionSummary = {
  id: string;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  message_count: number;
  last_message_preview: string | null;
};

export type BackendAdminSessionMessage = {
  id: string;
  role: string;
  content: string;
  created_at: string | null;
};

export type BackendAdminSessionDetail = {
  id: string;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  messages: BackendAdminSessionMessage[];
};

export type BackendAdminSessionsResponse = {
  sessions: BackendAdminSessionSummary[];
};

export type BackendAdminFeedbackSummary = {
  id: string;
  created_at: string | null;
  name: string | null;
  email: string | null;
  status: BackendFeedbackStatus | string;
  message_preview: string;
};

export type BackendAdminFeedbackContextMessage = {
  role: string;
  content: string;
  created_at: string | null;
};

export type BackendAdminFeedbackDetail = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  name: string | null;
  email: string | null;
  status: BackendFeedbackStatus | string;
  message: string;
  context_chat?: BackendAdminFeedbackContextMessage[] | null;
  context_flights?: unknown;
  context_page?: unknown;
};

export type BackendAdminFeedbackResponse = {
  feedback: BackendAdminFeedbackSummary[];
};

export type AdminMetricCard = {
  id: string;
  label: string;
  value: string;
  description: string;
  icon: "search" | "sessions" | "feedback" | "open" | "resolved" | "users" | "messages";
  tone: "blue" | "purple" | "green" | "orange" | "red";
};

export type AdminTrendPoint = {
  label: string;
  sessions: number;
  feedback: number;
};

export type AdminFeedbackItem = {
  id: string;
  displayId: string;
  submittedAt: string | null;
  submittedLabel: string;
  relativeSubmitted: string;
  name: string;
  email: string;
  messagePreview: string;
  message: string | null;
  status: UiFeedbackStatus;
  backendStatus: BackendFeedbackStatus;
  category: string;
  priority: UiFeedbackPriority;
  assignedTo: string;
};

export type AdminFeedbackDetailItem = AdminFeedbackItem & {
  updatedAt: string | null;
  updatedLabel: string | null;
  contextChat: BackendAdminFeedbackContextMessage[];
  contextFlights?: unknown;
  contextPage?: unknown;
};

export type AdminSessionItem = {
  id: string;
  displayId: string;
  userId: string | null;
  userLabel: string;
  createdAt: string | null;
  updatedAt: string | null;
  updatedLabel: string;
  relativeUpdated: string;
  messageCount: number;
  lastMessagePreview: string;
  status: "Active" | "Idle";
};

export type AdminConversationMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string | null;
  timeLabel: string;
};

export type AdminConversationCard = {
  id: string;
  displayId: string;
  userLabel: string;
  userId: string | null;
  status: "Active" | "Idle";
  messageCount: number;
  lastUpdated: string | null;
  lastUpdatedLabel: string;
  lastMessagePreview: string;
  messages: AdminConversationMessage[];
};

export type AdminOverviewResponse = {
  generatedAt: string;
  generatedLabel: string;
  metrics: AdminMetricCard[];
  trend: AdminTrendPoint[];
  feedbackBreakdown: { status: UiFeedbackStatus; count: number }[];
  recentSessions: AdminSessionItem[];
  recentFeedback: AdminFeedbackItem[];
};

export type AdminFeedbackSummaryResponse = {
  generatedAt: string;
  generatedLabel: string;
  metrics: AdminMetricCard[];
  trend: { label: string; feedback: number }[];
  recentFeedback: AdminFeedbackItem[];
  categoryBreakdown: { label: string; count: number }[];
  priorityBreakdown: { label: UiFeedbackPriority; count: number }[];
  statusBreakdown: { label: UiFeedbackStatus; count: number }[];
};

export type AdminFeedbackListResponse = {
  generatedAt: string;
  generatedLabel: string;
  counts: { total: number; open: number; investigating: number; resolved: number; closed: number };
  items: AdminFeedbackItem[];
};

export type AdminRealtimeResponse = {
  generatedAt: string;
  generatedLabel: string;
  metrics: {
    activeSessions: number;
    loadedSessions: number;
    activeChats: number;
    messagesLastHour: number;
    avgMessagesPerConversation: number;
    authenticatedUsers: number;
    guestSessions: number;
  };
  sessionChart: { label: string; messages: number }[];
  activityFeed: {
    id: string;
    action: string;
    userLabel: string;
    relativeTime: string;
    status: "Active" | "Idle";
  }[];
  activeChats: AdminConversationCard[];
};

export type BackendAdminDistributionItem = {
  label: string;
  count: number;
};

export type BackendAdminUsersAnalyticsResponse = {
  generated_at: string;
  totals: {
    total_users: number;
    active_users_last_30d: number;
    inactive_users_last_30d: number;
    new_users_last_7d: number;
    new_users_last_30d: number;
    users_with_feedback: number;
    users_with_trips: number;
    users_with_alerts: number;
    authenticated_sessions: number;
    guest_sessions: number;
    avg_searches_per_user: number;
    avg_messages_per_session: number;
    avg_sessions_per_user: number;
    messages_last_24h: number;
    total_searches: number;
    total_options?: number;
    redirect_messages: number;
    distinct_search_routes?: number;
  };
  growth_7d: Array<{
    date: string;
    new_users: number;
    active_users: number;
    sessions: number;
    searches: number;
  }>;
  distributions: {
    countries: BackendAdminDistributionItem[];
    genders: BackendAdminDistributionItem[];
    roles: BackendAdminDistributionItem[];
    statuses: BackendAdminDistributionItem[];
    cabin_classes: BackendAdminDistributionItem[];
    seat_preferences: BackendAdminDistributionItem[];
    flight_timings: BackendAdminDistributionItem[];
  };
  top_prompts: BackendAdminDistributionItem[];
  top_routes: BackendAdminDistributionItem[];
  top_search_routes?: BackendAdminDistributionItem[];
  users: Array<{
    id: string;
    name: string;
    email: string;
    nationality: string | null;
    gender: string | null;
    role: string;
    status: string;
    created_at: string | null;
    last_active_at: string | null;
    session_count: number;
    message_count: number;
    search_count: number;
    trip_count: number;
    alert_count: number;
    feedback_count: number;
    profile_completion: number;
    engagement_score: number;
    cabin_class: string | null;
    seat_preference: string | null;
    flight_timing: string | null;
  }>;
};

export type BackendAdminFunnelResponse = {
  generated_at: string;
  stages: Array<{
    key: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  drop_offs: Array<{
    from_key: string;
    to_key: string;
    from_label: string;
    to_label: string;
    drop_count: number;
    drop_percentage: number;
  }>;
  trend_7d: Array<{
    date: string;
    conversations: number;
    searches: number;
    options: number;
    redirects: number;
    trips: number;
  }>;
  top_routes: BackendAdminDistributionItem[];
  top_search_routes?: BackendAdminDistributionItem[];
  top_prompts: BackendAdminDistributionItem[];
};

export type BackendAdminBehaviorResponse = {
  generated_at: string;
  totals: {
    session_count: number;
    active_sessions: number;
    authenticated_sessions: number;
    guest_sessions: number;
    avg_searches_per_session: number;
    avg_messages_per_session: number;
    avg_session_duration_seconds: number;
    messages_last_24h: number;
  };
  search_distribution: BackendAdminDistributionItem[];
  message_distribution: BackendAdminDistributionItem[];
  session_duration_distribution: BackendAdminDistributionItem[];
  hourly_activity: Array<{
    label: string;
    sessions: number;
    messages: number;
    searches: number;
  }>;
  top_prompts: BackendAdminDistributionItem[];
  top_routes: BackendAdminDistributionItem[];
  top_search_routes?: BackendAdminDistributionItem[];
  recent_activity: Array<{
    session_id: string;
    user_id: string | null;
    updated_at: string | null;
    message_count: number;
    search_count: number;
    last_message_preview: string;
    status: "Active" | "Idle";
  }>;
};

export type AdminUsersTableItem = {
  id: string;
  displayId: string;
  name: string;
  email: string;
  nationality: string;
  gender: string;
  role: string;
  status: string;
  joinedLabel: string;
  lastActiveLabel: string;
  sessionCount: number;
  messageCount: number;
  searchCount: number;
  tripCount: number;
  alertCount: number;
  feedbackCount: number;
  profileCompletion: number;
  engagementScore: number;
  cabinClass: string;
  seatPreference: string;
  flightTiming: string;
};

export type AdminUsersPageResponse = {
  generatedAt: string;
  generatedLabel: string;
  metrics: AdminMetricCard[];
  growthTrend: Array<{
    label: string;
    newUsers: number;
    activeUsers: number;
    sessions: number;
    searches: number;
  }>;
  distributions: {
    countries: BackendAdminDistributionItem[];
    genders: BackendAdminDistributionItem[];
    cabinClasses: BackendAdminDistributionItem[];
    seatPreferences: BackendAdminDistributionItem[];
    flightTimings: BackendAdminDistributionItem[];
  };
  topPrompts: BackendAdminDistributionItem[];
  topRoutes: BackendAdminDistributionItem[];
  topSearchRoutes: BackendAdminDistributionItem[];
  users: AdminUsersTableItem[];
};

export type AdminGrowthPageResponse = {
  generatedAt: string;
  generatedLabel: string;
  metrics: AdminMetricCard[];
  growthTrend: Array<{
    label: string;
    users: number;
    activeUsers: number;
    sessions: number;
    searches: number;
    redirects: number;
  }>;
  acquisitionBreakdown: BackendAdminDistributionItem[];
  funnelStages: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
  /** Saved trips in user DB (origin → destination). */
  topRoutes: BackendAdminDistributionItem[];
  /** Routes inferred from flight search assistant payloads in chat. */
  topSearchRoutes: BackendAdminDistributionItem[];
  topPrompts: BackendAdminDistributionItem[];
};

export type AdminFunnelPageResponse = {
  generatedAt: string;
  generatedLabel: string;
  metrics: AdminMetricCard[];
  stages: Array<{
    key: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  trend: Array<{
    label: string;
    conversations: number;
    searches: number;
    redirects: number;
    trips: number;
  }>;
  dropOffs: Array<{
    id: string;
    label: string;
    dropCount: number;
    dropPercentage: number;
  }>;
  topRoutes: BackendAdminDistributionItem[];
  topPrompts: BackendAdminDistributionItem[];
};

export type AdminBehaviorPageResponse = {
  generatedAt: string;
  generatedLabel: string;
  metrics: AdminMetricCard[];
  searchDistribution: BackendAdminDistributionItem[];
  messageDistribution: BackendAdminDistributionItem[];
  sessionDurationDistribution: BackendAdminDistributionItem[];
  activityTrend: Array<{
    label: string;
    sessions: number;
    messages: number;
    searches: number;
  }>;
  topRoutes: BackendAdminDistributionItem[];
  topPrompts: BackendAdminDistributionItem[];
  recentActivity: Array<{
    id: string;
    displayId: string;
    userLabel: string;
    updatedLabel: string;
    messageCount: number;
    searchCount: number;
    status: "Active" | "Idle";
    lastMessagePreview: string;
  }>;
};
