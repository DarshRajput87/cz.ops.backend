import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  booking_id: { type: String, required: true, unique: true },
  tenant_id: { type: mongoose.Schema.Types.ObjectId },
  party_id: { type: mongoose.Schema.Types.ObjectId },
  customer_id: { type: mongoose.Schema.Types.ObjectId },
  charger_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Charger' },
  connector_id: { type: String },
  station_id: { type: String },
  user_id: { type: mongoose.Schema.Types.ObjectId },
  vehicle_no: { type: String },
  booking_type: { type: String },
  estimated_amount: { type: Number, default: 0 },
  estimated_units: { type: Number, default: 0 },
  estimated_time: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  transaction_id: { type: String },
  is_emsp_based_booking: { type: Boolean, default: false },
  is_ocpi_based_booking: { type: Boolean, default: false },
  is_rfid_based_booking: { type: Boolean, default: false },
  booking_start: { type: Date },
  booking_stop: { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.models['Booking'] ?? mongoose.model('Booking', bookingSchema);
