import { TICKET_PRIORITY } from '../../constants/priorities.js'

// Only skip reviews that are genuinely positive/harmless
function shouldSkipTicket(review, aiResult) {
  // Pure praise — never a ticket
  if (review.review_type === 'PRAISE') return true
  // Clearly positive and well-rated — not actionable
  if (aiResult.sentiment === 'positive' && review.rating >= 4 && !aiResult.duplicate_possible) return true
  // AI has no idea what this review is about
  if (aiResult.confidence_score < 0.3) return true
  return false
}

// Create a ticket for everything that isn't explicitly skipped
export function shouldCreateTicket(review, aiResult) {
  if (shouldSkipTicket(review, aiResult)) return false

  return (
    review.rating <= 3 ||
    review.review_type === 'BUG' ||
    review.review_type === 'PERFORMANCE' ||
    aiResult.sentiment === 'negative' ||
    aiResult.sentiment === 'neutral' ||
    aiResult.priority === TICKET_PRIORITY.HIGH ||
    aiResult.priority === TICKET_PRIORITY.URGENT
  )
}
