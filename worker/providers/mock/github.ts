import { BaseProvider } from '../base';
import type { ProviderType, RawFeedback } from '../../types/provider';

const MOCK_GITHUB_DATA: RawFeedback[] = [
  {
    externalId: 'gh-issue-101',
    sourceUrl: 'https://github.com/company/product/issues/101',
    author: { id: 'gh-user-1', name: 'developer-jane' },
    title: 'Memory leak in WebSocket connection handler',
    content: `## Description
The WebSocket handler doesn't properly clean up connections when clients disconnect unexpectedly. Over time, this causes memory usage to grow unbounded.

## Steps to Reproduce
1. Open 100 WebSocket connections
2. Kill the client process without closing connections
3. Monitor server memory usage
4. Memory grows by ~10MB per 100 orphaned connections

## Expected Behavior
Memory should be released when connections are orphaned.

## Environment
- Node.js 20.x
- Production servers`,
    metadata: { labels: ['bug', 'critical', 'memory'], state: 'open' },
    sourceCreatedAt: '2025-01-02T16:00:00Z',
  },
  {
    externalId: 'gh-issue-102',
    sourceUrl: 'https://github.com/company/product/issues/102',
    author: { id: 'gh-user-2', name: 'api-integrator' },
    title: 'REST API documentation missing pagination examples',
    content: `The API docs for the /users endpoint mention pagination but don't show how to use the cursor-based pagination.

Specifically missing:
- How to get the next page
- What the cursor format is
- Maximum page size

This blocked our integration for 2 days until we figured it out from trial and error.`,
    metadata: { labels: ['documentation', 'api'] },
    sourceCreatedAt: '2025-01-04T11:30:00Z',
  },
  {
    externalId: 'gh-issue-103',
    sourceUrl: 'https://github.com/company/product/issues/103',
    author: { id: 'gh-user-3', name: 'security-researcher' },
    title: 'XSS vulnerability in user profile bio field',
    content: `## Security Issue
User bio field allows script injection. While there's sanitization, it can be bypassed with:

\`\`\`html
<img src=x onerror="alert(document.cookie)">
\`\`\`

## Impact
Attackers can steal session cookies from users viewing malicious profiles.

## Suggested Fix
Use a proper HTML sanitizer like DOMPurify with strict configuration.`,
    metadata: { labels: ['security', 'critical'] },
    sourceCreatedAt: '2025-01-05T09:00:00Z',
  },
  {
    externalId: 'gh-issue-104',
    sourceUrl: 'https://github.com/company/product/issues/104',
    author: { id: 'gh-user-4', name: 'data-team' },
    title: 'Feature Request: GraphQL API',
    content: `We're building a complex dashboard that requires multiple REST calls to render a single view. A GraphQL API would let us fetch exactly the data we need in one request.

Benefits:
- Reduce over-fetching
- Single request for complex views
- Better developer experience
- Type safety with codegen

Would be happy to contribute to the implementation if you provide guidance.`,
    metadata: { labels: ['feature-request', 'api', 'enhancement'] },
    sourceCreatedAt: '2025-01-06T14:20:00Z',
  },
  {
    externalId: 'gh-issue-105',
    sourceUrl: 'https://github.com/company/product/issues/105',
    author: { id: 'gh-user-5', name: 'ci-cd-engineer' },
    title: 'SDK v3.0 breaking change not documented',
    content: `Upgraded from SDK v2.9 to v3.0 and our entire test suite broke.

The \`client.users.list()\` method now returns a Promise instead of the raw data. This is a breaking change that wasn't mentioned in the changelog.

Please document breaking changes prominently. We spent 4 hours debugging this.`,
    metadata: { labels: ['documentation', 'sdk', 'breaking-change'] },
    sourceCreatedAt: '2025-01-07T10:00:00Z',
  },
];

export class MockGitHubProvider extends BaseProvider {
  readonly id = 'github-issues';
  readonly name = 'GitHub Issues';
  readonly type: ProviderType = 'github';

  async fetchFeedback(since?: Date): Promise<RawFeedback[]> {
    this.lastSync = new Date();
    if (since) {
      return MOCK_GITHUB_DATA.filter(f => new Date(f.sourceCreatedAt) > since);
    }
    return MOCK_GITHUB_DATA;
  }
}
