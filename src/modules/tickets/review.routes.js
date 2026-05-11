import { Router } from 'express'
import { authenticate } from '../../core/middleware/auth.middleware.js'
import { getReviews, getStats, processPending } from './review.controller.js'

const router = Router()

router.use(authenticate)

router.get('/',         getReviews)
router.get('/stats',    getStats)
router.post('/process', processPending)

export default router
