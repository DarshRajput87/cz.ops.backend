import mongoose from 'mongoose'
import { SessionDoc, InprogressDoc, FaultyDoc, InvoiceDoc, CdrDoc, SessionHistoryDoc } from './session.model.js'
import { buildLiveSessionsPipeline }    from './aggregations/liveSessions.pipeline.js'
import { buildInprogressPipeline }      from './aggregations/inprogressSessions.pipeline.js'
import { buildFaultyPipeline }          from './aggregations/faultySessions.pipeline.js'

async function paginate(Model, pipeline, page, limit, facets = {}) {
  const skip = (page - 1) * limit
  const [result] = await Model.aggregate([
    ...pipeline,
    {
      $facet: {
        data:  [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }],
        ...facets,
      },
    },
  ])
  const total = result.total[0]?.count ?? 0
  const extras = {}
  for (const key of Object.keys(facets)) {
    const r = result[key]?.[0]
    extras[key] = r?.count ?? r?.total ?? 0
  }
  return { data: result.data, total, page, limit, pages: Math.ceil(total / limit), ...extras }
}

async function getFaultyCounts(type) {
  if (!type || type === 'all') {
    const faultyCount = await FaultyDoc.countDocuments({})
    return { faultyCount }
  }

  const base = [
    { $lookup: { from: 'bookings', localField: 'booking_id', foreignField: '_id', as: '_b' } },
    { $unwind: '$_b' },
  ]

  if (type === 'emsp') {
    base.push(
      { $match: { '_b.is_emsp_based_booking': true, '_b.is_ocpi_based_booking': true } },
      { $lookup: { from: 'ocpi_parties', localField: '_b.party_id', foreignField: '_id', as: '_p' } },
      { $unwind: { path: '$_p', preserveNullAndEmptyArrays: true } },
      { $match: { '_p.handshake': true } },
    )
  } else if (type === 'cpo') {
    base.push({ $match: { '_b.is_emsp_based_booking': { $ne: true } } })
  }

  const [res] = await Promise.all([
    FaultyDoc.aggregate([...base, { $count: 'count' }]),
  ])
  return { faultyCount: res[0]?.count ?? 0 }
}

export async function getLiveSessions({ type, status, search, page = 1, limit = 10 }) {
  const [paginateResult, faultyCounts] = await Promise.all([
    paginate(
      SessionDoc,
      buildLiveSessionsPipeline({ type, status, search }),
      +page, +limit,
      {
        activeCount:         [{ $match: { session_status: 'in_progress' } }, { $count: 'count' }],
        invoiceMissingCount: [{ $match: { payment_status: 'paid', invoice_generated: false } }, { $count: 'count' }],
        totalEnergy:         [{ $group: { _id: null, total: { $sum: '$kwh'        } } }],
        totalRevenue:        [{ $group: { _id: null, total: { $sum: '$total_cost' } } }],
      },
    ),
    getFaultyCounts(type),
  ])
  return { ...paginateResult, ...faultyCounts }
}

export async function getInprogressSessions({ search, page = 1, limit = 10 }) {
  return paginate(InprogressDoc, buildInprogressPipeline({ search }), +page, +limit)
}

export async function getFaultySessions({ search, page = 1, limit = 10 }) {
  return paginate(FaultyDoc, buildFaultyPipeline({ search }), +page, +limit)
}

export async function getSessionById(id) {
  const [result] = await SessionDoc.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    { $lookup: { from: 'customers',            localField: 'customer_id', foreignField: '_id',         as: 'customer' } },
    { $lookup: { from: 'chargers',             localField: 'charger_id',  foreignField: '_id',         as: 'charger'  } },
    { $lookup: { from: 'ocpi_parties',         localField: 'party_id',    foreignField: '_id',         as: 'party'    } },
    { $lookup: { from: 'ocpi_tenants',         localField: 'tenant_id',   foreignField: '_id',         as: 'tenant'   } },
    { $lookup: { from: 'invoices',             localField: '_id',         foreignField: 'booking_id',  as: 'invoice'  } },
    { $lookup: { from: 'ocpi_faulty_sessions', localField: '_id',         foreignField: 'booking_id',  as: 'faulty'   } },
    { $lookup: { from: 'cdrs',                 localField: '_id',         foreignField: 'booking_id',  as: 'cdr'      } },
    {
      $addFields: {
        customer: { $arrayElemAt: ['$customer', 0] },
        charger:  { $arrayElemAt: ['$charger',  0] },
        party:    { $arrayElemAt: ['$party',    0] },
        tenant:   { $arrayElemAt: ['$tenant',   0] },
        invoice:  { $arrayElemAt: ['$invoice',  0] },
        faulty:   { $arrayElemAt: ['$faulty',   0] },
        cdr:      { $arrayElemAt: ['$cdr',      0] },
      },
    },
  ])
  return result ?? null
}

export async function findSessionRaw(id) {
  return SessionDoc.findById(id).lean()
}

export async function updateSessionById(id, update, dbSession) {
  return SessionDoc.findByIdAndUpdate(id, update, { new: true, session: dbSession })
}

export async function createInvoice(data, dbSession) {
  const [doc] = await InvoiceDoc.create([data], { session: dbSession })
  return doc
}

export async function createCdr(data, dbSession) {
  const [doc] = await CdrDoc.create([data], { session: dbSession })
  return doc
}

export async function addSessionHistory(data, dbSession) {
  const [doc] = await SessionHistoryDoc.create([data], { session: dbSession })
  return doc
}

export async function removeInprogressByBookingId(booking_id, dbSession) {
  return InprogressDoc.deleteMany({ booking_id }, { session: dbSession })
}

export async function removeFaultyByBookingId(booking_id, dbSession) {
  return FaultyDoc.deleteMany({ booking_id }, { session: dbSession })
}

export async function findCdrByBookingId(booking_id) {
  return CdrDoc.findOne({ booking_id }).lean()
}

export async function findInvoiceByBookingId(booking_id) {
  return InvoiceDoc.findOne({ booking_id }).lean()
}

export async function removeFromInprogress(session_id, dbSession) {
  return InprogressDoc.deleteOne({ session_id }, { session: dbSession })
}

export async function removeFromFaulty(session_id, dbSession) {
  return FaultyDoc.deleteOne({ session_id }, { session: dbSession })
}

export async function findCdrBySessionId(session_id) {
  return CdrDoc.findOne({ session_id }).lean()
}
