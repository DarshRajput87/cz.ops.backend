import {
  repoDashboardStats,
  repoListCustomers,
  repoGetCustomer,
  repoGetBookings,
  repoGetVehicles,
  repoGetWalletTransactions,
  repoGetChargeCoins,
  repoGetSessionHistory,
} from './customer.repository.js'

function paginationParams(query) {
  return {
    page:  Math.max(1, parseInt(query.page)  || 1),
    limit: Math.min(100, parseInt(query.limit) || 20),
  }
}

export async function dashboardStatsService({ query }) {
  const days = parseInt(query.days) || 30
  return repoDashboardStats({ days })
}

export async function listCustomersService({ query }) {
  const { page, limit } = paginationParams(query)
  const { search = '', is_active, is_deleted, kyc_status } = query
  return repoListCustomers({
    search,
    filters: { is_active, is_deleted, kyc_status },
    page,
    limit,
  })
}

export async function getCustomerService(id) {
  const customer = await repoGetCustomer(id)
  if (!customer) {
    const err = new Error('Customer not found')
    err.status = 404
    throw err
  }
  return customer
}

export async function getBookingsService({ customerId, query }) {
  const { page, limit } = paginationParams(query)
  return repoGetBookings({ customerId, page, limit })
}

export async function getVehiclesService({ customerId, query }) {
  const { page, limit } = paginationParams(query)
  return repoGetVehicles({ customerId, page, limit })
}

export async function getWalletTransactionsService({ customerId, query }) {
  const { page, limit } = paginationParams(query)
  return repoGetWalletTransactions({ customerId, page, limit })
}

export async function getChargeCoinsService({ customerId, query }) {
  const { page, limit } = paginationParams(query)
  return repoGetChargeCoins({ customerId, page, limit })
}

export async function getSessionHistoryService({ customerId, query }) {
  const { page, limit } = paginationParams(query)
  return repoGetSessionHistory({ customerId, page, limit })
}
