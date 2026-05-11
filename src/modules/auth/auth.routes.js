import { Router } from 'express'
import { login, listUsers, createUser } from './auth.controller.js'
import { authenticate } from '../../core/middleware/auth.middleware.js'

function isAdmin(req, res, next) {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin privileges required' })
  next()
}

const router = Router()

router.post('/login', login)
router.get('/users', authenticate, listUsers)
router.post('/users', authenticate, isAdmin, createUser)

export default router
