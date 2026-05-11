import mongoose from 'mongoose'
import {
  SbCustomer, SbVehicle, SbChargeCoin,
  SbStation, SbCharger, ScheduledBooking, SbSession,
} from './slot-booking.model.js'

const { Types } = mongoose

export async function searchCustomerByMobile(mobile) {
  const customer = await SbCustomer.findOne({
    mobile: mobile.trim(),
    is_deleted: { $ne: true },
  }).lean()
  if (!customer) return null

  const [vehicles, chargeCoins] = await Promise.all([
    SbVehicle.find({ customer_id: customer._id, is_active: { $ne: false } }).lean(),
    SbChargeCoin.findOne({ customer_id: customer._id }).lean(),
  ])

  return { ...customer, vehicles, chargecoins_balance: chargeCoins?.balance ?? 0 }
}

export async function getAllStations() {
  return SbStation.find({ is_active: { $ne: false } })
    .select('_id name address city state station_code status')
    .lean()
}

export async function getChargersByStation(stationId) {
  return SbCharger.find({ station_id: new Types.ObjectId(stationId) })
    .select('_id charger_code make model charger_type power_kw connectors status')
    .lean()
}

export async function checkAvailability({ chargerId, connectorId, startTime, endTime }) {
  const start = new Date(startTime)
  const end   = new Date(endTime)

  const [conflicts, activeSessions] = await Promise.all([
    ScheduledBooking.find({
      charger_id:   new Types.ObjectId(chargerId),
      connector_id: connectorId,
      status:       { $in: ['scheduled', 'in_progress'] },
      slot_status:  { $nin: ['cancelled', 'expired'] },
      scheduled_start_time: { $lt: end },
      scheduled_end_time:   { $gt: start },
    }).select('booking_id scheduled_start_time scheduled_end_time status slot_status customer_name').lean(),

    SbSession.find({
      charger_id:   new Types.ObjectId(chargerId),
      connector_id: connectorId,
      status:       { $in: ['active', 'in_progress', 'charging', 'preparing'] },
    }).select('session_id start_time status').lean(),
  ])

  return {
    conflicts,
    activeSessions,
    available: conflicts.length === 0 && activeSessions.length === 0,
  }
}

export async function createBooking(data) {
  const booking = new ScheduledBooking(data)
  await booking.save()
  return booking.toObject()
}

export async function getBookings({ page = 1, limit = 20, status, search, startDate, endDate, stationId } = {}) {
  const match = { booking_source: 'SUPPORT' }

  if (status)   match.status = status
  if (stationId) match.station_id = new Types.ObjectId(stationId)

  if (startDate || endDate) {
    match.scheduled_start_time = {}
    if (startDate) match.scheduled_start_time.$gte = new Date(startDate)
    if (endDate)   match.scheduled_start_time.$lte = new Date(new Date(endDate).setHours(23, 59, 59))
  }

  if (search) {
    match.$or = [
      { booking_id:      { $regex: search, $options: 'i' } },
      { customer_name:   { $regex: search, $options: 'i' } },
      { customer_mobile: { $regex: search, $options: 'i' } },
      { vehicle_no:      { $regex: search, $options: 'i' } },
      { charger_code:    { $regex: search, $options: 'i' } },
      { station_name:    { $regex: search, $options: 'i' } },
    ]
  }

  const skip = (Number(page) - 1) * Number(limit)

  const [data, total] = await Promise.all([
    ScheduledBooking.find(match)
      .sort({ scheduled_start_time: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    ScheduledBooking.countDocuments(match),
  ])

  return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
}

export async function getBookingById(id) {
  return ScheduledBooking.findById(id).lean()
}

export async function cancelBooking(id) {
  return ScheduledBooking.findByIdAndUpdate(
    id,
    { $set: { status: 'cancelled', slot_status: 'cancelled' } },
    { new: true }
  ).lean()
}

export async function generateBookingId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const count   = await ScheduledBooking.countDocuments({ booking_id: { $regex: `^BKG-${dateStr}-` } })
  return `BKG-${dateStr}-${String(count + 1).padStart(4, '0')}`
}
