import { Account } from '../modules/auth/auth.model.js'

const accounts = [
  {
    name: 'Admin User',
    email: 'admin@chargenexus.com',
    password: 'admin123password',
    role: 'admin',
    isActive: true,
  },
  {
    name: 'Network Operator',
    email: 'operator@chargenexus.com',
    password: 'operator123password',
    role: 'operator',
    isActive: true,
  },
  {
    name: 'Viewer User',
    email: 'viewer@chargenexus.com',
    password: 'viewer123password',
    role: 'viewer',
    isActive: true,
  },
  {
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@chargenexus.com',
    password: 'agent123password',
    role: 'agent',
    isActive: true,
  },
  {
    name: 'James Carter',
    email: 'james.carter@chargenexus.com',
    password: 'agent123password',
    role: 'agent',
    isActive: true,
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@chargenexus.com',
    password: 'agent123password',
    role: 'agent',
    isActive: true,
  },
  {
    name: 'Customer Support Team',
    email: 'support@chargenexus.com',
    password: 'team123password',
    role: 'customer_team',
    isActive: true,
  },
  {
    name: 'EV Fleet Support',
    email: 'fleet.support@chargenexus.com',
    password: 'team123password',
    role: 'customer_team',
    isActive: true,
  },
]

export async function seedAccounts() {
  try {
    // Check if admin already exists to avoid duplicates
    console.log('Cleaning existing accounts...')
    await Account.deleteMany({ email: { $in: accounts.map(a => a.email) } })

    console.log('Seeding Accounts...')
    await Account.create(accounts)
    console.log(`Successfully seeded ${accounts.length} accounts`)
  } catch (error) {
    console.error('Error seeding accounts:', error)
    throw error
  }
}
