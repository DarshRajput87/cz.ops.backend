import mongoose from 'mongoose'
import { config } from '../config/index.js'

export async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('MongoDB connected — ChargeNexus')
  } catch (err) {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  }
}
