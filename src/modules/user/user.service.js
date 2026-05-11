import bcrypt from 'bcryptjs'
import { Account } from '../auth/auth.model.js'
import { VALID_MODULES, ROLES } from './user.constants.js'

function sanitizePerms(permissions) {
  if (!Array.isArray(permissions)) return []
  return permissions.filter((p) => VALID_MODULES.includes(p))
}

export async function listAccountsService() {
  return Account.find({})
    .select('name email role permissions isActive createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean()
}

export async function createAccountService({ name, email, password, role = 'operator', permissions = [] }) {
  if (!name?.trim())       throw { status: 400, message: 'Name is required' }
  if (!email?.trim())      throw { status: 400, message: 'Email is required' }
  if (!password)           throw { status: 400, message: 'Password is required' }
  if (password.length < 6) throw { status: 400, message: 'Password must be at least 6 characters' }
  if (!ROLES.includes(role)) throw { status: 400, message: `Invalid role: ${role}` }

  const existing = await Account.findOne({ email: email.toLowerCase().trim() })
  if (existing) throw { status: 409, message: 'Email already in use' }

  const account = await Account.create({
    name:        name.trim(),
    email:       email.toLowerCase().trim(),
    password,
    role,
    permissions: sanitizePerms(permissions),
  })

  return {
    _id: account._id, name: account.name, email: account.email,
    role: account.role, permissions: account.permissions, isActive: account.isActive,
  }
}

export async function updateAccountService(id, { name, role, permissions, isActive }) {
  const update = {}
  if (name        !== undefined) update.name        = name.trim()
  if (isActive    !== undefined) update.isActive    = Boolean(isActive)
  if (role        !== undefined) {
    if (!ROLES.includes(role)) throw { status: 400, message: `Invalid role: ${role}` }
    update.role = role
  }
  if (permissions !== undefined) update.permissions = sanitizePerms(permissions)

  const account = await Account.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true }
  ).select('name email role permissions isActive createdAt updatedAt').lean()

  if (!account) throw { status: 404, message: 'User not found' }
  return account
}

export async function resetPasswordService(id, { password }) {
  if (!password || password.length < 6)
    throw { status: 400, message: 'Password must be at least 6 characters' }

  const hash    = await bcrypt.hash(password, 12)
  const account = await Account.findByIdAndUpdate(id, { $set: { password: hash } }, { new: true })
  if (!account) throw { status: 404, message: 'User not found' }
  return { success: true }
}

export async function deactivateAccountService(id, requesterId) {
  if (String(id) === String(requesterId))
    throw { status: 400, message: 'Cannot deactivate your own account' }

  const account = await Account.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true }
  )
  if (!account) throw { status: 404, message: 'User not found' }
  return { success: true }
}
