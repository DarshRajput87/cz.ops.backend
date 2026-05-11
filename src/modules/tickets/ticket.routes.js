import { Router } from 'express'
import { authenticate } from '../../core/middleware/auth.middleware.js'
import {
  createTicket,
  listTickets,
  getTicket,
  updateStatus,
  assignTicket,
  resolveTicket,
  dashboardStats,
  analyzeFeedback,
  uploadAttachments,
  listAgents,
} from './ticket.controller.js'
import { canAccessTicket, isAdmin } from './middleware/ticketPermission.middleware.js'
import { upload } from './middleware/upload.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/dashboard/stats',          dashboardStats)
router.get('/agents',                   listAgents)
router.get('/list',                     listTickets)
router.post('/create',                  createTicket)
router.post('/analyze',                 analyzeFeedback)
router.post('/upload', upload.array('files', 5), uploadAttachments)

router.get('/:id',              canAccessTicket, getTicket)
router.patch('/:id/status',     canAccessTicket, updateStatus)
router.patch('/:id/assign',     isAdmin,         assignTicket)
router.post('/:id/resolve',     canAccessTicket, resolveTicket)

export default router
