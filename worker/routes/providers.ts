import type { Env } from '../types/env';
import { json } from '../utils/router';
import { providerRegistry } from '../providers';

export async function getProviders(
  _request: Request,
  env: Env
): Promise<Response> {
  const providers = await env.DB.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM feedback_items WHERE provider_id = p.id) as feedback_count
    FROM providers p
    ORDER BY p.name
  `).all();

  return json(providers.results || []);
}

export async function getProvider(
  _request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const { id } = params;

  const provider = await env.DB.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM feedback_items WHERE provider_id = p.id) as feedback_count,
      (SELECT COUNT(*) FROM feedback_items WHERE provider_id = p.id AND processed = 1) as processed_count
    FROM providers p
    WHERE p.id = ?
  `).bind(id).first();

  if (!provider) {
    return json({ error: 'Provider not found' }, 404);
  }

  // Get recent feedback from this provider
  const recentFeedback = await env.DB.prepare(`
    SELECT * FROM feedback_items
    WHERE provider_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).bind(id).all();

  return json({
    ...provider,
    recentFeedback: recentFeedback.results || [],
  });
}

export async function testProvider(
  _request: Request,
  _env: Env,
  params: Record<string, string>
): Promise<Response> {
  const { id } = params;

  const provider = providerRegistry.get(id);
  if (!provider) {
    return json({ error: 'Provider not found in registry' }, 404);
  }

  try {
    const healthy = await provider.testConnection();
    return json({ healthy });
  } catch (error) {
    return json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Test failed',
    });
  }
}

export async function syncProvider(
  _request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const { id } = params;

  const provider = providerRegistry.get(id);
  if (!provider) {
    return json({ error: 'Provider not found in registry' }, 404);
  }

  try {
    const feedback = await provider.fetchFeedback();

    // Update last sync time
    await env.DB.prepare(`
      UPDATE providers SET last_sync_at = datetime('now'), status = 'active'
      WHERE id = ?
    `).bind(id).run();

    return json({
      success: true,
      feedbackCount: feedback.length,
    });
  } catch (error) {
    await env.DB.prepare(`
      UPDATE providers SET status = 'error'
      WHERE id = ?
    `).bind(id).run();

    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    }, 500);
  }
}

export async function getUsers(
  _request: Request,
  env: Env
): Promise<Response> {
  const users = await env.DB.prepare('SELECT * FROM users ORDER BY name').all();
  return json(users.results || []);
}
