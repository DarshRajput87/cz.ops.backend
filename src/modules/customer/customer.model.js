import mongoose from 'mongoose'

const { Schema, Types } = mongoose

// All models use a 'Cx' prefix to avoid OverwriteModelError with models
// registered by other modules (dashboard, session, etc.) that share the
// same collections (bookings, sessions, cdrs, invoices, session_history).

// ─── Customer ─────────────────────────────────────────────────────────────────

const customerSchema = new Schema(
  {
    customer_name:       { type: String, trim: true, index: true },
    mobile:              { type: String, trim: true, index: true },
    email:               { type: String, trim: true, lowercase: true, index: true },
    profile_pic:         { type: String },
    gender:              { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    dob:                 { type: Date },
    address: {
      line1:   String,
      city:    String,
      state:   String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    wallet_balance:      { type: Number, default: 0 },
    preferred_connector: { type: String },
    kyc_status:          { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    is_active:           { type: Boolean, default: true, index: true },
    is_deleted:          { type: Boolean, default: false, index: true },
    deleted_at:          { type: Date },
  },
  { timestamps: true, collection: 'customers' }
)

customerSchema.index({ createdAt: -1 })

export const Customer = mongoose.model('CxCustomer', customerSchema, 'customers')

// ─── Vehicle ──────────────────────────────────────────────────────────────────

const vehicleSchema = new Schema(
  {
    customer_id:          { type: Types.ObjectId, index: true },
    vehicle_no:           { type: String, trim: true, index: true },
    vehicle_brand:        { type: String, trim: true },
    vehicle_model:        { type: String, trim: true },
    battery_capacity_kwh: { type: Number },
    connector_type:       { type: String },
    autocharge_enabled:   { type: Boolean, default: false },
    is_active:            { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'vehicles' }
)

export const Vehicle = mongoose.model('CxVehicle', vehicleSchema, 'vehicles')

// ─── Booking ──────────────────────────────────────────────────────────────────

const bookingSchema = new Schema(
  {},
  { timestamps: true, collection: 'bookings', strict: false }
)

export const Booking = mongoose.model('CxBooking', bookingSchema, 'bookings')

// ─── Session ──────────────────────────────────────────────────────────────────

const sessionSchema = new Schema(
  {},
  { timestamps: true, collection: 'sessions', strict: false }
)

export const Session = mongoose.model('CxSession', sessionSchema, 'sessions')

// ─── CDR ──────────────────────────────────────────────────────────────────────

const cdrSchema = new Schema(
  {},
  { timestamps: true, collection: 'cdrs', strict: false }
)

export const CDR = mongoose.model('CxCDR', cdrSchema, 'cdrs')

// ─── Invoice ──────────────────────────────────────────────────────────────────

const invoiceSchema = new Schema(
  {},
  { timestamps: true, collection: 'invoices', strict: false }
)

export const Invoice = mongoose.model('CxInvoice', invoiceSchema, 'invoices')

// ─── Wallet Transaction ───────────────────────────────────────────────────────

const walletTransactionSchema = new Schema(
  {
    customer_id: { type: Types.ObjectId, index: true },
  },
  { timestamps: true, collection: 'wallet_transactions', strict: false }
)

export const WalletTransaction = mongoose.model('CxWalletTransaction', walletTransactionSchema, 'wallet_transactions')

// ─── ChargeCoin ───────────────────────────────────────────────────────────────

const chargeCoinSchema = new Schema(
  {
    customer_id: { type: Types.ObjectId, index: true },
  },
  { timestamps: true, collection: 'chargecoins', strict: false }
)

export const ChargeCoin = mongoose.model('CxChargeCoin', chargeCoinSchema, 'chargecoins')

// ─── Session History ──────────────────────────────────────────────────────────

const sessionHistorySchema = new Schema(
  {
    customer_id: { type: Types.ObjectId, index: true },
    timestamp:   { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'session_history', strict: false }
)

export const SessionHistory = mongoose.model('CxSessionHistory', sessionHistorySchema, 'session_history')
