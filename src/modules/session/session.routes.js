import { Router } from 'express'
import {
  getLiveSessions,
  getInprogressSessions,
  getFaultySessions,
  getSessionDetails,
  resolveSessionHandler,
} from './session.controller.js'

const router = Router()

router.get('/live',         getLiveSessions)
router.get('/inprogress',   getInprogressSessions)
router.get('/faulty',       getFaultySessions)
router.get('/:id',          getSessionDetails)
router.post('/:id/resolve', resolveSessionHandler)

export default router
