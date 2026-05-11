import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  chargerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Charger', required: true },
  sessionId: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['COMPLETED', 'CANCELLED', 'SCHEDULED', 'IN_PROGRESS'], 
    required: true 
  },
  startTime: { type: Date },
  endTime: { type: Date },
  energyConsumed: { type: Number, required: true, default: 0 },
  cost: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

sessionSchema.pre('validate', function(next) {
  if (this.status === 'COMPLETED' && !this.endTime) {
    this.invalidate('endTime', 'endTime must exist when status is COMPLETED');
  }
  if (this.status === 'SCHEDULED' && this.startTime && this.startTime <= new Date()) {
    this.invalidate('startTime', 'startTime must be in the future when status is SCHEDULED');
  }
  next();
});

export default mongoose.model('Session', sessionSchema);
