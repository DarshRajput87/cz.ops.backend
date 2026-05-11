import { Router } from 'express'
import { authenticate } from '../../core/middleware/auth.middleware.js'
import {
  getDashboard,
  listCustomers,
  getCustomer,
  getBookings,
  getVehicles,
  getWalletTransactions,
  getChargeCoins,
  getSessionHistory,
} from './customer.controller.js'

const router = Router()

router.use(authenticate)

router.get('/dashboard',                getDashboard)
router.get('/list',                     listCustomers)
router.get('/:id',                      getCustomer)
router.get('/:id/bookings',             getBookings)
router.get('/:id/vehicles',             getVehicles)
router.get('/:id/wallet-transactions',  getWalletTransactions)
router.get('/:id/chargecoins',          getChargeCoins)
router.get('/:id/session-history',      getSessionHistory)

export default router
