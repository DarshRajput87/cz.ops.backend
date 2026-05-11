export function buildLiveSessionsPipeline({ type, status, search } = {}) {
  const preMatch = {}

  if (status) preMatch.status = status

  if (type === 'emsp') {
    preMatch.is_emsp_based_booking = true
    preMatch.is_ocpi_based_booking = true
  }
  if (type === 'cpo') preMatch.is_emsp_based_booking = { $ne: true }

  const pipeline = [
    { $match: preMatch },
    { $lookup: { from: 'customers',            localField: 'customer_id', foreignField: '_id', as: '_cu' } },
    { $lookup: { from: 'chargers',             localField: 'charger_id',  foreignField: '_id', as: '_ch' } },
    { $lookup: { from: 'ocpi_parties',         localField: 'party_id',    foreignField: '_id', as: '_pa' } },
    { $lookup: { from: 'ocpi_tenants',         localField: 'tenant_id',   foreignField: '_id', as: '_te' } },
    { $lookup: { from: 'invoices',             localField: '_id',         foreignField: 'booking_id', as: '_inv' } },
    { $lookup: { from: 'ocpi_faulty_sessions', localField: '_id',         foreignField: 'booking_id', as: '_fa'  } },
    {
      $addFields: {
        _cud: { $arrayElemAt: ['$_cu', 0] },
        _chd: { $arrayElemAt: ['$_ch', 0] },
        _pad: { $arrayElemAt: ['$_pa', 0] },
        _fad: { $arrayElemAt: ['$_fa', 0] },
      },
    },
  ]

  if (type === 'emsp') {
    pipeline.push({ $match: { '_pad.handshake': true } })
  }

  if (search) {
    const re = { $regex: search, $options: 'i' }
    pipeline.push({
      $match: {
        $or: [
          { booking_id:              re },
          { vehicle_no:              re },
          { '_cud.customer_name':    re },
          { '_chd.charger_code':     re },
        ],
      },
    })
  }

  pipeline.push(
    {
      $project: {
        _id: 1,
        session_id:            '$booking_id',
        booking_id:            { $toString: '$_id' },
        customer_name:         { $ifNull: ['$_cud.customer_name', 'N/A'] },
        charger_code:          { $ifNull: ['$_chd.charger_code',  '—'  ] },
        station_id:            1,
        vehicle_no:            1,
        kwh:                   '$estimated_units',
        total_cost:            '$estimated_amount',
        session_status:        '$status',
        payment_status:        1,
        invoice_id:            1,
        booking_type:          1,
        booking_start:         1,
        booking_stop:          1,
        is_emsp_based_booking: 1,
        is_ocpi_based_booking: 1,
        party_name:            { $ifNull: ['$_pad.name',      null ] },
        party_handshake:       { $ifNull: ['$_pad.handshake', false] },
        invoice_generated:     { $gt: [{ $size: { $ifNull: ['$_inv', []] } }, 0] },
        is_faulty:             { $gt: [{ $size: { $ifNull: ['$_fa',  []] } }, 0] },
        faulty_reason:         { $ifNull: ['$_fad.faulty_reason', []] },
        faulty_severity:       { $ifNull: ['$_fad.severity',      null] },
        created_at:            1,
      },
    },
    { $sort: { booking_start: -1 } },
  )

  return pipeline
}
