import { CustomerReview } from '../models/customerReview.model.js'

export async function fetchPendingReviews(batchSize = 20) {
  return CustomerReview.find({ status: 'pending' })
    .sort({ created_at: 1 })
    .limit(batchSize)
    .lean()
}

export async function markProcessing(reviewId) {
  return CustomerReview.findByIdAndUpdate(reviewId, {
    $set: { status: 'processing' },
  })
}

export async function markAnalyzed(reviewId, aiAnalysis) {
  return CustomerReview.findByIdAndUpdate(reviewId, {
    $set: { status: 'analyzed', ai_analysis: aiAnalysis },
  })
}

export async function markTicketCreated(reviewId, ticketId, aiAnalysis) {
  return CustomerReview.findByIdAndUpdate(reviewId, {
    $set: { status: 'ticket_created', related_ticket_id: ticketId, ai_analysis: aiAnalysis },
  })
}

export async function markFailed(reviewId, errorMessage) {
  return CustomerReview.findByIdAndUpdate(reviewId, {
    $set: { status: 'failed', error_message: errorMessage },
  })
}

export async function listReviews({ status, page = 1, limit = 20 } = {}) {
  const match = status ? { status } : {}
  const skip  = (page - 1) * limit

  const [data, total] = await Promise.all([
    CustomerReview.find(match).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    CustomerReview.countDocuments(match),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getReviewStats() {
  const rows = await CustomerReview.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])
  return rows.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {})
}
