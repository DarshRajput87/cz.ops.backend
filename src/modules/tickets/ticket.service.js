import {
  createTicket,
  findTicketById,
  listTickets,
  updateTicket,
  getDashboardStats,
  logActivity,
  createAttachments,
  saveFeedbackAnalysis,
  linkAnalysisToTicket,
} from './ticket.repository.js'
import { TICKET_STATUS, TICKET_PRIORITY, DEPARTMENT_TAG, ISSUE_TAG } from './ticket.model.js'
import { analyzeWithGemini } from './ticket.ai.js'
import { emitToAll } from '../../core/socket.js'
import { Account } from '../auth/auth.model.js'

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createTicketService({ body, userId }) {
  const {
    customer,
    title,
    description,
    department_tag,
    issue_tags     = [],
    priority       = TICKET_PRIORITY.MEDIUM,
    related_entities,
    attachments    = [],
    source         = 'MANUAL',
    ai_analysis_id,
    assigned_to,
  } = body

  if (!title?.trim())       throw { status: 400, message: 'Title is required' }
  if (!description?.trim()) throw { status: 400, message: 'Description is required' }
  if (!department_tag)      throw { status: 400, message: 'Department tag is required' }
  if (!Object.values(DEPARTMENT_TAG).includes(department_tag))
    throw { status: 400, message: 'Invalid department tag' }

  const ticket = await createTicket({
    created_by: userId,
    customer,
    title,
    description,
    department_tag,
    issue_tags,
    priority,
    related_entities,
    source,
    ai_analysis_id,
    ...(assigned_to ? { assigned_to, status: TICKET_STATUS.IN_PROGRESS } : {}),
  })

  if (attachments.length) {
    await createAttachments(
      attachments.map((a) => ({ ...a, ticket_id: ticket._id, uploaded_by: userId }))
    )
  }

  await logActivity({
    ticket_id:    ticket._id,
    action:       'CREATED',
    performed_by: userId,
    metadata:     { priority, department_tag, source },
  })

  if (assigned_to) {
    await logActivity({
      ticket_id:    ticket._id,
      action:       'ASSIGNED',
      performed_by: userId,
      metadata:     { assigned_to, prev_assignee: null },
    })
  }

  // Emit real-time notification
  emitToAll('new_ticket', {
    id:       ticket._id,
    ticketId: ticket.ticket_id,
    title:    ticket.title,
    priority: ticket.priority,
    dept:     ticket.department_tag,
    message:  `New ticket ${ticket.ticket_id} created in ${ticket.department_tag}`,
  })

  return ticket
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listTicketsService({ query }) {
  const { page = 1, limit = 20, sort_by = 'createdAt', sort_dir = 'desc', ...filters } = query

  const sortField = ['createdAt', 'priority', 'status', 'updatedAt'].includes(sort_by)
    ? sort_by
    : 'createdAt'

  return listTickets({
    filters,
    page:  parseInt(page, 10),
    limit: Math.min(parseInt(limit, 10), 100),
    sort:  { [sortField]: sort_dir === 'asc' ? 1 : -1 },
  })
}

export async function listAgentsService() {
  return Account.find({
    role: { $in: ['admin', 'operator', 'agent', 'customer_team'] },
    isActive: true
  }).select('name email role')
}

// ─── Get by ID ────────────────────────────────────────────────────────────────

export async function getTicketService(id) {
  const ticket = await findTicketById(id)
  if (!ticket) throw { status: 404, message: 'Ticket not found' }
  return ticket
}

// ─── Status Update ────────────────────────────────────────────────────────────

export async function updateStatusService({ id, status, userId, note }) {
  if (!Object.values(TICKET_STATUS).includes(status))
    throw { status: 400, message: 'Invalid status value' }

  const ticket = await findTicketById(id)
  if (!ticket) throw { status: 404, message: 'Ticket not found' }

  const prevStatus = ticket.status

  const update = { status }
  if (status === TICKET_STATUS.CLOSED)   update.closed_at   = new Date()

  const updated = await updateTicket(ticket._id, update)

  await logActivity({
    ticket_id:    ticket._id,
    action:       'STATUS_CHANGED',
    performed_by: userId,
    metadata:     { from: prevStatus, to: status, note },
  })

  return updated
}

// ─── Assign ───────────────────────────────────────────────────────────────────

export async function assignTicketService({ id, assigned_to, userId }) {
  if (!assigned_to) throw { status: 400, message: 'assigned_to is required' }

  const ticket = await findTicketById(id)
  if (!ticket) throw { status: 404, message: 'Ticket not found' }

  const update = {
    assigned_to,
    status: ticket.status === TICKET_STATUS.OPEN ? TICKET_STATUS.IN_PROGRESS : ticket.status,
  }

  const updated = await updateTicket(ticket._id, update)

  await logActivity({
    ticket_id:    ticket._id,
    action:       'ASSIGNED',
    performed_by: userId,
    metadata:     { assigned_to, prev_assignee: ticket.assigned_to?._id ?? null },
  })

  return updated
}

// ─── Resolve ──────────────────────────────────────────────────────────────────

export async function resolveTicketService({ id, resolution_note, userId }) {
  if (!resolution_note?.trim())
    throw { status: 400, message: 'Resolution note is required' }

  const ticket = await findTicketById(id)
  if (!ticket) throw { status: 404, message: 'Ticket not found' }

  if ([TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED].includes(ticket.status))
    throw { status: 409, message: 'Ticket is already resolved or closed' }

  const updated = await updateTicket(ticket._id, {
    status:          TICKET_STATUS.RESOLVED,
    resolution_note,
    resolved_at:     new Date(),
  })

  await logActivity({
    ticket_id:    ticket._id,
    action:       'RESOLVED',
    performed_by: userId,
    metadata:     { resolution_note },
  })

  return updated
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function dashboardStatsService() {
  const raw = await getDashboardStats()

  const toMap = (arr) =>
    arr.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {})

  return {
    byStatus:        toMap(raw.byStatus),
    byPriority:      toMap(raw.byPriority),
    byDepartment:    toMap(raw.byDepartment),
    openOlderThan24h:raw.openOlderThan24h[0]?.count   ?? 0,
    createdLast7d:   raw.createdLast7d[0]?.count       ?? 0,
    resolvedLast7d:  raw.resolvedLast7d[0]?.count      ?? 0,
    escalated:       raw.escalated[0]?.count           ?? 0,
    avgResolutionHours: raw.avgResolutionHours[0]?.avg
      ? Math.round(raw.avgResolutionHours[0].avg * 10) / 10
      : null,
  }
}

// ─── AI Feedback Analysis ─────────────────────────────────────────────────────

export async function analyzeFeedbackService({ raw_feedback, userId, autoCreate = false }) {
  if (!raw_feedback?.trim()) throw { status: 400, message: 'Feedback text is required' }

  const aiResult = await analyzeWithGemini(raw_feedback)

  const analysis = await saveFeedbackAnalysis({
    raw_feedback,
    classified_issue:    aiResult.classified_issue,
    issue_tags:          aiResult.issue_tags,
    suggested_priority:  aiResult.suggested_priority,
    suggested_dept:      aiResult.suggested_dept,
    is_enhancement:      aiResult.is_enhancement,
    confidence:          aiResult.confidence,
    raw_ai_response:     aiResult.raw,
  })

  let ticket = null

  if (autoCreate && aiResult.confidence >= 0.75) {
    ticket = await createTicketService({
      body: {
        title:          aiResult.classified_issue,
        description:    raw_feedback,
        department_tag: aiResult.suggested_dept,
        issue_tags:     aiResult.issue_tags,
        priority:       aiResult.suggested_priority,
        source:         'AI_GENERATED',
        ai_analysis_id: analysis._id,
      },
      userId,
    })

    await linkAnalysisToTicket(analysis._id, ticket._id)
  }

  return { analysis, ticket }
}
