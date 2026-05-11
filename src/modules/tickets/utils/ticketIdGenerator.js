import mongoose from 'mongoose'

export async function generateTicketId() {
  const today   = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const prefix  = `TCK-${dateStr}-`

  const last = await mongoose.model('Ticket').findOne(
    { ticket_id: { $regex: `^${prefix}` } },
    { ticket_id: 1 },
    { sort: { ticket_id: -1 } }
  )

  const seq = last ? parseInt(last.ticket_id.split('-')[2], 10) + 1 : 1
  return `${prefix}${String(seq).padStart(4, '0')}`
}
