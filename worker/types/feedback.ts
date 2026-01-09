export interface FeedbackItem {
  id: string;
  providerId: string;
  externalId: string | null;
  sourceUrl: string | null;
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  authorAvatar: string | null;
  title: string | null;
  content: string;
  contentType: 'text' | 'markdown' | 'html';
  processed: boolean;
  summary: string | null;
  category: FeedbackCategory | null;
  sentiment: Sentiment | null;
  sentimentScore: number | null;
  keywords: string[] | null;
  metadata: Record<string, unknown> | null;
  sourceCreatedAt: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FeedbackCategory =
  | 'bug'
  | 'feature_request'
  | 'complaint'
  | 'question'
  | 'praise'
  | 'other';

export type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface CreateFeedbackInput {
  providerId: string;
  externalId?: string;
  sourceUrl?: string;
  author?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
  title?: string;
  content: string;
  contentType?: 'text' | 'markdown' | 'html';
  metadata?: Record<string, unknown>;
  sourceCreatedAt?: string;
}

export interface ProcessedFeedback {
  summary: string;
  category: FeedbackCategory;
  sentiment: Sentiment;
  sentimentScore: number;
  keywords: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}
