import { Router } from 'express'
import { authenticate } from '../../core/middleware/auth.middleware.js'
import {
  listUsers, createUser, updateUser,
  resetPassword, deactivateUser, getModules,
} from './user.controller.js'

const router = Router()

router.use(authenticate)

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin only' })
  next()
}

router.get('/modules',       getModules)
router.get('/',              adminOnly, listUsers)
router.post('/',             adminOnly, createUser)
router.patch('/:id',         adminOnly, updateUser)
router.patch('/:id/password',adminOnly, resetPassword)
router.delete('/:id',        adminOnly, deactivateUser)

export default router
