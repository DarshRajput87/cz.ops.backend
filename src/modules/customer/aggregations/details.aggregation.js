import mongoose from 'mongoose'
import { Customer, CDR, Booking, ChargeCoin, Vehicle } from '../customer.model.js'

function tierFromKwh(kwh) {
  if (kwh >= 3000) return 'PLATINUM'
  if (kwh >= 1000) return 'GOLD'
  if (kwh >= 200)  return 'SILVER'
  return 'BRONZE'
}

export async function getCustomerSummary(customerId) {
  const oid = new mongoose.Types.ObjectId(customerId)

  const [customer, cdrStats, bookingStats, coinResult, preferredVehicle] = await Promise.all([
    Customer.findById(oid).lean(),

    CDR.aggregate([
      { $match: { customer_id: oid } },
      { $group: { _id: null, total_kwh: { $sum: '$total_energy' }, total_sessions: { $sum: 1 } } },
    ]),

    Booking.aggregate([
      { $match: { customer_id: oid, status: 'completed' } },
      { $group: { _id: null, total_spent: { $sum: '$estimated_amount' } } },
    ]),

    ChargeCoin.aggregate([
      { $match: { customer_id: oid } },
      {
        $group: {
          _id:      null,
          earned:   { $sum: { $cond: [{ $eq: ['$type', 'EARNED']   }, '$coins', 0] } },
          redeemed: { $sum: { $cond: [{ $eq: ['$type', 'REDEEMED'] }, '$coins', 0] } },
          expired:  { $sum: { $cond: [{ $eq: ['$type', 'EXPIRED']  }, '$coins', 0] } },
        },
      },
    ]),

    Vehicle.aggregate([
      { $match: { customer_id: oid, is_active: true } },
      { $sort: { createdAt: -1 } },
      { $limit: 1 },
      { $project: { connector_type: 1 } },
    ]),
  ])

  if (!customer) return null

  const kwh      = cdrStats[0]?.total_kwh      ?? 0
  const coins    = coinResult[0] ?? { earned: 0, redeemed: 0, expired: 0 }
  const netCoins = coins.earned - coins.redeemed - coins.expired

  const preferredConnector =
    customer.preferred_connector || preferredVehicle[0]?.connector_type || null

  return {
    ...customer,
    total_kwh_consumed:  kwh,
    total_sessions:      cdrStats[0]?.total_sessions ?? 0,
    total_spent:         bookingStats[0]?.total_spent ?? 0,
    chargecoins:         netCoins,
    tier:                tierFromKwh(kwh),
    preferred_connector: preferredConnector,
  }
}
