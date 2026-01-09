import type { FeedbackProvider, ProviderStatus, ProviderType, RawFeedback } from '../types/provider';

export abstract class BaseProvider implements FeedbackProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly type: ProviderType;

  protected config: Record<string, unknown> = {};
  protected lastSync?: Date;
  protected isInitialized = false;

  async initialize(config?: Record<string, unknown>): Promise<void> {
    this.config = config || {};
    this.isInitialized = true;
  }

  abstract fetchFeedback(since?: Date): Promise<RawFeedback[]>;

  async testConnection(): Promise<boolean> {
    try {
      await this.fetchFeedback(new Date());
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<ProviderStatus> {
    return {
      healthy: this.isInitialized,
      lastSync: this.lastSync,
    };
  }
}
