import { findTicketById } from '../ticket.repository.js'

export async function canAccessTicket(req, res, next) {
  try {
    const { id } = req.params
    const user = req.user

    // If no ID in params, it's likely a list or create request, which is handled by authenticate
    if (!id) return next()

    const ticket = await findTicketById(id)
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }

    // Role-based access
    if (user.role === 'admin') return next()
    if (user.role === 'operator') return next()
    if (user.role === 'agent') return next()
    if (user.role === 'customer_team') return next()

    // Viewers/Others might only see their own (if they can even create)
    const isCreator = ticket.created_by.toString() === user.id
    if (isCreator) return next()

    return res.status(403).json({ success: false, message: 'Access denied' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error in permission check' })
  }
}

export function isAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin privileges required' })
  }
  next()
}
