import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes     from './modules/auth/auth.routes.js'
import dashboardRoutes from './modules/dashboard/dashboard.routes.js'
import sessionRoutes  from './modules/session/session.routes.js'
import ticketRoutes   from './modules/tickets/ticket.routes.js'
import reviewRoutes   from './modules/tickets/review.routes.js'
import customerRoutes from './modules/customer/customer.routes.js'
import userRoutes     from './modules/user/user.routes.js'
import slotBookingRoutes from './modules/slot-booking/slot-booking.routes.js'
import { startReviewAnalysisJob } from './modules/tickets/jobs/reviewAnalysis.job.js'
import { corsOptions } from './core/cors.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.options('*', cors(corsOptions))
app.use(cors(corsOptions))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth',      authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/sessions',  sessionRoutes)
app.use('/api/tickets',    ticketRoutes)
app.use('/api/reviews',    reviewRoutes)
app.use('/api/customers',  customerRoutes)
app.use('/api/users',        userRoutes)
app.use('/api/slot-booking', slotBookingRoutes)

startReviewAnalysisJob()

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'ChargeNexus API' }))

export default app
console.log("Deployment test");