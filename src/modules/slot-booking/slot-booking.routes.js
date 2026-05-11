import { Router } from 'express'
import { authenticate } from '../../core/middleware/auth.middleware.js'
import * as ctrl from './slot-booking.controller.js'

const router = Router()
router.use(authenticate)

router.post('/search-customer',    ctrl.searchCustomer)
router.get('/stations',            ctrl.getStations)
router.get('/chargers',            ctrl.getChargers)
router.post('/check-availability', ctrl.checkAvailability)
router.post('/create',             ctrl.createBooking)
router.get('/list',                ctrl.getBookings)
router.patch('/:id/cancel',        ctrl.cancelBooking)

export default router
