import { Ticket, TicketActivity, TicketAttachment, FeedbackAnalysis } from '../modules/tickets/ticket.model.js'
import { Account } from '../modules/auth/auth.model.js'
import { TICKET_STATUS, TICKET_PRIORITY, DEPARTMENT_TAG, ISSUE_TAG } from '../modules/tickets/ticket.model.js'

const sampleTickets = [
  {
    customer: { name: 'Aniket Varma', email: 'aniket@gmail.com', phone: '9876543210' },
    title: 'Charger CHR-042 Screen Frozen',
    description: 'The display screen on charger CHR-042 at Mumbai Central is frozen and not accepting RFID cards.',
    department_tag: DEPARTMENT_TAG.TECHNICAL,
    issue_tags: [ISSUE_TAG.CHARGER_ISSUE, ISSUE_TAG.RFID_ISSUE],
    priority: TICKET_PRIORITY.HIGH,
    status: TICKET_STATUS.OPEN,
    related_entities: { charger_id: 'CHR-042' },
    source: 'MANUAL'
  },
  {
    customer: { name: 'Priya Singh', email: 'priya.s@outlook.com' },
    title: 'Payment failed but amount deducted',
    description: 'Attempted to start a session today at 10 AM. Payment of ₹450 was deducted but session never started.',
    department_tag: DEPARTMENT_TAG.FINANCE,
    issue_tags: [ISSUE_TAG.PAYMENT_ISSUE, ISSUE_TAG.SESSION_ISSUE],
    priority: TICKET_PRIORITY.URGENT,
    status: TICKET_STATUS.IN_PROGRESS,
    related_entities: { session_id: 'SES-9921' },
    source: 'AI_GENERATED'
  },
  {
    customer: { name: 'Suresh Kumar', phone: '9122334455' },
    title: 'App crashing on login',
    description: 'The mobile app crashes immediately after entering credentials on iOS 17.4.',
    department_tag: DEPARTMENT_TAG.SOFTWARE,
    issue_tags: [ISSUE_TAG.APP_ISSUE],
    priority: TICKET_PRIORITY.MEDIUM,
    status: TICKET_STATUS.OPEN,
    source: 'MANUAL'
  },
  {
    customer: { name: 'Janet Doe', email: 'janet@company.com' },
    title: 'OCPI Sync delay for partner X',
    description: 'Partner X reported that their roaming sessions are not syncing in real-time. Delay observed is 4 hours.',
    department_tag: DEPARTMENT_TAG.OCPI,
    issue_tags: [ISSUE_TAG.OCPI_SYNC],
    priority: TICKET_PRIORITY.MEDIUM,
    status: TICKET_STATUS.ON_HOLD,
    source: 'MANUAL'
  },
  {
    customer: { name: 'Vikram Batra', email: 'vikram@army.in' },
    title: 'Charger cable damaged',
    description: 'The Type 2 cable at station LC-01 is frayed and looks unsafe to use.',
    department_tag: DEPARTMENT_TAG.MAINTENANCE,
    issue_tags: [ISSUE_TAG.CHARGER_ISSUE],
    priority: TICKET_PRIORITY.URGENT,
    status: TICKET_STATUS.OPEN,
    related_entities: { location_id: 'LOC-DEL-02' },
    source: 'MANUAL'
  },
  {
    customer: { name: 'Megha Rao', email: 'megha@tech.com' },
    title: 'Request for new feature: Multi-wallet',
    description: 'Users are asking for the ability to manage multiple business wallets from a single personal account.',
    department_tag: DEPARTMENT_TAG.MOBILE_APP,
    issue_tags: [ISSUE_TAG.APP_ISSUE],
    priority: TICKET_PRIORITY.LOW,
    status: TICKET_STATUS.OPEN,
    source: 'MANUAL'
  },
  {
    customer: { name: 'Rahul Jain', email: 'rj@startup.io' },
    title: 'Session not stopping from app',
    description: 'I finished charging but the app keeps saying "Stopping..." and I am still being billed.',
    department_tag: DEPARTMENT_TAG.SOFTWARE,
    issue_tags: [ISSUE_TAG.SESSION_ISSUE, ISSUE_TAG.APP_ISSUE],
    priority: TICKET_PRIORITY.HIGH,
    status: TICKET_STATUS.RESOLVED,
    related_entities: { session_id: 'SES-4412', charger_id: 'CHR-991' },
    resolution_note: 'Forced stop from backend and refunded the extra 15 minutes of billing.',
    source: 'AI_GENERATED'
  },
  {
    customer: { name: 'Anita Desai', email: 'anita@home.com' },
    title: 'Wrong billing address in profile',
    description: 'I updated my billing address but the invoices are still generated with the old one.',
    department_tag: DEPARTMENT_TAG.FINANCE,
    issue_tags: [ISSUE_TAG.APP_ISSUE, ISSUE_TAG.PAYMENT_ISSUE],
    priority: TICKET_PRIORITY.LOW,
    status: TICKET_STATUS.CLOSED,
    resolution_note: 'Fixed the database record and regenerated the last 3 invoices.',
    source: 'MANUAL'
  }
]

export async function seedTickets() {
  try {
    const admin = await Account.findOne({ role: 'admin' })
    if (!admin) {
      console.warn('Admin account not found for seeding tickets. Skipping.')
      return
    }

    console.log('Cleaning existing tickets...')
    await Ticket.deleteMany({})
    await TicketActivity.deleteMany({})
    await TicketAttachment.deleteMany({})
    await FeedbackAnalysis.deleteMany({})

    console.log('Seeding Tickets...')
    
    // Create tickets one by one to trigger pre-save hooks (ticket_id generation)
    for (const data of sampleTickets) {
      const ticket = new Ticket({
        ...data,
        created_by: admin._id,
        // Randomly assign some tickets to operator if needed
        assigned_to: Math.random() > 0.5 ? admin._id : undefined
      })
      await ticket.save()
      
      // Log initial activity
      await TicketActivity.create({
        ticket_id: ticket._id,
        action: 'CREATED',
        performed_by: admin._id,
        metadata: { source: ticket.source }
      })
      
      if (ticket.status === TICKET_STATUS.RESOLVED || ticket.status === TICKET_STATUS.CLOSED) {
         await TicketActivity.create({
          ticket_id: ticket._id,
          action: 'STATUS_CHANGED',
          performed_by: admin._id,
          metadata: { to: ticket.status, note: ticket.resolution_note }
        })
      }
    }

    console.log(`Successfully seeded ${sampleTickets.length} tickets`)
  } catch (error) {
    console.error('Error seeding tickets:', error)
    throw error
  }
}
