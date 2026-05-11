import mongoose from 'mongoose'
import { connectDB } from '../core/database/index.js'
import { seedAccounts } from './account.seed.js'
import { seedTickets } from './ticket.seed.js'

async function runSeeds() {
  try {
    console.log('Starting Seeding Process...')
    
    // Connect to database
    await connectDB()
    
    // Run all seeds
    await seedAccounts()
    await seedTickets()
    
    console.log('All seeds completed successfully!')
  } catch (error) {
    console.error('Seeding process failed:', error)
  } finally {
    // Close connection
    await mongoose.connection.close()
    console.log('MongoDB connection closed.')
    process.exit(0)
  }
}

runSeeds()
