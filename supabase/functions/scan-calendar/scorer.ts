/**
 * Confidence scoring algorithm for travel detection
 */

import type { ConfidenceFactors } from './types.ts';

/**
 * Calculate confidence score based on factors
 * Returns score 0-100
 */
export function calculateConfidence(factors: ConfidenceFactors): number {
  let score = 0;

  // Factor 1: Explicit travel keywords (+40 points)
  if (factors.explicit_keywords) {
    score += 40;
  }

  // Factor 2: Implicit travel keywords (+20 points, only if not explicit)
  if (!factors.explicit_keywords && factors.implicit_keywords) {
    score += 20;
  }

  // Factor 3: Location mismatch (+30 points)
  if (factors.location_mismatch) {
    score += 30;
  }

  // Factor 4: Multi-day event (+20 points)
  if (factors.multi_day) {
    score += 20;
  }
  // Factor 5: Long duration but not multi-day (+10 points)
  else if (factors.long_duration) {
    score += 10;
  }

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Generate human-readable reasoning text based on factors
 */
export function generateReasoning(factors: ConfidenceFactors, score: number): string {
  const reasons: string[] = [];

  if (factors.explicit_keywords) {
    reasons.push('explicit travel keywords');
  }

  if (factors.implicit_keywords) {
    reasons.push('travel-indicating event type');
  }

  if (factors.location_mismatch) {
    reasons.push('event in different city');
  }

  if (factors.multi_day) {
    reasons.push('multi-day event');
  }

  if (factors.long_duration && !factors.multi_day) {
    reasons.push('long-duration event');
  }

  if (reasons.length === 0) {
    return 'insufficient travel indicators';
  }

  return reasons.join(', ');
}

