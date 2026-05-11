export function buildFaultyPipeline({ search } = {}) {
  const faultyMatch = {
    $or: [
      { faulty_reason: { $exists: true, $not: { $size: 0 } } },
      { payment_status: 'action_required' },
    ],
  }

  const stages = [{ $match: faultyMatch }]

  if (search) {
    const re = { $regex: search, $options: 'i' }
    stages.push({
      $match: { $or: [{ session_id: re }, { charger_id: re }, { vehicle_no: re }] },
    })
  }

  return [
    ...stages,
    { $lookup: { from: 'customers',    localField: 'customer_id', foreignField: '_id', as: '_customer' } },
    { $lookup: { from: 'ocpi_parties', localField: 'party_id',    foreignField: '_id', as: '_party'    } },
    {
      $addFields: {
        severity: {
          $switch: {
            branches: [
              { case: { $eq: ['$payment_status', 'action_required'] }, then: 'high' },
              { case: { $gt: [{ $size: { $ifNull: ['$faulty_reason', []] } }, 2] }, then: 'medium' },
            ],
            default: 'low',
          },
        },
        retry_count: { $ifNull: ['$retry_count', 0] },
      },
    },
    {
      $project: {
        _id: 1,
        session_id: 1,
        charger_id: 1,
        station_id: 1,
        vehicle_no: 1,
        kwh: 1,
        total_cost: 1,
        session_status: 1,
        payment_status: 1,
        faulty_reason: 1,
        severity: 1,
        retry_count: 1,
        started_at: 1,
        ended_at: 1,
        customer_name: { $ifNull: [{ $arrayElemAt: ['$_customer.name', 0] }, 'N/A'] },
        party_name:    { $ifNull: [{ $arrayElemAt: ['$_party.name',    0] }, 'N/A'] },
      },
    },
    { $sort: { started_at: -1 } },
  ]
}
