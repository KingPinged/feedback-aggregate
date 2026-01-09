import { BaseProvider } from '../base';
import type { ProviderType, RawFeedback } from '../../types/provider';

const MOCK_SLACK_DATA: RawFeedback[] = [
  {
    externalId: 'slack-001',
    sourceUrl: 'https://company.slack.com/archives/C123/p001',
    author: { id: 'sales-1', name: 'Jennifer Sales', email: 'jennifer@company.com' },
    content: 'Customer Acme Corp is threatening to churn. They say the reporting feature is too slow - takes 30+ seconds to load their monthly report. They have a meeting with our competitor next week. URGENT.',
    metadata: { channel: '#customer-escalations', thread: true },
    sourceCreatedAt: '2025-01-04T08:00:00Z',
  },
  {
    externalId: 'slack-002',
    sourceUrl: 'https://company.slack.com/archives/C123/p002',
    author: { id: 'sales-2', name: 'Tom Account Exec', email: 'tom@company.com' },
    content: 'Multiple enterprise prospects asking about SOC2 Type II certification. We keep losing deals because we only have Type I. Can we prioritize this for Q1?',
    metadata: { channel: '#sales-feedback', reactions: ['+1', '+1', '+1', '+1'] },
    sourceCreatedAt: '2025-01-05T10:30:00Z',
  },
  {
    externalId: 'slack-003',
    sourceUrl: 'https://company.slack.com/archives/C456/p003',
    author: { id: 'support-1', name: 'Maria Support', email: 'maria@company.com' },
    content: 'Seeing a spike in tickets about the webhook delivery failures. At least 15 customers affected today. Webhooks are either delayed by hours or not delivered at all.',
    metadata: { channel: '#support-handoff' },
    sourceCreatedAt: '2025-01-06T13:45:00Z',
  },
  {
    externalId: 'slack-004',
    sourceUrl: 'https://company.slack.com/archives/C456/p004',
    author: { id: 'cs-1', name: 'David CS Manager', email: 'david@company.com' },
    content: 'Feature request from BigTech Inc (our largest account): They need audit logs with 1-year retention. Currently we only keep 90 days. This could be a $500k expansion if we deliver.',
    metadata: { channel: '#customer-feedback' },
    sourceCreatedAt: '2025-01-07T09:15:00Z',
  },
  {
    externalId: 'slack-005',
    sourceUrl: 'https://company.slack.com/archives/C789/p005',
    author: { id: 'support-2', name: 'Alex Support Lead', email: 'alex@company.com' },
    content: 'Password reset emails are landing in spam for Gmail users. Multiple complaints today. Customers are locked out of their accounts.',
    metadata: { channel: '#support-urgent' },
    sourceCreatedAt: '2025-01-07T14:30:00Z',
  },
  // Additional similar feedback for grouping tests
  {
    externalId: 'slack-006',
    sourceUrl: 'https://company.slack.com/archives/C456/p006',
    author: { id: 'support-3', name: 'Rachel Support', email: 'rachel@company.com' },
    content: 'More webhook failures reported. Customer TechStart says their Zapier integration completely broke. Webhooks are not firing at all for their account. This is the 3rd escalation this week.',
    metadata: { channel: '#support-handoff' },
    sourceCreatedAt: '2025-01-08T08:30:00Z',
  },
  {
    externalId: 'slack-007',
    sourceUrl: 'https://company.slack.com/archives/C789/p007',
    author: { id: 'support-4', name: 'Kevin Support', email: 'kevin@company.com' },
    content: 'Another password reset issue - this time Yahoo mail users. The emails are being bounced entirely. 8 tickets in the last hour alone.',
    metadata: { channel: '#support-urgent' },
    sourceCreatedAt: '2025-01-08T10:00:00Z',
  },
  {
    externalId: 'slack-008',
    sourceUrl: 'https://company.slack.com/archives/C123/p008',
    author: { id: 'sales-3', name: 'Amanda Sales', email: 'amanda@company.com' },
    content: 'Lost another deal to CompetitorX. Prospect said our reports are too slow compared to competition. They demoed loading 1M rows instantly while ours timed out. We need to fix report performance.',
    metadata: { channel: '#customer-escalations', thread: true },
    sourceCreatedAt: '2025-01-08T11:15:00Z',
  },
  {
    externalId: 'slack-009',
    sourceUrl: 'https://company.slack.com/archives/C456/p009',
    author: { id: 'support-5', name: 'Chris Engineer', email: 'chris@company.com' },
    content: 'Webhook delivery queue is backed up. Seeing 45 minute delays now. Root cause might be the database connection pool maxing out. Need engineering eyes on this ASAP.',
    metadata: { channel: '#support-handoff' },
    sourceCreatedAt: '2025-01-08T14:00:00Z',
  },
  {
    externalId: 'slack-010',
    sourceUrl: 'https://company.slack.com/archives/C123/p010',
    author: { id: 'cs-2', name: 'Linda CS', email: 'linda@company.com' },
    content: 'MegaCorp (enterprise account) also asking about extended audit logs. They need 2 years for compliance. If we had this, they would upgrade to our highest tier immediately.',
    metadata: { channel: '#customer-feedback' },
    sourceCreatedAt: '2025-01-08T15:30:00Z',
  },
];

export class MockSlackProvider extends BaseProvider {
  readonly id = 'slack-internal';
  readonly name = 'Slack Internal';
  readonly type: ProviderType = 'slack';

  async fetchFeedback(since?: Date): Promise<RawFeedback[]> {
    this.lastSync = new Date();
    if (since) {
      return MOCK_SLACK_DATA.filter(f => new Date(f.sourceCreatedAt) > since);
    }
    return MOCK_SLACK_DATA;
  }
}
