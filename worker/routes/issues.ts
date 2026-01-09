import type { Env } from '../types/env';
import { json } from '../utils/router';

export async function getIssues(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const priority = url.searchParams.get('priority');
  const category = url.searchParams.get('category');
  const sortBy = url.searchParams.get('sortBy') || 'current_severity';
  const sortOrder = url.searchParams.get('sortOrder') || 'DESC';
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let query = 'SELECT * FROM issues WHERE 1=1';
  const params: (string | number)[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  const validSortColumns = ['current_severity', 'created_at', 'updated_at', 'feedback_count', 'title'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'current_severity';
  const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  query += ` ORDER BY ${sortColumn} ${order} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const issues = await env.DB.prepare(query).bind(...params).all();

  // Get total count
  let countQuery = 'SELECT COUNT(*) as count FROM issues WHERE 1=1';
  const countParams: string[] = [];
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }
  if (priority) {
    countQuery += ' AND priority = ?';
    countParams.push(priority);
  }
  if (category) {
    countQuery += ' AND category = ?';
    countParams.push(category);
  }

  const total = await env.DB.prepare(countQuery).bind(...countParams).first<{ count: number }>();

  return json({
    issues: issues.results || [],
    total: total?.count || 0,
    limit,
    offset,
  });
}

export async function getIssue(
  _request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const { id } = params;

  const issue = await env.DB.prepare('SELECT * FROM issues WHERE id = ?')
    .bind(id)
    .first();

  if (!issue) {
    return json({ error: 'Issue not found' }, 404);
  }

  // Get linked feedback
  const feedback = await env.DB.prepare(`
    SELECT f.* FROM feedback_items f
    JOIN issue_feedback if_ ON f.id = if_.feedback_id
    WHERE if_.issue_id = ?
    ORDER BY f.created_at DESC
  `).bind(id).all();

  // Get actions
  const actions = await env.DB.prepare(`
    SELECT * FROM actions WHERE issue_id = ?
    ORDER BY created_at DESC
  `).bind(id).all();

  // Get assigned user if any
  let assignedUser = null;
  if (issue.assigned_to) {
    assignedUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(issue.assigned_to)
      .first();
  }

  return json({
    ...issue,
    feedback: feedback.results || [],
    actions: actions.results || [],
    assignedUser,
  });
}

export async function updateIssueStatus(
  request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const { id } = params;
  const body = await request.json() as { status: string; resolution?: string };

  const validStatuses = ['new', 'triaged', 'in_progress', 'resolved', 'closed', 'wont_fix'];
  if (!validStatuses.includes(body.status)) {
    return json({ error: 'Invalid status' }, 400);
  }

  let query = 'UPDATE issues SET status = ?, updated_at = datetime(\'now\')';
  const queryParams: (string | null)[] = [body.status];

  if (body.status === 'resolved' || body.status === 'closed') {
    query += ', resolved_at = datetime(\'now\')';
    if (body.resolution) {
      query += ', resolution = ?';
      queryParams.push(body.resolution);
    }
  }

  query += ' WHERE id = ?';
  queryParams.push(id);

  await env.DB.prepare(query).bind(...queryParams).run();

  // Log the action
  await env.DB.prepare(`
    INSERT INTO action_logs (id, issue_id, event_type, description, new_value, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    crypto.randomUUID(),
    id,
    'status_changed',
    `Status changed to ${body.status}`,
    body.status
  ).run();

  return json({ success: true });
}

export async function assignIssue(
  request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const { id } = params;
  const body = await request.json() as { userId: string };

  // Verify user exists
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(body.userId)
    .first();

  if (!user) {
    return json({ error: 'User not found' }, 404);
  }

  await env.DB.prepare(`
    UPDATE issues SET assigned_to = ?, status = 'triaged', updated_at = datetime('now')
    WHERE id = ?
  `).bind(body.userId, id).run();

  // Create action record
  await env.DB.prepare(`
    INSERT INTO actions (id, issue_id, type, payload, performed_by, status, created_at, completed_at)
    VALUES (?, ?, 'assignment', ?, ?, 'completed', datetime('now'), datetime('now'))
  `).bind(
    crypto.randomUUID(),
    id,
    JSON.stringify({ assignedTo: body.userId }),
    body.userId
  ).run();

  return json({ success: true, assignedTo: user });
}
