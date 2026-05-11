import mongoose from 'mongoose';
import Charger from '../src/models/Charger.js';
import Session from '../src/models/Session.js';
import NetworkUptime from '../src/models/NetworkUptime.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chargenexus';
const generateSessionId = () => 'SNX-' + crypto.randomBytes(4).toString('hex').toUpperCase();

const seedDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    console.log('🧹 Clearing existing collections...');
    await Charger.deleteMany({});
    await Session.deleteMany({});
    await NetworkUptime.deleteMany({});
    console.log('✅ Collections cleared.');

    // 1. Seed Chargers
    console.log('🌱 Seeding Chargers...');
    const chargerData = [
      { name: 'Downtown Plaza 1', location: 'City Center', status: 'ACTIVE', connectorType: 'CCS2', powerOutput: 150, isOnline: true },
      { name: 'Downtown Plaza 2', location: 'City Center', status: 'IDLE', connectorType: 'CCS2', powerOutput: 150, isOnline: true },
      { name: 'Mall West', location: 'Westfield Mall', status: 'ACTIVE', connectorType: 'CHAdeMO', powerOutput: 50, isOnline: true },
      { name: 'Mall East', location: 'Westfield Mall', status: 'FAULT', connectorType: 'CCS2', powerOutput: 350, isOnline: false },
      { name: 'Highway Rest Stop A', location: 'I-95 North', status: 'IDLE', connectorType: 'CCS2', powerOutput: 350, isOnline: true },
      { name: 'Highway Rest Stop B', location: 'I-95 North', status: 'ACTIVE', connectorType: 'CCS2', powerOutput: 350, isOnline: true },
      { name: 'Office Park Alpha', location: 'Tech District', status: 'ACTIVE', connectorType: 'Type 2', powerOutput: 22, isOnline: true },
      { name: 'Office Park Beta', location: 'Tech District', status: 'IDLE', connectorType: 'Type 2', powerOutput: 22, isOnline: true },
      { name: 'Airport Terminal 1', location: 'International Airport', status: 'ACTIVE', connectorType: 'CCS2', powerOutput: 150, isOnline: true },
      { name: 'Airport Terminal 2', location: 'International Airport', status: 'FAULT', connectorType: 'CCS2', powerOutput: 150, isOnline: false },
      { name: 'Supermarket Hub', location: 'Suburbs', status: 'IDLE', connectorType: 'CCS2', powerOutput: 50, isOnline: true },
      { name: 'Residential Complex', location: 'North Hills', status: 'ACTIVE', connectorType: 'Type 2', powerOutput: 11, isOnline: true },
    ];
    
    const chargers = await Charger.insertMany(chargerData.map(c => ({ ...c, lastHeartbeat: new Date() })));

    // 2. Seed Sessions
    console.log('🌱 Seeding Sessions...');
    const sessionsData = [];
    for (let i = 0; i < 35; i++) {
      const charger = chargers[Math.floor(Math.random() * chargers.length)];
      const rand = Math.random();
      const now = new Date();
      
      let status, startTime, endTime, energyConsumed, cost;

      if (rand < 0.6) {
        status = 'COMPLETED';
        startTime = new Date(now.getTime() - Math.random() * 86400000 * 5); // up to 5 days ago
        endTime = new Date(startTime.getTime() + (Math.random() * 3600000) + 1800000); // 30-90 mins later
        energyConsumed = parseFloat((Math.random() * 38 + 2).toFixed(2)); // 2 - 40 kWh
        cost = parseFloat((energyConsumed * 0.45).toFixed(2));
      } else if (rand < 0.75) {
        status = 'IN_PROGRESS';
        startTime = new Date(now.getTime() - Math.random() * 3600000); // started within last hour
        energyConsumed = parseFloat((Math.random() * 15 + 1).toFixed(2)); // 1 - 16 kWh
        cost = parseFloat((energyConsumed * 0.45).toFixed(2));
      } else if (rand < 0.9) {
        status = 'SCHEDULED';
        startTime = new Date(now.getTime() + Math.random() * 86400000); // within next 24h
        energyConsumed = 0;
        cost = 0;
      } else {
        status = 'CANCELLED';
        startTime = new Date(now.getTime() - Math.random() * 86400000 * 2); // up to 2 days ago
        energyConsumed = 0;
        cost = 0;
      }

      sessionsData.push({ chargerId: charger._id, sessionId: generateSessionId(), status, startTime, endTime, energyConsumed, cost });
    }
    await Session.insertMany(sessionsData);

    // 3. Seed Network Uptime (Last 10 Days)
    console.log('🌱 Seeding Network Uptime...');
    const uptimeData = [];
    for (let i = 9; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      uptimeData.push({
        date,
        uptimePercentage: parseFloat((Math.random() * 8 + 92).toFixed(2)), // 92 - 100%
        totalChargers: chargers.length,
        activeChargers: Math.floor(chargers.length * (Math.random() * 0.2 + 0.7)), // 70-90% active
        faultedChargers: Math.floor(Math.random() * 3) // 0-2 faulted
      });
    }
    await NetworkUptime.insertMany(uptimeData);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
