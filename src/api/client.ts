const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Dashboard
export const api = {
  dashboard: {
    getOverview: () => fetchApi<DashboardOverview>('/dashboard/overview'),
    getSeverity: () => fetchApi<SeverityData[]>('/dashboard/severity'),
    getTrends: () => fetchApi<TrendData[]>('/dashboard/trends'),
    getCategories: () => fetchApi<CategoryData[]>('/dashboard/categories'),
  },

  issues: {
    list: (params?: IssueFilters) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.priority) query.set('priority', params.priority);
      if (params?.category) query.set('category', params.category);
      if (params?.sortBy) query.set('sortBy', params.sortBy);
      if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.offset) query.set('offset', String(params.offset));
      return fetchApi<IssueListResponse>(`/issues?${query}`);
    },
    get: (id: string) => fetchApi<IssueDetail>(`/issues/${id}`),
    updateStatus: (id: string, status: string, resolution?: string) =>
      fetchApi(`/issues/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolution }),
      }),
    assign: (id: string, userId: string) =>
      fetchApi(`/issues/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ userId }),
      }),
  },

  feedback: {
    list: (params?: { providerId?: string; processed?: boolean; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.providerId) query.set('providerId', params.providerId);
      if (params?.processed !== undefined) query.set('processed', String(params.processed));
      if (params?.limit) query.set('limit', String(params.limit));
      return fetchApi<FeedbackListResponse>(`/feedback?${query}`);
    },
    ingest: () => fetchApi<IngestResult>('/feedback/ingest', { method: 'POST' }),
    ingestProvider: (providerId: string) =>
      fetchApi<IngestResult>(`/feedback/ingest/${providerId}`, { method: 'POST' }),
  },

  actions: {
    list: (issueId: string) => fetchApi<Action[]>(`/issues/${issueId}/actions`),
    createTicket: (issueId: string, data: CreateTicketData) =>
      fetchApi<TicketResult>(`/issues/${issueId}/actions/ticket`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resolve: (issueId: string, resolution: string, notes?: string) =>
      fetchApi(`/issues/${issueId}/actions/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution, notes }),
      }),
    comment: (issueId: string, comment: string) =>
      fetchApi(`/issues/${issueId}/actions/comment`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),
    getLogs: (issueId?: string) => {
      const query = issueId ? `?issueId=${issueId}` : '';
      return fetchApi<ActionLog[]>(`/actions/logs${query}`);
    },
  },

  providers: {
    list: () => fetchApi<Provider[]>('/providers'),
    get: (id: string) => fetchApi<ProviderDetail>(`/providers/${id}`),
    test: (id: string) => fetchApi<{ healthy: boolean }>(`/providers/${id}/test`, { method: 'POST' }),
    sync: (id: string) => fetchApi<SyncResult>(`/providers/${id}/sync`, { method: 'POST' }),
  },

  users: {
    list: () => fetchApi<User[]>('/users'),
  },
};

// Types
export interface DashboardOverview {
  metrics: {
    totalIssues: number;
    openIssues: number;
    criticalIssues: number;
    totalFeedback: number;
  };
  providers: Provider[];
  topIssues: Issue[];
}

export interface SeverityData {
  priority: string;
  count: number;
}

export interface TrendData {
  date: string;
  count: number;
}

export interface CategoryData {
  category: string;
  count: number;
  avg_severity: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string | null;
  base_severity: number;
  current_severity: number;
  priority: string;
  sentiment: string | null;
  sentiment_score: number | null;
  feedback_count: number;
  status: string;
  assigned_to: string | null;
  first_reported_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueDetail extends Issue {
  feedback: Feedback[];
  actions: Action[];
  assignedUser: User | null;
}

export interface IssueFilters {
  status?: string;
  priority?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  offset?: number;
}

export interface IssueListResponse {
  issues: Issue[];
  total: number;
  limit: number;
  offset: number;
}

export interface Feedback {
  id: string;
  provider_id: string;
  title: string | null;
  content: string;
  author_name: string | null;
  category: string | null;
  sentiment: string | null;
  source_created_at: string;
  created_at: string;
}

export interface FeedbackListResponse {
  feedback: Feedback[];
  limit: number;
  offset: number;
}

export interface Action {
  id: string;
  issue_id: string;
  type: string;
  payload: string | null;
  external_id: string | null;
  external_url: string | null;
  performed_by: string | null;
  performed_by_name?: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export interface ActionLog {
  id: string;
  action_id: string | null;
  issue_id: string | null;
  event_type: string;
  description: string | null;
  performed_by_name: string | null;
  created_at: string;
}

export interface Provider {
  id: string;
  name: string;
  type: string;
  status: string;
  last_sync_at: string | null;
  feedback_count?: number;
}

export interface ProviderDetail extends Provider {
  processed_count: number;
  recentFeedback: Feedback[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface CreateTicketData {
  title: string;
  description: string;
  priority: string;
  assignee?: string;
}

export interface TicketResult {
  success: boolean;
  ticketId: string;
  ticketUrl: string;
}

export interface IngestResult {
  success: boolean;
  ingested: number;
  processed: number;
  issuesCreated: number;
}

export interface SyncResult {
  success: boolean;
  feedbackCount: number;
}
