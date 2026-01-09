import type { FeedbackCategory, Sentiment } from './feedback';

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: FeedbackCategory | null;
  subcategory: string | null;
  tags: string[] | null;
  baseSeverity: number;
  currentSeverity: number;
  priority: Priority;
  sentiment: Sentiment | null;
  sentimentScore: number | null;
  groupId: string | null;
  feedbackCount: number;
  affectedUsers: number;
  status: IssueStatus;
  resolution: string | null;
  assignedTo: string | null;
  firstReportedAt: string | null;
  lastFeedbackAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type IssueStatus =
  | 'new'
  | 'triaged'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'wont_fix';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface IssueGroup {
  id: string;
  name: string;
  description: string | null;
  summary: string | null;
  theme: string | null;
  issueCount: number;
  feedbackCount: number;
  avgSeverity: number;
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface Action {
  id: string;
  issueId: string;
  type: ActionType;
  payload: Record<string, unknown> | null;
  externalId: string | null;
  externalUrl: string | null;
  performedBy: string | null;
  status: 'pending' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export type ActionType =
  | 'jira_ticket'
  | 'assignment'
  | 'status_change'
  | 'resolution'
  | 'comment'
  | 'escalation';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'pm' | 'admin' | 'developer';
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, unknown> | null;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}
