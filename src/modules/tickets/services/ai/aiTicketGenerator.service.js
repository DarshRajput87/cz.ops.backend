import { analyzeReview }      from './geminiAnalysis.service.js'
import { shouldCreateTicket }  from './enhancementDetection.service.js'
import {
  markAnalyzed,
  markTicketCreated,
  markFailed,
} from '../../repositories/feedback.repository.js'
import { createTicket, logActivity } from '../../ticket.repository.js'
import { TICKET_PRIORITY } from '../../constants/priorities.js'

function buildDescription(review) {
  const lines = [
    `[${review.source}] ${review.review_title || ''}`,
    '',
    review.review_message,
  ]
  if (review.device_info?.os)
    lines.push(`\nDevice: ${review.device_info.os} ${review.device_info.os_version || ''} — ${review.device_info.device_model || ''}`)
  if (review.app_version)
    lines.push(`App version: ${review.app_version}`)
  if (review.session_context?.station_id)
    lines.push(`Station: ${review.session_context.station_id}`)
  return lines.join('\n').trim()
}

// Used when Gemini is unavailable — derives classification from review's own fields
function buildFallbackResult(review) {
  let priority = TICKET_PRIORITY.MEDIUM
  if (review.rating === 1)                      priority = TICKET_PRIORITY.URGENT
  else if (review.rating === 2)                 priority = TICKET_PRIORITY.HIGH
  else if (review.review_type === 'PERFORMANCE') priority = TICKET_PRIORITY.MEDIUM

  return {
    sentiment:            review.sentiment || 'neutral',
    issue_type:           'APP_ISSUE',
    department:           'Software',
    priority,
    confidence_score:     0.8,
    enhancement_detected: review.review_type === 'ENHANCEMENT',
    duplicate_possible:   false,
    summary:              (review.review_title || 'Customer Issue').slice(0, 80),
  }
}

export async function processReview(review, systemUserId) {
  let aiResult
  let usedFallback = false

  try {
    aiResult = await analyzeReview(review)
  } catch {
    // Gemini unavailable — fall back to review's own data so we never lose a review
    aiResult      = buildFallbackResult(review)
    usedFallback  = true
  }

  // All review-generated tickets go to Software regardless of AI classification
  aiResult = { ...aiResult, department: 'Software' }

  if (!shouldCreateTicket(review, aiResult)) {
    await markAnalyzed(review._id, aiResult)
    return { success: true, ticketCreated: false }
  }

  let ticket
  try {
    ticket = await createTicket({
      created_by:     systemUserId,
      title:          aiResult.summary,
      description:    buildDescription(review),
      department_tag: 'Software',
      issue_tags:     aiResult.issue_type ? [aiResult.issue_type] : [],
      priority:       aiResult.priority,
      source:         'AI_REVIEW',
      ai_generated:   true,
      customer:       review.customer_id
        ? { name: `Customer #${review.customer_id}` }
        : undefined,
      related_entities: review.session_context?.charger_id
        ? {
            charger_id:  String(review.session_context.charger_id),
            location_id: review.session_context.station_id,
          }
        : undefined,
    })
  } catch (err) {
    await markFailed(review._id, err.message)
    return { success: false, error: err.message }
  }

  // Activity log is best-effort — failure here must NOT roll back the ticket
  try {
    await logActivity({
      ticket_id:    ticket._id,
      action:       'CREATED',
      performed_by: systemUserId,
      metadata: {
        source:       'AI_REVIEW',
        review_id:    review._id,
        confidence:   aiResult.confidence_score,
        ai_generated: true,
        used_fallback: usedFallback,
      },
    })
  } catch { /* intentionally swallowed */ }

  await markTicketCreated(review._id, ticket._id, aiResult)
  return { success: true, ticketCreated: true, ticket }
}
