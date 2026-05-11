import {
  listAccountsService,
  createAccountService,
  updateAccountService,
  resetPasswordService,
  deactivateAccountService,
} from './user.service.js'
import { VALID_MODULES } from './user.constants.js'

function handle(fn) {
  return async (req, res) => {
    try {
      const data = await fn(req)
      res.json({ success: true, data })
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
    }
  }
}

export const listUsers     = handle(async ()    => listAccountsService())
export const createUser    = handle(async (req) => createAccountService(req.body))
export const updateUser    = handle(async (req) => updateAccountService(req.params.id, req.body))
export const resetPassword = handle(async (req) => resetPasswordService(req.params.id, req.body))
export const deactivateUser= handle(async (req) => deactivateAccountService(req.params.id, req.user.id))
export const getModules    = handle(async ()    => VALID_MODULES)
