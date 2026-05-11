import { Customer, Vehicle } from '../customer.model.js'

export async function getCustomerList({ search = '', filters = {}, page = 1, limit = 20 } = {}) {
  const skip  = (page - 1) * limit
  const match = {}

  if (search) {
    const vehicleIds = await Vehicle.distinct('customer_id', {
      vehicle_no: { $regex: search, $options: 'i' },
    })

    const orClauses = [
      { customer_name: { $regex: search, $options: 'i' } },
      { mobile:        { $regex: search, $options: 'i' } },
      { email:         { $regex: search, $options: 'i' } },
    ]
    if (vehicleIds.length) orClauses.push({ _id: { $in: vehicleIds } })
    match.$or = orClauses
  }

  if (filters.is_active  !== undefined) match.is_active  = filters.is_active  === 'true' || filters.is_active  === true
  if (filters.is_deleted !== undefined) match.is_deleted = filters.is_deleted === 'true' || filters.is_deleted === true
  if (filters.kyc_status) match.kyc_status = filters.kyc_status

  const [result] = await Customer.aggregate([
    { $match: match },
    {
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from:         'vehicles',
              localField:   '_id',
              foreignField: 'customer_id',
              as:           'vehicles',
              pipeline:     [
                { $sort: { createdAt: -1 } },
                { $limit: 1 },
                { $project: { vehicle_no: 1, vehicle_brand: 1, vehicle_model: 1, connector_type: 1 } },
              ],
            },
          },
          { $unwind: { path: '$vehicles', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              customer_name:       1,
              mobile:              1,
              email:               1,
              profile_pic:         1,
              wallet_balance:      1,
              kyc_status:          1,
              is_active:           1,
              is_deleted:          1,
              preferred_connector: 1,
              createdAt:           1,
              vehicle:             '$vehicles',
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const total = result.total[0]?.count ?? 0

  return {
    data:       result.data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore:    page * limit < total,
  }
}
