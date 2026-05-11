import * as repo from './slot-booking.repository.js'

export async function searchCustomer(mobile) {
  if (!mobile || !/^\d{10}$/.test(mobile.trim()))
    throw Object.assign(new Error('Enter a valid 10-digit mobile number'), { status: 400 })

  const customer = await repo.searchCustomerByMobile(mobile.trim())
  if (!customer) throw Object.assign(new Error('No customer found with this mobile number'), { status: 404 })
  return customer
}

export async function getStations() {
  return repo.getAllStations()
}

export async function getChargersByStation(stationId) {
  if (!stationId) throw Object.assign(new Error('station_id is required'), { status: 400 })
  return repo.getChargersByStation(stationId)
}

export async function checkAvailability({ chargerId, connectorId, startTime, endTime }) {
  if (!chargerId || !connectorId || !startTime || !endTime)
    throw Object.assign(new Error('chargerId, connectorId, startTime and endTime are required'), { status: 400 })

  const start = new Date(startTime)
  const end   = new Date(endTime)
  if (isNaN(start) || isNaN(end)) throw Object.assign(new Error('Invalid date format'), { status: 400 })
  if (start >= end)  throw Object.assign(new Error('start_time must be before end_time'), { status: 400 })
  if (start < new Date()) throw Object.assign(new Error('start_time must be in the future'), { status: 400 })

  return repo.checkAvailability({ chargerId, connectorId, startTime, endTime })
}

export async function createBooking(body, agent) {
  const {
    customerId, chargerId, connectorId, connectorLabel,
    stationId, vehicleNo, vehicleId,
    scheduledStartTime, scheduledEndTime,
    notes, stationName, chargerCode,
    customerName, customerMobile, estimatedAmount,
  } = body

  if (!customerId || !chargerId || !connectorId || !stationId || !scheduledStartTime || !scheduledEndTime)
    throw Object.assign(new Error('Missing required booking fields'), { status: 400 })

  const avail = await repo.checkAvailability({
    chargerId, connectorId,
    startTime: scheduledStartTime,
    endTime:   scheduledEndTime,
  })
  if (!avail.available)
    throw Object.assign(new Error('Slot not available — conflict exists for this time range'), { status: 409 })

  const bookingId         = await repo.generateBookingId()
  const reservationExpiry = new Date(new Date(scheduledStartTime).getTime() + 15 * 60 * 1000)

  const booking = await repo.createBooking({
    booking_id:            bookingId,
    customer_id:           customerId,
    charger_id:            chargerId,
    connector_id:          connectorId,
    connector_label:       connectorLabel || '',
    station_id:            stationId,
    vehicle_no:            vehicleNo || '',
    vehicle_id:            vehicleId || null,
    scheduled_start_time:  new Date(scheduledStartTime),
    scheduled_end_time:    new Date(scheduledEndTime),
    status:                'scheduled',
    payment_status:        'pending',
    slot_status:           'reserved',
    reservation_expiry:    reservationExpiry,
    booking_source:        'SUPPORT',
    scheduled_by_support:  true,
    is_ocpi_based_booking: false,
    is_emsp_based_booking: false,
    support_agent_id:      agent?._id ?? null,
    support_agent_name:    agent?.name ?? '',
    notes:                 notes || '',
    estimated_amount:      estimatedAmount || 0,
    booking_type:          'scheduled',
    charger_code:          chargerCode || '',
    station_name:          stationName || '',
    customer_name:         customerName || '',
    customer_mobile:       customerMobile || '',
    sms_sent:              false,
  })

  sendSmsStub({ mobile: customerMobile, name: customerName, stationName, startTime: scheduledStartTime })

  return booking
}

export async function getBookings(query) {
  return repo.getBookings(query)
}

export async function cancelBooking(id, agent) {
  if (!id) throw Object.assign(new Error('Booking ID required'), { status: 400 })

  const booking = await repo.getBookingById(id)
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 })
  if (booking.status === 'cancelled') throw Object.assign(new Error('Booking is already cancelled'), { status: 400 })
  if (['completed', 'in_progress'].includes(booking.status))
    throw Object.assign(new Error(`Cannot cancel a ${booking.status} booking`), { status: 400 })

  return repo.cancelBooking(id)
}

function sendSmsStub({ mobile, name, stationName, startTime }) {
  try {
    const dt = new Date(startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    console.log(`[SMS STUB] → ${mobile}: Dear ${name}, your charging slot at ${stationName} is confirmed for ${dt}. – ChargeNexus`)
  } catch { /* non-critical */ }
}
