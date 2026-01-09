import type { Env } from '../types/env';
import { json } from '../utils/router';

export async function getIssueActions(
  _request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const { id } = params;

  const actions = await env.DB.prepare(`
    SELECT a.*, u.name as performed_by_name
    FROM actions a
    LEFT JOIN users u ON a.performed_by = u.id
    WHERE a.issue_id = ?
    ORDER BY a.created_at DESC
  `).bind(id).all();

  return json(actions.results || []);
}

export async function createJiraTicket(
  request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const { id } = params;
  const body = await request.json() as {
    title: string;
    description: string;
    priority: string;
    assignee?: string;
  };

  // Get issue details
  const issue = await env.DB.prepare('SELECT * FROM issues WHERE id = ?')
    .bind(id)
    .first();

  if (!issue) {
    return json({ error: 'Issue not found' }, 404);
  }

  // Simulate JIRA ticket creation
  const ticketId = `PROD-${Math.floor(Math.random() * 10000)}`;
  const ticketUrl = `https://company.atlassian.net/browse/${ticketId}`;

  // Create action record
  const actionId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO actions (id, issue_id, type, payload, external_id, external_url, status, created_at, completed_at)
    VALUES (?, ?, 'jira_ticket', ?, ?, ?, 'completed', datetime('now'), datetime('now'))
  `).bind(
    actionId,
    id,
    JSON.stringify({
      title: body.title,
      description: body.description,
      priority: body.priority,
      assignee: body.assignee,
    }),
    ticketId,
    ticketUrl
  ).run();

  // Update issue status
  await env.DB.prepare(`
    UPDATE issues SET status = 'triaged', updated_at = datetime('now')
    WHERE id = ?
  `).bind(id).run();

  // Log the action
  await env.DB.prepare(`
    INSERT INTO action_logs (id, action_id, issue_id, event_type, description, created_at)
    VALUES (?, ?, ?, 'jira_created', ?, datetime('now'))
  `).bind(
    crypto.randomUUID(),
    actionId,
    id,
    `JIRA ticket ${ticketId} created`
  ).run();

  return json({
    success: true,
    ticketId,
    ticketUrl,
  });
}

export async function resolveIssue(
  request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const { id } = params;
  const body = await request.json() as {
    resolution: string;
    notes?: string;
  };

  await env.DB.prepare(`
    UPDATE issues SET
      status = 'resolved',
      resolution = ?,
      resolved_at = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(body.resolution, id).run();

  // Create action record
  const actionId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO actions (id, issue_id, type, payload, status, created_at, completed_at)
    VALUES (?, ?, 'resolution', ?, 'completed', datetime('now'), datetime('now'))
  `).bind(
    actionId,
    id,
    JSON.stringify({ resolution: body.resolution, notes: body.notes })
  ).run();

  return json({ success: true });
}

export async function addComment(
  request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const { id } = params;
  const body = await request.json() as {
    comment: string;
    userId?: string;
  };

  const actionId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO actions (id, issue_id, type, payload, performed_by, status, created_at, completed_at)
    VALUES (?, ?, 'comment', ?, ?, 'completed', datetime('now'), datetime('now'))
  `).bind(
    actionId,
    id,
    JSON.stringify({ comment: body.comment }),
    body.userId || null
  ).run();

  return json({ success: true, actionId });
}

export async function getActionLogs(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const issueId = url.searchParams.get('issueId');
  const limit = parseInt(url.searchParams.get('limit') || '100');

  let query = `
    SELECT al.*, u.name as performed_by_name
    FROM action_logs al
    LEFT JOIN users u ON al.performed_by = u.id
  `;
  const params: (string | number)[] = [];

  if (issueId) {
    query += ' WHERE al.issue_id = ?';
    params.push(issueId);
  }

  query += ' ORDER BY al.created_at DESC LIMIT ?';
  params.push(limit);

  const logs = await env.DB.prepare(query).bind(...params).all();

  return json(logs.results || []);
}
