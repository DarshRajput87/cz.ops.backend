import * as svc from './slot-booking.service.js'

const wrap = fn => async (req, res) => {
  try {
    const data = await fn(req)
    res.json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message })
  }
}

export const searchCustomer    = wrap(req => svc.searchCustomer(req.body.mobile))
export const getStations       = wrap(() => svc.getStations())
export const getChargers       = wrap(req => svc.getChargersByStation(req.query.station_id))
export const checkAvailability = wrap(req => svc.checkAvailability(req.body))
export const createBooking     = wrap(req => svc.createBooking(req.body, req.user))
export const getBookings       = wrap(req => svc.getBookings(req.query))
export const cancelBooking     = wrap(req => svc.cancelBooking(req.params.id, req.user))
