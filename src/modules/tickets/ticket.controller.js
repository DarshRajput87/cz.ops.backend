import {
  createTicketService,
  listTicketsService,
  getTicketService,
  updateStatusService,
  assignTicketService,
  resolveTicketService,
  dashboardStatsService,
  analyzeFeedbackService,
  listAgentsService,
} from './ticket.service.js'

function userId(req) {
  return req.user?.id
}

// POST /api/tickets/create
export async function createTicket(req, res) {
  try {
    const ticket = await createTicketService({ body: req.body, userId: userId(req) })
    res.status(201).json({ success: true, data: ticket })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/tickets/list
export async function listTickets(req, res) {
  try {
    const result = await listTicketsService({ query: req.query })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/tickets/agents
export async function listAgents(req, res) {
  try {
    const agents = await listAgentsService()
    res.json({ success: true, data: agents })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/tickets/dashboard/stats
export async function dashboardStats(req, res) {
  try {
    const stats = await dashboardStatsService()
    res.json({ success: true, data: stats })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/tickets/:id
export async function getTicket(req, res) {
  try {
    const ticket = await getTicketService(req.params.id)
    res.json({ success: true, data: ticket })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// PATCH /api/tickets/:id/status
export async function updateStatus(req, res) {
  try {
    const { status, note } = req.body
    const ticket = await updateStatusService({ id: req.params.id, status, note, userId: userId(req) })
    res.json({ success: true, data: ticket })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// PATCH /api/tickets/:id/assign
export async function assignTicket(req, res) {
  try {
    const { assigned_to } = req.body
    const ticket = await assignTicketService({ id: req.params.id, assigned_to, userId: userId(req) })
    res.json({ success: true, data: ticket })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/tickets/:id/resolve
export async function resolveTicket(req, res) {
  try {
    const { resolution_note } = req.body
    const ticket = await resolveTicketService({ id: req.params.id, resolution_note, userId: userId(req) })
    res.json({ success: true, data: ticket })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/tickets/upload
export async function uploadAttachments(req, res) {
  try {
    if (!req.files?.length)
      return res.status(400).json({ success: false, message: 'No files uploaded' })

    const files = req.files.map((f) => ({
      filename:   f.originalname,
      url:        `/uploads/tickets/${f.filename}`,
      mime_type:  f.mimetype,
      size_bytes: f.size,
    }))

    res.json({ success: true, data: files })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Upload failed' })
  }
}

// POST /api/tickets/analyze
export async function analyzeFeedback(req, res) {
  try {
    const { raw_feedback, autoCreate = false } = req.body
    const result = await analyzeFeedbackService({ raw_feedback, userId: userId(req), autoCreate })
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}
