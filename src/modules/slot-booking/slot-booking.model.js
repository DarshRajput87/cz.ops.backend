import mongoose from 'mongoose'
const { Schema, Types } = mongoose

const stationSchema = new Schema({}, { collection: 'stations', strict: false })
export const SbStation = mongoose.models['SbStation'] ?? mongoose.model('SbStation', stationSchema, 'stations')

const connSchema = new Schema(
  { connector_id: String, type: String, status: String, power_kw: Number },
  { _id: false }
)
const chargerSchema = new Schema(
  {
    charger_code: String,
    station_id:   Types.ObjectId,
    station_code: String,
    make:         String,
    model:        String,
    charger_type: String,
    power_kw:     Number,
    connectors:   [connSchema],
    status:       String,
  },
  { collection: 'chargers', strict: false }
)
export const SbCharger = mongoose.models['SbCharger'] ?? mongoose.model('SbCharger', chargerSchema, 'chargers')

const customerSchema = new Schema(
  {
    customer_name:   String,
    mobile:          String,
    email:           String,
    wallet_balance:  Number,
    kyc_status:      String,
    is_active:       Boolean,
    is_deleted:      Boolean,
  },
  { collection: 'customers', strict: false }
)
export const SbCustomer = mongoose.models['SbCustomer'] ?? mongoose.model('SbCustomer', customerSchema, 'customers')

const vehicleSchema = new Schema(
  {
    customer_id:          Types.ObjectId,
    vehicle_no:           String,
    vehicle_brand:        String,
    vehicle_model:        String,
    connector_type:       String,
    battery_capacity_kwh: Number,
    is_active:            Boolean,
  },
  { collection: 'vehicles', strict: false }
)
export const SbVehicle = mongoose.models['SbVehicle'] ?? mongoose.model('SbVehicle', vehicleSchema, 'vehicles')

const chargeCoinSchema = new Schema(
  { customer_id: Types.ObjectId, balance: Number },
  { collection: 'chargecoins', strict: false }
)
export const SbChargeCoin = mongoose.models['SbChargeCoin'] ?? mongoose.model('SbChargeCoin', chargeCoinSchema, 'chargecoins')

const scheduledBookingSchema = new Schema(
  {
    booking_id:            { type: String, required: true, unique: true },
    customer_id:           { type: Types.ObjectId, index: true },
    charger_id:            { type: Types.ObjectId, index: true },
    connector_id:          { type: String },
    connector_label:       { type: String },
    station_id:            { type: Types.ObjectId, index: true },
    vehicle_no:            { type: String },
    vehicle_id:            { type: Types.ObjectId },
    scheduled_start_time:  { type: Date, required: true, index: true },
    scheduled_end_time:    { type: Date, required: true },
    status:                { type: String, default: 'scheduled', enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'] },
    payment_status:        { type: String, default: 'pending' },
    slot_status:           { type: String, default: 'reserved', enum: ['reserved', 'occupied', 'cancelled', 'expired'] },
    reservation_expiry:    { type: Date },
    booking_source:        { type: String, default: 'SUPPORT' },
    scheduled_by_support:  { type: Boolean, default: true },
    is_ocpi_based_booking: { type: Boolean, default: false },
    is_emsp_based_booking: { type: Boolean, default: false },
    support_agent_id:      { type: Types.ObjectId },
    support_agent_name:    { type: String },
    notes:                 { type: String },
    sms_sent:              { type: Boolean, default: false },
    estimated_amount:      { type: Number, default: 0 },
    booking_type:          { type: String, default: 'scheduled' },
    charger_code:          { type: String },
    station_name:          { type: String },
    customer_name:         { type: String },
    customer_mobile:       { type: String },
  },
  { timestamps: true, collection: 'bookings' }
)
scheduledBookingSchema.index({ charger_id: 1, connector_id: 1, scheduled_start_time: 1 })

export const ScheduledBooking =
  mongoose.models['SbScheduledBooking'] ??
  mongoose.model('SbScheduledBooking', scheduledBookingSchema, 'bookings')

const sessionCheckSchema = new Schema({}, { collection: 'sessions', strict: false })
export const SbSession = mongoose.models['SbSession'] ?? mongoose.model('SbSession', sessionCheckSchema, 'sessions')
