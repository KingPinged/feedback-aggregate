export interface SeverityFactors {
  sentimentScore: number;
  urgencyLevel: string;
  feedbackCount: number;
  affectedUsers: number;
  category: string;
  firstReportedAt: Date;
  lastFeedbackAt: Date;
}

export interface SeverityResult {
  baseSeverity: number;
  currentSeverity: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const WEIGHTS = {
  sentiment: 0.15,
  urgency: 0.20,
  feedbackCount: 0.20,
  affectedUsers: 0.15,
  category: 0.15,
  recency: 0.15,
};

const TIME_WEIGHT_PER_DAY = 0.05;
const MAX_TIME_MULTIPLIER = 2.0;

export function calculateSeverity(factors: SeverityFactors): SeverityResult {
  const baseSeverity = calculateBaseSeverity(factors);
  const timeMultiplier = calculateTimeMultiplier(factors.firstReportedAt);
  const currentSeverity = Math.min(baseSeverity * timeMultiplier, 10);
  const priority = determinePriority(currentSeverity);

  return {
    baseSeverity: Math.round(baseSeverity * 100) / 100,
    currentSeverity: Math.round(currentSeverity * 100) / 100,
    priority,
  };
}

function calculateBaseSeverity(factors: SeverityFactors): number {
  let score = 0;

  // Sentiment contribution (negative = higher severity)
  const sentimentContribution = factors.sentimentScore < 0
    ? Math.abs(factors.sentimentScore)
    : 0;
  score += sentimentContribution * 10 * WEIGHTS.sentiment;

  // Urgency contribution
  const urgencyScores: Record<string, number> = {
    critical: 10,
    high: 7,
    medium: 4,
    low: 1,
  };
  score += (urgencyScores[factors.urgencyLevel] || 4) * WEIGHTS.urgency;

  // Feedback count contribution (logarithmic scale)
  const feedbackScore = Math.min(Math.log10(factors.feedbackCount + 1) * 5, 10);
  score += feedbackScore * WEIGHTS.feedbackCount;

  // Affected users contribution (logarithmic scale)
  const userScore = Math.min(Math.log10(factors.affectedUsers + 1) * 5, 10);
  score += userScore * WEIGHTS.affectedUsers;

  // Category contribution
  const categoryScores: Record<string, number> = {
    bug: 8,
    complaint: 7,
    feature_request: 4,
    question: 2,
    praise: 0,
    other: 3,
  };
  score += (categoryScores[factors.category] || 3) * WEIGHTS.category;

  // Recency contribution (more recent = slightly higher)
  const daysSinceLastFeedback = Math.max(0,
    (Date.now() - factors.lastFeedbackAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const recencyScore = Math.max(0, 10 - daysSinceLastFeedback);
  score += recencyScore * WEIGHTS.recency;

  return Math.min(score, 10);
}

function calculateTimeMultiplier(firstReportedAt: Date): number {
  const daysUnresolved = (Date.now() - firstReportedAt.getTime()) / (1000 * 60 * 60 * 24);
  const multiplier = 1 + (daysUnresolved * TIME_WEIGHT_PER_DAY);
  return Math.min(multiplier, MAX_TIME_MULTIPLIER);
}

function determinePriority(severity: number): 'critical' | 'high' | 'medium' | 'low' {
  if (severity >= 8) return 'critical';
  if (severity >= 6) return 'high';
  if (severity >= 3) return 'medium';
  return 'low';
}

export function recalculateSeverityWithTime(baseSeverity: number, firstReportedAt: Date): number {
  const timeMultiplier = calculateTimeMultiplier(firstReportedAt);
  return Math.min(baseSeverity * timeMultiplier, 10);
}

export function getPriorityFromSeverity(severity: number): 'critical' | 'high' | 'medium' | 'low' {
  return determinePriority(severity);
}
