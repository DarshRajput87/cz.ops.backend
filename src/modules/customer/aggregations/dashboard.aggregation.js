import { Customer, ChargeCoin, CDR } from '../customer.model.js'

export async function getDashboardStats({ days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [[kpi], coinResult, kwhResult, addedTimeline, deletedTimeline] = await Promise.all([
    Customer.aggregate([
      {
        $facet: {
          total:   [{ $count: 'count' }],
          active:  [{ $match: { is_deleted: { $ne: true }, is_active: { $ne: false } } }, { $count: 'count' }],
          deleted: [{ $match: { is_deleted: true } }, { $count: 'count' }],
          wallet:  [
            { $match: { is_deleted: { $ne: true } } },
            { $group: { _id: null, total: { $sum: '$wallet_balance' } } },
          ],
        },
      },
    ]),

    ChargeCoin.aggregate([
      {
        $group: {
          _id:      null,
          earned:   { $sum: { $cond: [{ $eq: ['$type', 'EARNED']   }, '$coins', 0] } },
          redeemed: { $sum: { $cond: [{ $eq: ['$type', 'REDEEMED'] }, '$coins', 0] } },
          expired:  { $sum: { $cond: [{ $eq: ['$type', 'EXPIRED']  }, '$coins', 0] } },
        },
      },
    ]),

    CDR.aggregate([
      { $group: { _id: null, total_kwh: { $sum: '$total_energy' } } },
    ]),

    Customer.aggregate([
      { $match: { created_at: { $gte: since } } },
      {
        $group: {
          _id:   { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', added: '$count', _id: 0 } },
    ]),

    Customer.aggregate([
      { $match: { is_deleted: true, updated_at: { $gte: since } } },
      {
        $group: {
          _id:   { $dateToString: { format: '%Y-%m-%d', date: '$updated_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', deleted: '$count', _id: 0 } },
    ]),
  ])

  const coins = coinResult[0] ?? { earned: 0, redeemed: 0, expired: 0 }
  const kwh   = kwhResult[0]  ?? { total_kwh: 0 }

  const map = {}
  addedTimeline.forEach(({ date, added }) => { map[date] = { date, added, deleted: 0 } })
  deletedTimeline.forEach(({ date, deleted }) => {
    if (map[date]) map[date].deleted = deleted
    else map[date] = { date, added: 0, deleted }
  })

  return {
    kpis: {
      total_customers:      kpi.total[0]?.count   ?? 0,
      active_customers:     kpi.active[0]?.count  ?? 0,
      deleted_customers:    kpi.deleted[0]?.count ?? 0,
      total_wallet_balance: kpi.wallet[0]?.total  ?? 0,
      total_chargecoins:    coins.earned - coins.redeemed - coins.expired,
      total_kwh:            kwh.total_kwh,
    },
    timeline: Object.values(map).sort((a, b) => a.date.localeCompare(b.date)),
  }
}
