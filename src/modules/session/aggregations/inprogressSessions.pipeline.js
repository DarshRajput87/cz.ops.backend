export function buildInprogressPipeline({ search } = {}) {
  const match = { status: 'ACTIVE' }

  if (search) {
    const re = { $regex: search, $options: 'i' }
    match.$or = [
      { session_id: re },
      { charger_id: re },
      { vehicle_no: re },
    ]
  }

  return [
    { $match: match },
    { $lookup: { from: 'customers',    localField: 'customer_id', foreignField: '_id', as: '_customer' } },
    { $lookup: { from: 'ocpi_parties', localField: 'party_id',    foreignField: '_id', as: '_party'    } },
    {
      $project: {
        _id: 1,
        session_id: 1,
        charger_id: 1,
        station_id: 1,
        vehicle_no: 1,
        kwh: 1,
        total_cost: 1,
        status: 1,
        payment_status: 1,
        started_at: 1,
        customer_name: { $ifNull: [{ $arrayElemAt: ['$_customer.name', 0] }, 'N/A'] },
        party_name:    { $ifNull: [{ $arrayElemAt: ['$_party.name',    0] }, 'N/A'] },
      },
    },
    { $sort: { started_at: -1 } },
  ]
}
