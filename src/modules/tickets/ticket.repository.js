import mongoose from 'mongoose'
import { Ticket, TicketActivity, TicketAttachment, FeedbackAnalysis } from './ticket.model.js'

// ─── Ticket CRUD ──────────────────────────────────────────────────────────────

export async function createTicket(data) {
  const ticket = new Ticket(data)
  return ticket.save()
}

export async function findTicketById(id) {
  const isObjectId = mongoose.Types.ObjectId.isValid(id)
  const query = isObjectId
    ? { _id: new mongoose.Types.ObjectId(id) }
    : { ticket_id: id }

  const [ticket] = await Ticket.aggregate([
    { $match: query },
    {
      $lookup: {
        from:         'Accounts',
        localField:   'created_by',
        foreignField: '_id',
        as:           'created_by',
        pipeline:     [{ $project: { name: 1, email: 1, role: 1 } }],
      },
    },
    { $unwind: { path: '$created_by', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from:         'Accounts',
        localField:   'assigned_to',
        foreignField: '_id',
        as:           'assigned_to',
        pipeline:     [{ $project: { name: 1, email: 1, role: 1 } }],
      },
    },
    { $unwind: { path: '$assigned_to', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from:         'ticket_attachments',
        localField:   '_id',
        foreignField: 'ticket_id',
        as:           'attachments',
      },
    },
    {
      $lookup: {
        from:         'ticket_activities',
        localField:   '_id',
        foreignField: 'ticket_id',
        as:           'activities',
        pipeline: [
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from:         'Accounts',
              localField:   'performed_by',
              foreignField: '_id',
              as:           'performed_by',
              pipeline:     [{ $project: { name: 1, email: 1 } }],
            },
          },
          { $unwind: { path: '$performed_by', preserveNullAndEmptyArrays: true } },
        ],
      },
    },
  ])

  return ticket || null
}

export async function listTickets({ filters = {}, page = 1, limit = 20, sort = { createdAt: -1 } }) {
  const match = buildMatchStage(filters)
  const skip  = (page - 1) * limit

  const [result] = await Ticket.aggregate([
    { $match: match },
    {
      $facet: {
        data: [
          { $sort: sort },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from:         'Accounts',
              localField:   'created_by',
              foreignField: '_id',
              as:           'created_by',
              pipeline:     [{ $project: { name: 1, email: 1 } }],
            },
          },
          { $unwind: { path: '$created_by', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from:         'Accounts',
              localField:   'assigned_to',
              foreignField: '_id',
              as:           'assigned_to',
              pipeline:     [{ $project: { name: 1, email: 1 } }],
            },
          },
          { $unwind: { path: '$assigned_to', preserveNullAndEmptyArrays: true } },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  return {
    data:       result.data,
    total:      result.total[0]?.count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((result.total[0]?.count ?? 0) / limit),
  }
}

export async function updateTicket(id, update) {
  return Ticket.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const now         = new Date()
  const last24h     = new Date(now - 24 * 60 * 60 * 1000)
  const last7d      = new Date(now - 7  * 24 * 60 * 60 * 1000)

  const [stats] = await Ticket.aggregate([
    {
      $facet: {
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ],
        byPriority: [
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ],
        byDepartment: [
          { $group: { _id: '$department_tag', count: { $sum: 1 } } },
        ],
        openOlderThan24h: [
          { $match: { status: { $in: ['OPEN', 'IN_PROGRESS'] }, createdAt: { $lt: last24h } } },
          { $count: 'count' },
        ],
        createdLast7d: [
          { $match: { createdAt: { $gte: last7d } } },
          { $count: 'count' },
        ],
        resolvedLast7d: [
          { $match: { status: 'RESOLVED', resolved_at: { $gte: last7d } } },
          { $count: 'count' },
        ],
        escalated: [
          { $match: { is_escalated: true, status: { $nin: ['RESOLVED', 'CLOSED'] } } },
          { $count: 'count' },
        ],
        avgResolutionHours: [
          {
            $match: {
              status:      'RESOLVED',
              resolved_at: { $exists: true },
              createdAt:   { $gte: last7d },
            },
          },
          {
            $project: {
              diffHours: {
                $divide: [{ $subtract: ['$resolved_at', '$createdAt'] }, 3600000],
              },
            },
          },
          { $group: { _id: null, avg: { $avg: '$diffHours' } } },
        ],
      },
    },
  ])

  return stats
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export async function logActivity({ ticket_id, action, performed_by, metadata = {} }) {
  const activity = new TicketActivity({ ticket_id, action, performed_by, metadata })
  return activity.save()
}

// ─── Attachment ───────────────────────────────────────────────────────────────

export async function createAttachments(attachments) {
  if (!attachments?.length) return []
  return TicketAttachment.insertMany(attachments)
}

// ─── Feedback Analysis ────────────────────────────────────────────────────────

export async function saveFeedbackAnalysis(data) {
  const doc = new FeedbackAnalysis(data)
  return doc.save()
}

export async function linkAnalysisToTicket(analysisId, ticketId) {
  return FeedbackAnalysis.findByIdAndUpdate(
    analysisId,
    { $set: { ticket_id: ticketId, auto_ticket_created: true } },
    { new: true }
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMatchStage(filters) {
  const match = {}

  if (filters.status)         match.status         = { $in: [].concat(filters.status) }
  if (filters.priority)       match.priority        = { $in: [].concat(filters.priority) }
  if (filters.department_tag) match.department_tag  = { $in: [].concat(filters.department_tag) }
  if (filters.issue_tags)     match.issue_tags      = { $in: [].concat(filters.issue_tags) }
  if (filters.assigned_to)    match.assigned_to     = new mongoose.Types.ObjectId(filters.assigned_to)
  if (filters.is_escalated !== undefined) match.is_escalated = filters.is_escalated === 'true' || filters.is_escalated === true
  if (filters.search) {
    match.$or = [
      { ticket_id:   { $regex: filters.search, $options: 'i' } },
      { title:       { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { 'customer.name':  { $regex: filters.search, $options: 'i' } },
      { 'customer.email': { $regex: filters.search, $options: 'i' } },
    ]
  }
  if (filters.from || filters.to) {
    match.createdAt = {}
    if (filters.from) match.createdAt.$gte = new Date(filters.from)
    if (filters.to)   match.createdAt.$lte = new Date(filters.to)
  }

  return match
}
