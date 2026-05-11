import mongoose from 'mongoose'
import { getDashboardStats }   from './aggregations/dashboard.aggregation.js'
import { getCustomerList }     from './aggregations/list.aggregation.js'
import { getCustomerSummary }  from './aggregations/details.aggregation.js'
import {
  Customer, Vehicle, Booking,
  WalletTransaction, ChargeCoin, SessionHistory,
} from './customer.model.js'

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function repoDashboardStats({ days } = {}) {
  return getDashboardStats({ days })
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function repoListCustomers({ search, filters, page, limit }) {
  return getCustomerList({ search, filters, page, limit })
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function repoGetCustomer(id) {
  return getCustomerSummary(id)
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function repoGetBookings({ customerId, page = 1, limit = 20 }) {
  const oid  = new mongoose.Types.ObjectId(customerId)
  const skip = (page - 1) * limit

  const [result] = await Booking.aggregate([
    { $match: { customer_id: oid } },
    {
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              booking_id:     1,
              vehicle_no:     1,
              charger_id:     1,
              charger_name:   1,
              station_name:   1,
              amount:         1,
              units:          1,
              status:         1,
              payment_status: 1,
              payment_mode:   1,
              createdAt:      1,
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const total = result.total[0]?.count ?? 0
  return { data: result.data, total, page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total }
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export async function repoGetVehicles({ customerId, page = 1, limit = 20 }) {
  const oid  = new mongoose.Types.ObjectId(customerId)
  const skip = (page - 1) * limit

  const [result] = await Vehicle.aggregate([
    { $match: { customer_id: oid } },
    {
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from:         'sessions',
              localField:   '_id',
              foreignField: 'vehicle_id',
              as:           '_sessions',
              pipeline:     [{ $count: 'count' }],
            },
          },
          {
            $lookup: {
              from:     'cdrs',
              let:      { vid: '$_id' },
              pipeline: [
                { $match: { $expr: { $eq: ['$$vid', '$vehicle_id'] } } },
                { $group: { _id: null, total_kwh: { $sum: '$energy_kwh' } } },
              ],
              as: '_cdr',
            },
          },
          {
            $project: {
              vehicle_no:           1,
              vehicle_brand:        1,
              vehicle_model:        1,
              connector_type:       1,
              battery_capacity_kwh: 1,
              autocharge_enabled:   1,
              is_active:            1,
              createdAt:            1,
              total_sessions: { $ifNull: [{ $arrayElemAt: ['$_sessions.count', 0] }, 0] },
              total_kwh:      { $ifNull: [{ $arrayElemAt: ['$_cdr.total_kwh',  0] }, 0] },
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const total = result.total[0]?.count ?? 0
  return { data: result.data, total, page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total }
}

// ─── Wallet Transactions ──────────────────────────────────────────────────────

export async function repoGetWalletTransactions({ customerId, page = 1, limit = 20 }) {
  const oid  = new mongoose.Types.ObjectId(customerId)
  const skip = (page - 1) * limit

  const [result] = await WalletTransaction.aggregate([
    { $match: { customer_id: oid } },
    {
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              type: 1, source: 1, amount: 1,
              balance_before: 1, balance_after: 1,
              payment_mode: 1, status: 1, booking_id: 1,
              reference_id: 1, createdAt: 1,
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const total = result.total[0]?.count ?? 0
  return { data: result.data, total, page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total }
}

// ─── ChargeCoins ──────────────────────────────────────────────────────────────

export async function repoGetChargeCoins({ customerId, page = 1, limit = 20 }) {
  const oid  = new mongoose.Types.ObjectId(customerId)
  const skip = (page - 1) * limit

  const [result] = await ChargeCoin.aggregate([
    { $match: { customer_id: oid } },
    {
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              type: 1, source: 1, coins: 1,
              booking_id: 1, kwh_used: 1, description: 1, createdAt: 1,
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const total = result.total[0]?.count ?? 0
  return { data: result.data, total, page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total }
}

// ─── Session History ──────────────────────────────────────────────────────────

export async function repoGetSessionHistory({ customerId, page = 1, limit = 30 }) {
  const oid  = new mongoose.Types.ObjectId(customerId)
  const skip = (page - 1) * limit

  const [result] = await SessionHistory.aggregate([
    { $match: { customer_id: oid } },
    {
      $facet: {
        data: [
          { $sort: { timestamp: -1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: { session_id: 1, event_type: 1, timestamp: 1, metadata: 1, createdAt: 1 } },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const total = result.total[0]?.count ?? 0
  return { data: result.data, total, page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total }
}
