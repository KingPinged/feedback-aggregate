import type { Env } from '../types/env';
import { json } from '../utils/router';
import { PipelineOrchestrator } from '../pipeline';

export async function getFeedback(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const providerId = url.searchParams.get('providerId');
  const processed = url.searchParams.get('processed');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let query = 'SELECT * FROM feedback_items WHERE 1=1';
  const params: (string | number)[] = [];

  if (providerId) {
    query += ' AND provider_id = ?';
    params.push(providerId);
  }
  if (processed !== null) {
    query += ' AND processed = ?';
    params.push(processed === 'true' ? 1 : 0);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const feedback = await env.DB.prepare(query).bind(...params).all();

  return json({
    feedback: feedback.results || [],
    limit,
    offset,
  });
}

export async function triggerIngestion(
  _request: Request,
  env: Env
): Promise<Response> {
  const orchestrator = new PipelineOrchestrator(env.DB, env.AI, env.VECTOR_INDEX);

  try {
    const result = await orchestrator.runFullPipeline();
    return json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Pipeline error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Pipeline failed',
    }, 500);
  }
}

export async function ingestFromProvider(
  _request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const { providerId } = params;
  const orchestrator = new PipelineOrchestrator(env.DB, env.AI, env.VECTOR_INDEX);

  try {
    const count = await orchestrator.ingestFromProvider(providerId);
    return json({
      success: true,
      ingested: count,
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Ingestion failed',
    }, 500);
  }
}
