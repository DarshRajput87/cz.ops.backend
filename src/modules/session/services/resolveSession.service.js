import mongoose from 'mongoose'
import {
  findSessionRaw,
  updateSessionById,
  createInvoice,
  createCdr,
  addSessionHistory,
  findCdrByBookingId,
  findInvoiceByBookingId,
  removeInprogressByBookingId,
  removeFaultyByBookingId,
} from '../session.repository.js'
import { FaultyDoc } from '../session.model.js'

const invNo = () => `INV-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`
const cdrNo = () => `CDR-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`

async function ensureInvoice(raw, dbSession) {
  const existing = await findInvoiceByBookingId(raw._id)
  if (existing) return existing
  const doc = await createInvoice({
    invoice_no:   invNo(),
    booking_id:   raw._id,
    customer_id:  raw.customer_id,
    subtotal:     raw.estimated_amount ?? 0,
    gst_amount:   0,
    total_amount: raw.estimated_amount ?? 0,
    kwh:          raw.estimated_units  ?? 0,
    currency:     'INR',
    status:       'paid',
    generated_at: new Date(),
    created_at:   new Date(),
    updated_at:   new Date(),
  }, dbSession)
  await updateSessionById(raw._id, { $set: { invoice_id: doc._id } }, dbSession)
  return doc
}

async function ensureCdr(raw, dbSession) {
  const existing = await findCdrByBookingId(raw._id)
  if (existing) return existing
  return createCdr({
    cdr_id:       cdrNo(),
    booking_id:   raw._id,
    customer_id:  raw.customer_id,
    charger_id:   raw.charger_id,
    total_energy: raw.estimated_units  ?? 0,
    total_cost:   { excl_vat: raw.estimated_amount ?? 0, incl_vat: raw.estimated_amount ?? 0 },
    start_date_time: raw.booking_start,
    end_date_time:   raw.booking_stop ?? new Date(),
    payment_status:  'done',
    created_at:      new Date(),
    updated_at:      new Date(),
  }, dbSession)
}

export async function resolveSessionById(id) {
  const raw = await findSessionRaw(id)
  if (!raw) throw Object.assign(new Error('Session not found'), { status: 404 })

  const isInprogress    = raw.status === 'in_progress'
  const isPaidNoInvoice = raw.payment_status === 'paid' && !raw.invoice_id
  const faultyRecord    = await FaultyDoc.findOne({ booking_id: raw._id }).lean()
  const isFaulty        = !!faultyRecord

  if (!isInprogress && !isFaulty && !isPaidNoInvoice) {
    throw Object.assign(new Error('Session is not in a resolvable state'), { status: 400 })
  }

  const dbSession = await mongoose.startSession()
  try {
    dbSession.startTransaction()
    const now = new Date()

    // Case 1 — in_progress: stop session, generate CDR + invoice
    if (isInprogress) {
      await ensureCdr(raw, dbSession)
      const invoice = await ensureInvoice(raw, dbSession)
      await updateSessionById(id, {
        $set: { status: 'completed', payment_status: 'paid', resolved: true, booking_stop: now },
      }, dbSession)
      await removeInprogressByBookingId(raw._id, dbSession)
      await addSessionHistory({
        booking_id: raw._id,
        action:     'RESOLVED',
        actor:      'admin',
        metadata:   { invoice_id: invoice._id, reason: 'manual_resolve' },
        timestamp:  now,
        created_at: now,
      }, dbSession)
      await dbSession.commitTransaction()
      return { resolved: true, case: 'in_progress', invoice_id: invoice._id }
    }

    // Case 2 — faulty EMSP: clear fault, generate invoice
    if (isFaulty) {
      await ensureCdr(raw, dbSession)
      const invoice = await ensureInvoice(raw, dbSession)
      await updateSessionById(id, {
        $set: { faulty_reason: [], payment_status: 'paid', resolved: true },
      }, dbSession)
      await removeFaultyByBookingId(raw._id, dbSession)
      await addSessionHistory({
        booking_id: raw._id,
        action:     'FAULT_RESOLVED',
        actor:      'admin',
        metadata:   { invoice_id: invoice._id, reason: 'fault_cleared' },
        timestamp:  now,
        created_at: now,
      }, dbSession)
      await dbSession.commitTransaction()
      return { resolved: true, case: 'faulty', invoice_id: invoice._id }
    }

    // Case 3 — paid but no invoice: generate invoice only
    const invoice = await ensureInvoice(raw, dbSession)
    await addSessionHistory({
      booking_id: raw._id,
      action:     'INVOICE_GENERATED',
      actor:      'admin',
      metadata:   { invoice_id: invoice._id, reason: 'manual_invoice' },
      timestamp:  now,
      created_at: now,
    }, dbSession)
    await dbSession.commitTransaction()
    return { resolved: true, case: 'invoice_only', invoice_id: invoice._id }

  } catch (err) {
    await dbSession.abortTransaction()
    throw err
  } finally {
    dbSession.endSession()
  }
}
