import type { FeedbackProvider, ProviderConfig } from '../types/provider';
import { MockDiscordProvider } from './mock/discord';
import { MockSlackProvider } from './mock/slack';
import { MockGitHubProvider } from './mock/github';
import { MockTwitterProvider } from './mock/twitter';
import { MockSupportProvider } from './mock/support';

export class ProviderRegistry {
  private providers: Map<string, FeedbackProvider> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register(new MockDiscordProvider());
    this.register(new MockSlackProvider());
    this.register(new MockGitHubProvider());
    this.register(new MockTwitterProvider());
    this.register(new MockSupportProvider());
  }

  register(provider: FeedbackProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): FeedbackProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): FeedbackProvider[] {
    return Array.from(this.providers.values());
  }

  getByType(type: string): FeedbackProvider[] {
    return this.getAll().filter(p => p.type === type);
  }

  async initializeAll(configs: ProviderConfig[]): Promise<void> {
    for (const config of configs) {
      const provider = this.get(config.id);
      if (provider) {
        await provider.initialize(config.config);
      }
    }
  }

  async fetchAllFeedback(since?: Date) {
    const results: { providerId: string; feedback: Awaited<ReturnType<FeedbackProvider['fetchFeedback']>> }[] = [];

    for (const provider of this.getAll()) {
      try {
        const feedback = await provider.fetchFeedback(since);
        results.push({ providerId: provider.id, feedback });
      } catch (error) {
        console.error(`Failed to fetch from ${provider.id}:`, error);
      }
    }

    return results;
  }
}

export const providerRegistry = new ProviderRegistry();
