import cron from 'node-cron'
import { fetchPendingReviews, markProcessing } from '../repositories/feedback.repository.js'
import { processReview } from '../services/ai/aiTicketGenerator.service.js'
import { Account } from '../../auth/auth.model.js'

let _systemUserId = null

async function getSystemUserId() {
  if (_systemUserId) return _systemUserId
  const admin = await Account.findOne({ role: 'admin' }).select('_id').lean()
  _systemUserId = admin?._id ?? null
  return _systemUserId
}

export async function runReviewBatch() {
  const userId = await getSystemUserId()
  if (!userId) {
    console.error('[ReviewJob] No admin account found — skipping batch')
    return { processed: 0, error: 'No admin account' }
  }

  const reviews = await fetchPendingReviews(20)
  if (!reviews.length) return { processed: 0 }

  console.log(`[ReviewJob] Processing ${reviews.length} pending reviews`)

  let ticketsCreated = 0
  let failed = 0

  for (const review of reviews) {
    await markProcessing(review._id)
    const result = await processReview(review, userId)
    if (result.ticketCreated) ticketsCreated++
    if (!result.success)      failed++
  }

  console.log(`[ReviewJob] Done — tickets: ${ticketsCreated}, failed: ${failed}`)
  return { processed: reviews.length, ticketsCreated, failed }
}

export function startReviewAnalysisJob() {
  cron.schedule('*/5 * * * *', async () => {
    try { await runReviewBatch() }
    catch (err) { console.error('[ReviewJob] Unhandled error:', err.message) }
  })
  console.log('[ReviewJob] Started (every 5 min)')
}
