import { generateContent, parseJsonResponse } from '../integrations/gemini.client.js'
import { TICKET_PRIORITY } from '../../constants/priorities.js'
import { DEPARTMENT_TAG } from '../../constants/departments.js'
import { ISSUE_TAG } from '../../constants/issueTags.js'

const VALID_PRIORITIES  = Object.values(TICKET_PRIORITY)
const VALID_DEPARTMENTS = Object.values(DEPARTMENT_TAG)
const VALID_TAGS        = Object.values(ISSUE_TAG)

function buildReviewPrompt(review) {
  return `
You are a support ticket classification AI for ChargeNexus, an EV charging platform.

Analyze this customer review and return ONLY a JSON object.

Review:
- Title: "${review.review_title}"
- Message: "${review.review_message}"
- Rating: ${review.rating}/5
- Source: ${review.source}
- Device: ${review.device_info?.os || 'unknown'} ${review.device_info?.os_version || ''}
- App Version: ${review.app_version || 'unknown'}

Return exactly this shape:
{
  "sentiment": "positive" | "negative" | "neutral",
  "issue_type": "<one of: ${VALID_TAGS.join(', ')}>",
  "department": "<one of: ${VALID_DEPARTMENTS.join(', ')}>",
  "priority": "<one of: ${VALID_PRIORITIES.join(', ')}>",
  "confidence_score": <float 0.0–1.0>,
  "enhancement_detected": <true if feature request>,
  "duplicate_possible": <true if likely reported before>,
  "summary": "<one sentence AI-generated ticket title, max 80 chars>"
}

Rules:
- priority URGENT: payment loss or safety issue
- priority HIGH: charger down, app crash, session failure
- priority MEDIUM: performance, UX issues
- priority LOW: enhancements, praise
- confidence < 0.5 if review is vague or unrelated to EV charging
- Return ONLY raw JSON, no code fences
`.trim()
}

function sanitize(parsed) {
  return {
    sentiment:           ['positive', 'negative', 'neutral'].includes(parsed.sentiment)
                           ? parsed.sentiment : 'neutral',
    issue_type:          VALID_TAGS.includes(parsed.issue_type) ? parsed.issue_type : VALID_TAGS[0],
    department:          VALID_DEPARTMENTS.includes(parsed.department) ? parsed.department : VALID_DEPARTMENTS[0],
    priority:            VALID_PRIORITIES.includes(parsed.priority) ? parsed.priority : TICKET_PRIORITY.MEDIUM,
    confidence_score:    typeof parsed.confidence_score === 'number'
                           ? Math.min(1, Math.max(0, parsed.confidence_score)) : 0.5,
    enhancement_detected:Boolean(parsed.enhancement_detected),
    duplicate_possible:  Boolean(parsed.duplicate_possible),
    summary:             String(parsed.summary || 'Customer Issue').slice(0, 80),
  }
}

export async function analyzeReview(review) {
  const prompt = buildReviewPrompt(review)
  const raw    = await generateContent(prompt)
  const parsed = parseJsonResponse(raw)
  return sanitize(parsed)
}
