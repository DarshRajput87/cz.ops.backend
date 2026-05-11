import mongoose from 'mongoose';

const connectorSchema = new mongoose.Schema({
  connector_id: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, required: true },
  power_kw: { type: Number, required: true },
}, { _id: false });

const chargerSchema = new mongoose.Schema({
  charger_code: { type: String, required: true, unique: true },
  station_id: { type: mongoose.Schema.Types.ObjectId },
  station_code: { type: String },
  tenant_id: { type: mongoose.Schema.Types.ObjectId },
  make: { type: String },
  model: { type: String },
  charger_type: { type: String },
  power_kw: { type: Number },
  connectors: [connectorSchema],
  status: { type: String, default: 'available' },
  last_heartbeat: { type: Date },
  firmware_version: { type: String },
  ocpp_version: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('Charger', chargerSchema);
