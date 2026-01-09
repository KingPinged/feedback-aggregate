import type { Ai } from '@cloudflare/workers-types';
import type { FeedbackCategory, Sentiment, ProcessedFeedback } from '../types/feedback';

export class AIProcessor {
  private ai: Ai;

  constructor(ai: Ai) {
    this.ai = ai;
  }

  async processFeedback(content: string, title?: string): Promise<ProcessedFeedback> {
    const fullText = title ? `${title}\n\n${content}` : content;

    // Run AI tasks - for efficiency, we'll do a single comprehensive analysis
    const analysis = await this.analyzeComprehensive(fullText);

    return analysis;
  }

  private async analyzeComprehensive(text: string): Promise<ProcessedFeedback> {
    try {
      const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct' as Parameters<typeof this.ai.run>[0], {
        messages: [
          {
            role: 'system',
            content: `You are a feedback analyzer. Analyze the user feedback and return a JSON object with these exact fields:
- summary: 1-2 sentence summary of the feedback
- category: one of "bug", "feature_request", "complaint", "question", "praise", "other"
- sentiment: one of "positive", "negative", "neutral", "mixed"
- sentimentScore: number from -1 (very negative) to 1 (very positive)
- keywords: array of 3-5 relevant keywords
- urgency: one of "low", "medium", "high", "critical"

Return ONLY valid JSON, no explanation or markdown.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: 300,
      });

      const responseText = (response as { response?: string }).response || '{}';

      // Try to parse JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || text.substring(0, 200),
          category: this.validateCategory(parsed.category),
          sentiment: this.validateSentiment(parsed.sentiment),
          sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 0,
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          urgency: this.validateUrgency(parsed.urgency),
        };
      }
    } catch (error) {
      console.error('AI processing error:', error);
    }

    // Fallback to basic analysis
    return this.basicAnalysis(text);
  }

  private basicAnalysis(text: string): ProcessedFeedback {
    const lowerText = text.toLowerCase();

    // Basic category detection
    let category: FeedbackCategory = 'other';
    if (lowerText.includes('bug') || lowerText.includes('crash') || lowerText.includes('error') || lowerText.includes('broken')) {
      category = 'bug';
    } else if (lowerText.includes('feature') || lowerText.includes('would love') || lowerText.includes('please add')) {
      category = 'feature_request';
    } else if (lowerText.includes('terrible') || lowerText.includes('awful') || lowerText.includes('disappointed')) {
      category = 'complaint';
    } else if (lowerText.includes('how') || lowerText.includes('?')) {
      category = 'question';
    } else if (lowerText.includes('great') || lowerText.includes('love') || lowerText.includes('awesome')) {
      category = 'praise';
    }

    // Basic sentiment detection
    let sentiment: Sentiment = 'neutral';
    let sentimentScore = 0;
    const negativeWords = ['crash', 'broken', 'terrible', 'awful', 'frustrated', 'angry', 'worst', 'hate', 'blocking'];
    const positiveWords = ['great', 'awesome', 'love', 'fantastic', 'excellent', 'best', 'amazing', 'helpful'];

    const negCount = negativeWords.filter(w => lowerText.includes(w)).length;
    const posCount = positiveWords.filter(w => lowerText.includes(w)).length;

    if (negCount > posCount) {
      sentiment = 'negative';
      sentimentScore = -0.5 - (negCount * 0.1);
    } else if (posCount > negCount) {
      sentiment = 'positive';
      sentimentScore = 0.5 + (posCount * 0.1);
    }

    // Basic urgency detection
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (lowerText.includes('urgent') || lowerText.includes('critical') || lowerText.includes('asap') || lowerText.includes('blocker')) {
      urgency = 'critical';
    } else if (lowerText.includes('important') || lowerText.includes('need')) {
      urgency = 'high';
    }

    // Extract keywords (simple approach)
    const words = text.split(/\s+/).filter(w => w.length > 4);
    const keywords = [...new Set(words)].slice(0, 5);

    return {
      summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      category,
      sentiment,
      sentimentScore: Math.max(-1, Math.min(1, sentimentScore)),
      keywords,
      urgency,
    };
  }

  private validateCategory(cat: string): FeedbackCategory {
    const valid: FeedbackCategory[] = ['bug', 'feature_request', 'complaint', 'question', 'praise', 'other'];
    return valid.includes(cat as FeedbackCategory) ? (cat as FeedbackCategory) : 'other';
  }

  private validateSentiment(sent: string): Sentiment {
    const valid: Sentiment[] = ['positive', 'negative', 'neutral', 'mixed'];
    return valid.includes(sent as Sentiment) ? (sent as Sentiment) : 'neutral';
  }

  private validateUrgency(urg: string): 'low' | 'medium' | 'high' | 'critical' {
    const valid = ['low', 'medium', 'high', 'critical'];
    return valid.includes(urg) ? (urg as 'low' | 'medium' | 'high' | 'critical') : 'medium';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.ai.run('@cf/baai/bge-base-en-v1.5', {
        text: [text],
      });
      return (result as { data: number[][] }).data[0];
    } catch (error) {
      console.error('Embedding generation error:', error);
      // Return empty array on failure
      return [];
    }
  }
}
