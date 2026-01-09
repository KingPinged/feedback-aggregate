export type ProviderType =
  | 'discord'
  | 'slack'
  | 'github'
  | 'twitter'
  | 'support'
  | 'custom';

export interface RawFeedback {
  externalId: string;
  sourceUrl?: string;
  author: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
  title?: string;
  content: string;
  contentType?: 'text' | 'markdown' | 'html';
  metadata?: Record<string, unknown>;
  sourceCreatedAt: string;
}

export interface FeedbackProvider {
  readonly id: string;
  readonly name: string;
  readonly type: ProviderType;

  initialize(config?: Record<string, unknown>): Promise<void>;
  fetchFeedback(since?: Date): Promise<RawFeedback[]>;
  testConnection(): Promise<boolean>;
  getStatus(): Promise<ProviderStatus>;
}

export interface ProviderStatus {
  healthy: boolean;
  lastSync?: Date;
  feedbackCount?: number;
  errorMessage?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  status: 'active' | 'inactive' | 'error';
  config?: Record<string, unknown>;
  lastSyncAt?: string;
}
