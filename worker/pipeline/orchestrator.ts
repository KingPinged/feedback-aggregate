import type { D1Database, Ai, VectorizeIndex } from '@cloudflare/workers-types';
import { providerRegistry } from '../providers';
import { IngestionService } from './ingestion';
import { AIProcessor } from './processor';
import { calculateSeverity, getPriorityFromSeverity, recalculateSeverityWithTime } from './severity';

const SIMILARITY_THRESHOLD = 0.75; // Threshold for grouping feedback into same issue

export class PipelineOrchestrator {
  private db: D1Database;
  private ingestion: IngestionService;
  private aiProcessor: AIProcessor;
  private vectorIndex: VectorizeIndex | null;

  constructor(
    db: D1Database,
    ai: Ai,
    vectorIndex: VectorizeIndex | null
  ) {
    this.db = db;
    this.ingestion = new IngestionService(db);
    this.aiProcessor = new AIProcessor(ai);
    this.vectorIndex = vectorIndex;
  }

  async runFullPipeline(): Promise<{
    ingested: number;
    processed: number;
    issuesCreated: number;
  }> {
    // Step 1: Ingest from all providers
    const allFeedback = await providerRegistry.fetchAllFeedback();
    let ingestedCount = 0;

    for (const { providerId, feedback } of allFeedback) {
      const items = await this.ingestion.ingestFeedback(providerId, feedback);
      ingestedCount += items.length;
    }

    // Step 2: Process unprocessed feedback with AI
    const unprocessed = await this.ingestion.getUnprocessedFeedback(100);
    let processedCount = 0;
    let newIssuesCreated = 0;

    for (const item of unprocessed) {
      try {
        const analysis = await this.aiProcessor.processFeedback(item.content, item.title || undefined);

        await this.ingestion.markAsProcessed(item.id, {
          summary: analysis.summary,
          category: analysis.category,
          sentiment: analysis.sentiment,
          sentimentScore: analysis.sentimentScore,
          keywords: analysis.keywords,
        });

        // Create or update issue (with semantic grouping)
        const result = await this.createOrUpdateIssue(item.id, item.content, analysis);
        if (result.isNew) {
          newIssuesCreated++;
        }

        processedCount++;
      } catch (error) {
        console.error(`Failed to process feedback ${item.id}:`, error);
      }
    }

    // Step 3: Recalculate severity for all open issues
    await this.recalculateAllSeverities();

    return {
      ingested: ingestedCount,
      processed: processedCount,
      issuesCreated: newIssuesCreated,
    };
  }

  private async createOrUpdateIssue(
    feedbackId: string,
    _feedbackContent: string,
    analysis: Awaited<ReturnType<AIProcessor['processFeedback']>>
  ): Promise<{ issueId: string; isNew: boolean }> {
    const now = new Date();
    const nowStr = now.toISOString();

    // Generate embedding for the feedback content
    const embedding = await this.aiProcessor.generateEmbedding(
      `${analysis.summary} ${analysis.keywords.join(' ')}`
    );

    // Search for similar existing issues using Vectorize
    let similarIssue: { id: string; score: number } | null = null;

    if (this.vectorIndex && embedding.length > 0) {
      try {
        const searchResults = await this.vectorIndex.query(embedding, {
          topK: 1,
          returnMetadata: 'all',
        });

        if (searchResults.matches && searchResults.matches.length > 0) {
          const topMatch = searchResults.matches[0];
          if (topMatch.score >= SIMILARITY_THRESHOLD) {
            similarIssue = {
              id: topMatch.id,
              score: topMatch.score,
            };
          }
        }
      } catch (error) {
        console.error('Vectorize search error:', error);
      }
    }

    if (similarIssue) {
      // Link feedback to existing issue
      await this.linkFeedbackToIssue(similarIssue.id, feedbackId, similarIssue.score, analysis);
      return { issueId: similarIssue.id, isNew: false };
    }

    // No similar issue found - create new one
    const issueId = await this.createNewIssue(feedbackId, analysis, embedding, nowStr);
    return { issueId, isNew: true };
  }

  private async linkFeedbackToIssue(
    issueId: string,
    feedbackId: string,
    similarityScore: number,
    analysis: Awaited<ReturnType<AIProcessor['processFeedback']>>
  ): Promise<void> {
    const nowStr = new Date().toISOString();

    // Link feedback to issue
    await this.db.prepare(`
      INSERT INTO issue_feedback (issue_id, feedback_id, similarity_score, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(issueId, feedbackId, similarityScore, nowStr).run();

    // Get current issue data
    const issue = await this.db.prepare(`
      SELECT feedback_count, first_reported_at, base_severity FROM issues WHERE id = ?
    `).bind(issueId).first<{ feedback_count: number; first_reported_at: string; base_severity: number }>();

    if (!issue) return;

    const newFeedbackCount = issue.feedback_count + 1;

    // Recalculate severity with increased feedback count
    const severity = calculateSeverity({
      sentimentScore: analysis.sentimentScore,
      urgencyLevel: analysis.urgency,
      feedbackCount: newFeedbackCount,
      affectedUsers: newFeedbackCount, // Approximate
      category: analysis.category,
      firstReportedAt: new Date(issue.first_reported_at),
      lastFeedbackAt: new Date(),
    });

    // Update issue with new stats
    await this.db.prepare(`
      UPDATE issues SET
        feedback_count = ?,
        base_severity = ?,
        current_severity = ?,
        priority = ?,
        last_feedback_at = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      newFeedbackCount,
      Math.max(issue.base_severity, severity.baseSeverity), // Keep highest severity
      severity.currentSeverity,
      severity.priority,
      nowStr,
      nowStr,
      issueId
    ).run();
  }

  private async createNewIssue(
    feedbackId: string,
    analysis: Awaited<ReturnType<AIProcessor['processFeedback']>>,
    embedding: number[],
    nowStr: string
  ): Promise<string> {
    const issueId = crypto.randomUUID();

    // Calculate severity
    const severity = calculateSeverity({
      sentimentScore: analysis.sentimentScore,
      urgencyLevel: analysis.urgency,
      feedbackCount: 1,
      affectedUsers: 1,
      category: analysis.category,
      firstReportedAt: new Date(),
      lastFeedbackAt: new Date(),
    });

    // Create issue in database
    await this.db.prepare(`
      INSERT INTO issues (
        id, title, description, summary, category,
        base_severity, current_severity, priority,
        sentiment, sentiment_score, feedback_count,
        status, first_reported_at, last_feedback_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      issueId,
      analysis.summary.substring(0, 100),
      analysis.summary,
      analysis.summary,
      analysis.category,
      severity.baseSeverity,
      severity.currentSeverity,
      severity.priority,
      analysis.sentiment,
      analysis.sentimentScore,
      1,
      'new',
      nowStr,
      nowStr,
      nowStr,
      nowStr
    ).run();

    // Link feedback to issue
    await this.db.prepare(`
      INSERT INTO issue_feedback (issue_id, feedback_id, similarity_score, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(issueId, feedbackId, 1.0, nowStr).run();

    // Index the issue embedding in Vectorize
    if (this.vectorIndex && embedding.length > 0) {
      try {
        await this.vectorIndex.upsert([
          {
            id: issueId,
            values: embedding,
            metadata: {
              title: analysis.summary.substring(0, 100),
              category: analysis.category,
              keywords: analysis.keywords.join(','),
            },
          },
        ]);
      } catch (error) {
        console.error('Vectorize upsert error:', error);
      }
    }

    return issueId;
  }

  private async recalculateAllSeverities(): Promise<void> {
    const issues = await this.db.prepare(`
      SELECT id, base_severity, first_reported_at FROM issues
      WHERE status NOT IN ('resolved', 'closed', 'wont_fix')
    `).all();

    for (const issue of issues.results || []) {
      const newSeverity = recalculateSeverityWithTime(
        issue.base_severity as number,
        new Date(issue.first_reported_at as string)
      );
      const newPriority = getPriorityFromSeverity(newSeverity);

      await this.db.prepare(`
        UPDATE issues SET
          current_severity = ?,
          priority = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(newSeverity, newPriority, issue.id).run();
    }
  }

  async ingestFromProvider(providerId: string): Promise<number> {
    const provider = providerRegistry.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    const feedback = await provider.fetchFeedback();
    const items = await this.ingestion.ingestFeedback(providerId, feedback);
    return items.length;
  }
}
