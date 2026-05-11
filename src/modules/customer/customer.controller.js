import {
  dashboardStatsService,
  listCustomersService,
  getCustomerService,
  getBookingsService,
  getVehiclesService,
  getWalletTransactionsService,
  getChargeCoinsService,
  getSessionHistoryService,
} from './customer.service.js'

function handle(fn) {
  return async (req, res) => {
    try {
      const result = await fn(req, res)
      res.json({ success: true, ...result })
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
    }
  }
}

export const getDashboard = handle(async (req) => {
  const data = await dashboardStatsService({ query: req.query })
  return { data }
})

export const listCustomers = handle(async (req) => {
  return listCustomersService({ query: req.query })
})

export const getCustomer = handle(async (req) => {
  const data = await getCustomerService(req.params.id)
  return { data }
})

export const getBookings = handle(async (req) => {
  return getBookingsService({ customerId: req.params.id, query: req.query })
})

export const getVehicles = handle(async (req) => {
  return getVehiclesService({ customerId: req.params.id, query: req.query })
})

export const getWalletTransactions = handle(async (req) => {
  return getWalletTransactionsService({ customerId: req.params.id, query: req.query })
})

export const getChargeCoins = handle(async (req) => {
  return getChargeCoinsService({ customerId: req.params.id, query: req.query })
})

export const getSessionHistory = handle(async (req) => {
  return getSessionHistoryService({ customerId: req.params.id, query: req.query })
})
