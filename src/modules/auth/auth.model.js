import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const accountSchema = new mongoose.Schema(
  {
    name:     { type: String, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role:        { type: String, enum: ['admin', 'operator', 'agent', 'customer_team', 'viewer'], default: 'operator' },
    permissions: { type: [String], default: [] },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
)

accountSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

accountSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

export const Account = mongoose.model('Account', accountSchema, 'Accounts')
