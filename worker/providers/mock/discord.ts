import { BaseProvider } from '../base';
import type { ProviderType, RawFeedback } from '../../types/provider';

const MOCK_DISCORD_DATA: RawFeedback[] = [
  {
    externalId: 'discord-001',
    sourceUrl: 'https://discord.com/channels/123/456/001',
    author: { id: 'user-1', name: 'FrustratedDev#1234' },
    content: 'The dashboard keeps crashing whenever I try to export reports to CSV. This has been happening for 3 days now and it is completely blocking my work. Multiple users in my team are experiencing the same issue. We need this fixed ASAP!',
    metadata: { channelName: 'bug-reports', reactions: { thumbsUp: 23 } },
    sourceCreatedAt: '2025-01-03T10:30:00Z',
  },
  {
    externalId: 'discord-002',
    sourceUrl: 'https://discord.com/channels/123/456/002',
    author: { id: 'user-2', name: 'NightOwlCoder#5678' },
    content: 'Would love to see dark mode support. The current white theme is harsh on the eyes during late-night coding sessions. This would be a huge quality of life improvement!',
    metadata: { channelName: 'feature-requests', reactions: { thumbsUp: 156, fire: 12 } },
    sourceCreatedAt: '2025-01-04T22:15:00Z',
  },
  {
    externalId: 'discord-003',
    sourceUrl: 'https://discord.com/channels/123/456/003',
    author: { id: 'user-3', name: 'PowerUser#9999' },
    content: 'The new API rate limits are way too restrictive. We went from 1000 requests/min to 100. This breaks our entire integration pipeline. Was there any announcement about this change?',
    metadata: { channelName: 'general', reactions: { thumbsUp: 45, angry: 8 } },
    sourceCreatedAt: '2025-01-05T14:20:00Z',
  },
  {
    externalId: 'discord-004',
    sourceUrl: 'https://discord.com/channels/123/456/004',
    author: { id: 'user-4', name: 'HappyCustomer#2222' },
    content: 'Just wanted to say the latest update is fantastic! The new filtering system in the analytics dashboard saves me so much time. Great work team!',
    metadata: { channelName: 'general', reactions: { heart: 34, thumbsUp: 28 } },
    sourceCreatedAt: '2025-01-06T09:45:00Z',
  },
  {
    externalId: 'discord-005',
    sourceUrl: 'https://discord.com/channels/123/456/005',
    author: { id: 'user-5', name: 'EnterpriseAdmin#3333' },
    content: 'SSO login fails intermittently with SAML assertion errors. About 20% of our users cannot log in on any given day. This is a critical blocker for our enterprise deployment.',
    metadata: { channelName: 'bug-reports', reactions: { thumbsUp: 67 } },
    sourceCreatedAt: '2025-01-06T16:30:00Z',
  },
  {
    externalId: 'discord-006',
    sourceUrl: 'https://discord.com/channels/123/456/006',
    author: { id: 'user-6', name: 'MobileUser#4444' },
    content: 'Any plans for a mobile app? The web interface works but its really hard to use on my phone. Even a PWA would be helpful.',
    metadata: { channelName: 'feature-requests', reactions: { thumbsUp: 89 } },
    sourceCreatedAt: '2025-01-07T11:00:00Z',
  },
  // Additional similar feedback for grouping tests
  {
    externalId: 'discord-007',
    sourceUrl: 'https://discord.com/channels/123/456/007',
    author: { id: 'user-7', name: 'DataAnalyst#7777' },
    content: 'Export to CSV is broken for me too! Every time I try to export my analytics data the page just freezes and then shows an error. Been trying for 2 days.',
    metadata: { channelName: 'bug-reports', reactions: { thumbsUp: 18 } },
    sourceCreatedAt: '2025-01-07T14:30:00Z',
  },
  {
    externalId: 'discord-008',
    sourceUrl: 'https://discord.com/channels/123/456/008',
    author: { id: 'user-8', name: 'EyeStrainDev#8888' },
    content: 'PLEASE add a dark theme! I work night shifts and the bright white UI is literally giving me headaches. Even a simple toggle would help.',
    metadata: { channelName: 'feature-requests', reactions: { thumbsUp: 203, fire: 45 } },
    sourceCreatedAt: '2025-01-07T23:45:00Z',
  },
  {
    externalId: 'discord-009',
    sourceUrl: 'https://discord.com/channels/123/456/009',
    author: { id: 'user-9', name: 'APIBuilder#9000' },
    content: 'Rate limiting is killing our app. We hit the 100/min limit within seconds of peak usage. Our customers are seeing errors constantly. Please increase the limits or offer a higher tier.',
    metadata: { channelName: 'general', reactions: { thumbsUp: 67, angry: 15 } },
    sourceCreatedAt: '2025-01-08T09:00:00Z',
  },
  {
    externalId: 'discord-010',
    sourceUrl: 'https://discord.com/channels/123/456/010',
    author: { id: 'user-10', name: 'OktaAdmin#1010' },
    content: 'Our Okta SSO integration randomly stops working. Users get stuck in a redirect loop. Support said it might be a SAML clock skew issue but we verified our server times are synced.',
    metadata: { channelName: 'bug-reports', reactions: { thumbsUp: 34 } },
    sourceCreatedAt: '2025-01-08T10:15:00Z',
  },
  {
    externalId: 'discord-011',
    sourceUrl: 'https://discord.com/channels/123/456/011',
    author: { id: 'user-11', name: 'ReportGuy#1111' },
    content: 'Just chiming in - CSV export also broken for me. Large reports (>10k rows) always fail. Smaller ones work fine. Seems like a timeout issue?',
    metadata: { channelName: 'bug-reports', reactions: { thumbsUp: 12 } },
    sourceCreatedAt: '2025-01-08T11:30:00Z',
  },
  {
    externalId: 'discord-012',
    sourceUrl: 'https://discord.com/channels/123/456/012',
    author: { id: 'user-12', name: 'NightShiftWorker#1212' },
    content: 'Another vote for dark mode. I use f.lux but it makes your UI look weird. A native dark theme would be perfect.',
    metadata: { channelName: 'feature-requests', reactions: { thumbsUp: 78 } },
    sourceCreatedAt: '2025-01-08T02:00:00Z',
  },
];

export class MockDiscordProvider extends BaseProvider {
  readonly id = 'discord-main';
  readonly name = 'Discord Community';
  readonly type: ProviderType = 'discord';

  async fetchFeedback(since?: Date): Promise<RawFeedback[]> {
    this.lastSync = new Date();
    if (since) {
      return MOCK_DISCORD_DATA.filter(f => new Date(f.sourceCreatedAt) > since);
    }
    return MOCK_DISCORD_DATA;
  }
}
