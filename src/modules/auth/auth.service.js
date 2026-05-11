import jwt from 'jsonwebtoken'
import { config } from '../../core/config/index.js'
import { Account } from './auth.model.js'

export async function listUsersService() {
  return Account.find({ isActive: true }).select('name email role createdAt')
}

export async function createUserService({ name, email, password, role = 'agent' }) {
  if (!name?.trim())     throw { status: 400, message: 'Name is required' }
  if (!email?.trim())    throw { status: 400, message: 'Email is required' }
  if (!password)         throw { status: 400, message: 'Password is required' }

  const existing = await Account.findOne({ email: email.toLowerCase().trim() })
  if (existing) throw { status: 409, message: 'Email already in use' }

  const account = await Account.create({ name, email, password, role })
  return { id: account._id, name: account.name, email: account.email, role: account.role }
}

export async function loginService({ email, password }) {
  const account = await Account.findOne({ email, isActive: true })
  if (!account) throw { status: 401, message: 'Invalid credentials' }

  const valid = await account.comparePassword(password)
  if (!valid) throw { status: 401, message: 'Invalid credentials' }

  const token = jwt.sign(
    { id: account._id, email: account.email, role: account.role, permissions: account.permissions },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  )

  return {
    token,
    user: {
      id:          account._id,
      name:        account.name,
      email:       account.email,
      role:        account.role,
      permissions: account.permissions,
    },
  }
}
