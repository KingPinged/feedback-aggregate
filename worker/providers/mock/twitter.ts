import { BaseProvider } from '../base';
import type { ProviderType, RawFeedback } from '../../types/provider';

const MOCK_TWITTER_DATA: RawFeedback[] = [
  {
    externalId: 'tweet-001',
    sourceUrl: 'https://twitter.com/user1/status/001',
    author: { id: 'tw-1', name: '@angryuser2025' },
    content: '@YourProduct has been down for 2 hours now. No status update, no communication. This is unacceptable for a paid service. #outage',
    metadata: { likes: 234, retweets: 89, replies: 45 },
    sourceCreatedAt: '2025-01-05T03:30:00Z',
  },
  {
    externalId: 'tweet-002',
    sourceUrl: 'https://twitter.com/user2/status/002',
    author: { id: 'tw-2', name: '@devadvocate' },
    content: 'Just discovered @YourProduct and WOW! Setup took 5 minutes and it already saved me hours of work. Highly recommend for any dev team!',
    metadata: { likes: 567, retweets: 123 },
    sourceCreatedAt: '2025-01-05T15:00:00Z',
  },
  {
    externalId: 'tweet-003',
    sourceUrl: 'https://twitter.com/user3/status/003',
    author: { id: 'tw-3', name: '@startup_cto' },
    content: 'Dear @YourProduct - please add Terraform provider support. Managing infrastructure through the UI doesn\'t scale. We need IaC!',
    metadata: { likes: 89, retweets: 34 },
    sourceCreatedAt: '2025-01-06T10:45:00Z',
  },
  {
    externalId: 'tweet-004',
    sourceUrl: 'https://twitter.com/user4/status/004',
    author: { id: 'tw-4', name: '@techblogger' },
    content: 'Hot take: @YourProduct pricing is getting ridiculous. $50/month for basic features that competitors offer for free. Time to evaluate alternatives.',
    metadata: { likes: 456, retweets: 178, replies: 89 },
    sourceCreatedAt: '2025-01-06T18:20:00Z',
  },
  {
    externalId: 'tweet-005',
    sourceUrl: 'https://twitter.com/user5/status/005',
    author: { id: 'tw-5', name: '@enterprise_pm' },
    content: 'Switched from [Competitor] to @YourProduct 6 months ago. Best decision ever. Support team is incredibly responsive and the product just works.',
    metadata: { likes: 123, retweets: 45 },
    sourceCreatedAt: '2025-01-07T12:00:00Z',
  },
  {
    externalId: 'tweet-006',
    sourceUrl: 'https://twitter.com/user6/status/006',
    author: { id: 'tw-6', name: '@frustrated_dev' },
    content: '@YourProduct your iOS app crashes every time I try to view notifications. iPhone 15, iOS 17.2. Been like this for weeks. Any ETA on fix?',
    metadata: { likes: 67, retweets: 12 },
    sourceCreatedAt: '2025-01-07T16:30:00Z',
  },
];

export class MockTwitterProvider extends BaseProvider {
  readonly id = 'twitter-mentions';
  readonly name = 'Twitter/X Mentions';
  readonly type: ProviderType = 'twitter';

  async fetchFeedback(since?: Date): Promise<RawFeedback[]> {
    this.lastSync = new Date();
    if (since) {
      return MOCK_TWITTER_DATA.filter(f => new Date(f.sourceCreatedAt) > since);
    }
    return MOCK_TWITTER_DATA;
  }
}
