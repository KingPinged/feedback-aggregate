import { BaseProvider } from '../base';
import type { ProviderType, RawFeedback } from '../../types/provider';

const MOCK_SUPPORT_DATA: RawFeedback[] = [
  {
    externalId: 'ticket-1001',
    sourceUrl: 'https://support.company.com/tickets/1001',
    author: { id: 'cust-1', name: 'John Smith', email: 'john@acmecorp.com' },
    title: 'Cannot reset password - email never arrives',
    content: `I've tried resetting my password 5 times over the past 2 days. The email never arrives. I've checked spam, tried different browsers, cleared cache. Nothing works.

I'm completely locked out of my account and have a critical deadline tomorrow. Please help urgently!

Account email: john@acmecorp.com
Company: Acme Corp (Enterprise plan)`,
    metadata: { priority: 'urgent', plan: 'enterprise', ticketAge: 2 },
    sourceCreatedAt: '2025-01-05T08:00:00Z',
  },
  {
    externalId: 'ticket-1002',
    sourceUrl: 'https://support.company.com/tickets/1002',
    author: { id: 'cust-2', name: 'Sarah Johnson', email: 'sarah@bigtech.io' },
    title: 'Billing discrepancy - charged twice this month',
    content: `We were charged twice for our monthly subscription on Jan 1st and Jan 3rd.

Transaction IDs:
- TXN-001: $2,500 on Jan 1
- TXN-002: $2,500 on Jan 3

Please refund the duplicate charge and investigate why this happened. We need this resolved before our finance team closes the books.`,
    metadata: { priority: 'high', plan: 'enterprise', ticketAge: 4 },
    sourceCreatedAt: '2025-01-03T14:30:00Z',
  },
  {
    externalId: 'ticket-1003',
    sourceUrl: 'https://support.company.com/tickets/1003',
    author: { id: 'cust-3', name: 'Mike Chen', email: 'mike@startup.co' },
    title: 'How to set up SSO with Okta?',
    content: `We're trying to set up SSO integration with Okta but the documentation seems outdated. The screenshots don't match the current Okta interface.

Could you provide:
1. Updated step-by-step guide
2. Required SAML attributes
3. Example configuration

We're on the Business plan and this is blocking our security compliance audit.`,
    metadata: { priority: 'medium', plan: 'business', ticketAge: 1 },
    sourceCreatedAt: '2025-01-06T10:00:00Z',
  },
  {
    externalId: 'ticket-1004',
    sourceUrl: 'https://support.company.com/tickets/1004',
    author: { id: 'cust-4', name: 'Lisa Wong', email: 'lisa@agency.com' },
    title: 'API returning 500 errors randomly',
    content: `Our integration has been failing intermittently since yesterday. About 30% of our API calls return 500 errors with no useful error message.

Affected endpoints:
- POST /api/v1/projects
- GET /api/v1/users

Request IDs from failed calls:
- req_abc123
- req_def456
- req_ghi789

This is impacting our client deliverables. Please investigate urgently.`,
    metadata: { priority: 'urgent', plan: 'business', ticketAge: 1 },
    sourceCreatedAt: '2025-01-06T16:45:00Z',
  },
  {
    externalId: 'ticket-1005',
    sourceUrl: 'https://support.company.com/tickets/1005',
    author: { id: 'cust-5', name: 'Robert Davis', email: 'robert@nonprofit.org' },
    title: 'Request for nonprofit discount',
    content: `Hi, we're a registered 501(c)(3) nonprofit organization working on education initiatives.

We love your product but the current pricing is outside our budget. Do you offer any discounts for nonprofits?

Our EIN: 12-3456789
Organization: Education For All Foundation

Thank you for considering!`,
    metadata: { priority: 'low', plan: 'free', ticketAge: 3 },
    sourceCreatedAt: '2025-01-04T09:15:00Z',
  },
  {
    externalId: 'ticket-1006',
    sourceUrl: 'https://support.company.com/tickets/1006',
    author: { id: 'cust-6', name: 'Emma Wilson', email: 'emma@fintech.com' },
    title: 'Data export taking forever - times out after 30 min',
    content: `I need to export our project data for compliance reasons but the export keeps timing out. I've tried:
- Different browsers
- Smaller date ranges
- Off-peak hours

Nothing works. The export starts but fails after about 30 minutes every time.

We have ~500k records to export. Is there a limit I'm hitting? Any workaround?`,
    metadata: { priority: 'high', plan: 'enterprise', ticketAge: 2 },
    sourceCreatedAt: '2025-01-05T11:30:00Z',
  },
  // Additional similar feedback for grouping tests
  {
    externalId: 'ticket-1007',
    sourceUrl: 'https://support.company.com/tickets/1007',
    author: { id: 'cust-7', name: 'Peter Anderson', email: 'peter@retailco.com' },
    title: 'Password reset not working - no email received',
    content: `Same issue as I reported last month - password reset emails are not being delivered to our company domain. We use Office 365 and have whitelisted your sending domain but still nothing.

3 team members are currently locked out. This is really impacting our operations.

Domain: retailco.com`,
    metadata: { priority: 'urgent', plan: 'business', ticketAge: 1 },
    sourceCreatedAt: '2025-01-08T07:00:00Z',
  },
  {
    externalId: 'ticket-1008',
    sourceUrl: 'https://support.company.com/tickets/1008',
    author: { id: 'cust-8', name: 'Diana Martinez', email: 'diana@consulting.io' },
    title: 'CSV export fails for large datasets',
    content: `Trying to export our client reports to CSV but it fails every time for reports with more than 5000 rows.

Error message: "Export timed out. Please try again later."

We need this data for our quarterly client review tomorrow. Is there a way to batch the export or increase the timeout?`,
    metadata: { priority: 'high', plan: 'business', ticketAge: 1 },
    sourceCreatedAt: '2025-01-08T09:45:00Z',
  },
  {
    externalId: 'ticket-1009',
    sourceUrl: 'https://support.company.com/tickets/1009',
    author: { id: 'cust-9', name: 'James Lee', email: 'james@healthcare.org' },
    title: 'Azure AD SSO configuration failing',
    content: `We're trying to configure SSO with Azure AD but keep getting "Invalid SAML response" errors.

We've followed the documentation exactly:
- Configured entity ID
- Set up claim mappings
- Uploaded certificate

Our IT team has spent 2 days on this. We need SSO working for our HIPAA compliance audit next week.`,
    metadata: { priority: 'urgent', plan: 'enterprise', ticketAge: 2 },
    sourceCreatedAt: '2025-01-07T13:00:00Z',
  },
  {
    externalId: 'ticket-1010',
    sourceUrl: 'https://support.company.com/tickets/1010',
    author: { id: 'cust-10', name: 'Nancy Brown', email: 'nancy@ecommerce.com' },
    title: 'Webhooks not triggering for order events',
    content: `Our webhook endpoint stopped receiving order notifications 2 days ago. The endpoint is working (we tested with other services) but your webhooks never arrive.

Webhook URL: https://api.ecommerce.com/webhooks/orders
Events subscribed: order.created, order.updated

This is breaking our fulfillment pipeline. Orders are getting delayed because we don't know about them.`,
    metadata: { priority: 'urgent', plan: 'enterprise', ticketAge: 2 },
    sourceCreatedAt: '2025-01-06T16:00:00Z',
  },
  {
    externalId: 'ticket-1011',
    sourceUrl: 'https://support.company.com/tickets/1011',
    author: { id: 'cust-11', name: 'Mark Taylor', email: 'mark@saas.io' },
    title: 'Report generation extremely slow',
    content: `Our monthly analytics report used to generate in under 10 seconds. Now it takes over 2 minutes and often times out completely.

Nothing has changed on our end. Same filters, same date range.

This started around January 3rd. Did something change on your infrastructure?`,
    metadata: { priority: 'high', plan: 'business', ticketAge: 5 },
    sourceCreatedAt: '2025-01-03T10:00:00Z',
  },
  {
    externalId: 'ticket-1012',
    sourceUrl: 'https://support.company.com/tickets/1012',
    author: { id: 'cust-12', name: 'Susan Clark', email: 'susan@university.edu' },
    title: 'Google SSO login loop',
    content: `When our users try to sign in with Google SSO, they get stuck in an endless redirect loop. The page just keeps loading and redirecting.

This affects all 500+ users in our organization. We had to temporarily disable SSO and use password auth which is a security concern.

Browser: Chrome 120
This started after your update last week.`,
    metadata: { priority: 'critical', plan: 'enterprise', ticketAge: 3 },
    sourceCreatedAt: '2025-01-05T08:30:00Z',
  },
];

export class MockSupportProvider extends BaseProvider {
  readonly id = 'support-zendesk';
  readonly name = 'Support Tickets';
  readonly type: ProviderType = 'support';

  async fetchFeedback(since?: Date): Promise<RawFeedback[]> {
    this.lastSync = new Date();
    if (since) {
      return MOCK_SUPPORT_DATA.filter(f => new Date(f.sourceCreatedAt) > since);
    }
    return MOCK_SUPPORT_DATA;
  }
}
