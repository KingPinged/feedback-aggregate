import type { D1Database } from '@cloudflare/workers-types';
import type { RawFeedback } from '../types/provider';
import type { FeedbackItem } from '../types/feedback';

export class IngestionService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async ingestFeedback(providerId: string, rawFeedback: RawFeedback[]): Promise<FeedbackItem[]> {
    const items: FeedbackItem[] = [];

    for (const raw of rawFeedback) {
      // Check for duplicates
      const existing = await this.findByExternalId(providerId, raw.externalId);
      if (existing) continue;

      const item = await this.createFeedbackItem(providerId, raw);
      items.push(item);
    }

    // Update provider sync timestamp
    await this.updateProviderSync(providerId);

    return items;
  }

  private async createFeedbackItem(providerId: string, raw: RawFeedback): Promise<FeedbackItem> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(`
      INSERT INTO feedback_items (
        id, provider_id, external_id, source_url,
        author_id, author_name, author_email, author_avatar,
        title, content, content_type, metadata, source_created_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      providerId,
      raw.externalId,
      raw.sourceUrl || null,
      raw.author.id || null,
      raw.author.name || null,
      raw.author.email || null,
      raw.author.avatar || null,
      raw.title || null,
      raw.content,
      raw.contentType || 'text',
      JSON.stringify(raw.metadata || {}),
      raw.sourceCreatedAt,
      now,
      now
    ).run();

    return {
      id,
      providerId,
      externalId: raw.externalId,
      sourceUrl: raw.sourceUrl || null,
      authorId: raw.author.id || null,
      authorName: raw.author.name || null,
      authorEmail: raw.author.email || null,
      authorAvatar: raw.author.avatar || null,
      title: raw.title || null,
      content: raw.content,
      contentType: (raw.contentType || 'text') as 'text' | 'markdown' | 'html',
      processed: false,
      summary: null,
      category: null,
      sentiment: null,
      sentimentScore: null,
      keywords: null,
      metadata: raw.metadata || null,
      sourceCreatedAt: raw.sourceCreatedAt,
      processedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  private async findByExternalId(providerId: string, externalId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT id FROM feedback_items
      WHERE provider_id = ? AND external_id = ?
    `).bind(providerId, externalId).first();
    return !!result;
  }

  private async updateProviderSync(providerId: string): Promise<void> {
    await this.db.prepare(`
      UPDATE providers SET last_sync_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(providerId).run();
  }

  async getUnprocessedFeedback(limit = 50): Promise<FeedbackItem[]> {
    const results = await this.db.prepare(`
      SELECT * FROM feedback_items
      WHERE processed = 0
      ORDER BY created_at ASC
      LIMIT ?
    `).bind(limit).all();

    return (results.results || []).map(this.mapFeedbackRow);
  }

  async markAsProcessed(
    feedbackId: string,
    processed: {
      summary: string;
      category: string;
      sentiment: string;
      sentimentScore: number;
      keywords: string[];
    }
  ): Promise<void> {
    await this.db.prepare(`
      UPDATE feedback_items SET
        processed = 1,
        summary = ?,
        category = ?,
        sentiment = ?,
        sentiment_score = ?,
        keywords = ?,
        processed_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      processed.summary,
      processed.category,
      processed.sentiment,
      processed.sentimentScore,
      JSON.stringify(processed.keywords),
      feedbackId
    ).run();
  }

  private mapFeedbackRow(row: Record<string, unknown>): FeedbackItem {
    return {
      id: row.id as string,
      providerId: row.provider_id as string,
      externalId: row.external_id as string | null,
      sourceUrl: row.source_url as string | null,
      authorId: row.author_id as string | null,
      authorName: row.author_name as string | null,
      authorEmail: row.author_email as string | null,
      authorAvatar: row.author_avatar as string | null,
      title: row.title as string | null,
      content: row.content as string,
      contentType: (row.content_type || 'text') as 'text' | 'markdown' | 'html',
      processed: !!row.processed,
      summary: row.summary as string | null,
      category: row.category as FeedbackItem['category'],
      sentiment: row.sentiment as FeedbackItem['sentiment'],
      sentimentScore: row.sentiment_score as number | null,
      keywords: row.keywords ? JSON.parse(row.keywords as string) : null,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : null,
      sourceCreatedAt: row.source_created_at as string | null,
      processedAt: row.processed_at as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
