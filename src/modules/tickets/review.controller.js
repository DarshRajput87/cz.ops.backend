import { listReviews, getReviewStats } from './repositories/feedback.repository.js'
import { runReviewBatch }             from './jobs/reviewAnalysis.job.js'

export async function getReviews(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const result = await listReviews({ status, page: +page, limit: +limit })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function getStats(req, res) {
  try {
    const stats = await getReviewStats()
    res.json({ success: true, data: stats })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function processPending(req, res) {
  try {
    const result = await runReviewBatch()
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
