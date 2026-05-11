import { TICKET_PRIORITY } from '../constants/priorities.js'

const SLA_HOURS = {
  [TICKET_PRIORITY.URGENT]: 4,
  [TICKET_PRIORITY.HIGH]:   12,
  [TICKET_PRIORITY.MEDIUM]: 24,
  [TICKET_PRIORITY.LOW]:    48,
}

export function calculateSLAStatus(createdAt, priority) {
  const created = new Date(createdAt)
  const now = new Date()
  const diffHours = (now - created) / (1000 * 60 * 60)
  
  const limit = SLA_HOURS[priority] || 24
  const remaining = limit - diffHours
  
  return {
    isOverdue: diffHours > limit,
    hoursRemaining: Math.max(0, Math.round(remaining * 10) / 10),
    slaLimit: limit
  }
}

// Middleware to inject SLA info into response (if used in routes)
export function injectSLAInfo(req, res, next) {
  // This would be used after the controller or in a way that affects res.json
  // For now, it's a placeholder for logic
  next()
}
