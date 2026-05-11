import mongoose from 'mongoose';

const networkUptimeSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  uptimePercentage: { type: Number, required: true, min: 0, max: 100 },
  totalChargers: { type: Number, required: true },
  activeChargers: { type: Number, required: true },
  faultedChargers: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('NetworkUptime', networkUptimeSchema);
