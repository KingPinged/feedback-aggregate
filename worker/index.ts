import { Router, cors } from './utils/router';
import {
  getDashboardOverview,
  getSeverityDistribution,
  getTrends,
  getCategoryBreakdown,
} from './routes/dashboard';
import {
  getIssues,
  getIssue,
  updateIssueStatus,
  assignIssue,
} from './routes/issues';
import {
  getFeedback,
  triggerIngestion,
  ingestFromProvider,
} from './routes/feedback';
import {
  getIssueActions,
  createJiraTicket,
  resolveIssue,
  addComment,
  getActionLogs,
} from './routes/actions';
import {
  getProviders,
  getProvider,
  testProvider,
  syncProvider,
  getUsers,
} from './routes/providers';
import type { Env } from './types/env';

const router = new Router();

// Dashboard routes
router.get('/api/dashboard/overview', getDashboardOverview);
router.get('/api/dashboard/severity', getSeverityDistribution);
router.get('/api/dashboard/trends', getTrends);
router.get('/api/dashboard/categories', getCategoryBreakdown);

// Issues routes
router.get('/api/issues', getIssues);
router.get('/api/issues/:id', getIssue);
router.patch('/api/issues/:id/status', updateIssueStatus);
router.patch('/api/issues/:id/assign', assignIssue);

// Feedback routes
router.get('/api/feedback', getFeedback);
router.post('/api/feedback/ingest', triggerIngestion);
router.post('/api/feedback/ingest/:providerId', ingestFromProvider);

// Actions routes
router.get('/api/issues/:id/actions', getIssueActions);
router.post('/api/issues/:id/actions/ticket', createJiraTicket);
router.post('/api/issues/:id/actions/resolve', resolveIssue);
router.post('/api/issues/:id/actions/comment', addComment);
router.get('/api/actions/logs', getActionLogs);

// Provider routes
router.get('/api/providers', getProviders);
router.get('/api/providers/:id', getProvider);
router.post('/api/providers/:id/test', testProvider);
router.post('/api/providers/:id/sync', syncProvider);

// Users route
router.get('/api/users', getUsers);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }));
    }

    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      const response = await router.handle(request, env);
      return cors(response);
    }

    // Let static assets be handled by Cloudflare
    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
