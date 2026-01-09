import type { Env } from '../types/env';
import { json } from '../utils/router';

export async function getDashboardOverview(
  _request: Request,
  env: Env
): Promise<Response> {
  const [
    totalIssues,
    openIssues,
    criticalIssues,
    feedbackCount,
    providerStats,
    recentIssues,
  ] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM issues').first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) as count FROM issues WHERE status NOT IN ('resolved', 'closed')").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) as count FROM issues WHERE priority = 'critical'").first<{ count: number }>(),
    env.DB.prepare('SELECT COUNT(*) as count FROM feedback_items').first<{ count: number }>(),
    env.DB.prepare(`
      SELECT p.id, p.name, p.type, p.status, p.last_sync_at,
        (SELECT COUNT(*) FROM feedback_items WHERE provider_id = p.id) as feedback_count
      FROM providers p
    `).all(),
    env.DB.prepare(`
      SELECT id, title, current_severity, priority, category, status, created_at
      FROM issues
      ORDER BY current_severity DESC
      LIMIT 10
    `).all(),
  ]);

  return json({
    metrics: {
      totalIssues: totalIssues?.count || 0,
      openIssues: openIssues?.count || 0,
      criticalIssues: criticalIssues?.count || 0,
      totalFeedback: feedbackCount?.count || 0,
    },
    providers: providerStats.results || [],
    topIssues: recentIssues.results || [],
  });
}

export async function getSeverityDistribution(
  _request: Request,
  env: Env
): Promise<Response> {
  const distribution = await env.DB.prepare(`
    SELECT
      priority,
      COUNT(*) as count
    FROM issues
    WHERE status NOT IN ('resolved', 'closed')
    GROUP BY priority
  `).all();

  return json(distribution.results || []);
}

export async function getTrends(
  _request: Request,
  env: Env
): Promise<Response> {
  // Get feedback count by day for last 30 days
  const trends = await env.DB.prepare(`
    SELECT
      date(created_at) as date,
      COUNT(*) as count
    FROM feedback_items
    WHERE created_at >= date('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all();

  return json(trends.results || []);
}

export async function getCategoryBreakdown(
  _request: Request,
  env: Env
): Promise<Response> {
  const categories = await env.DB.prepare(`
    SELECT
      category,
      COUNT(*) as count,
      AVG(current_severity) as avg_severity
    FROM issues
    GROUP BY category
  `).all();

  return json(categories.results || []);
}
