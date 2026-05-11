const EXPLICIT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://chargezoneops.online',
  'https://www.chargezoneops.online',
  'https://cz-ops-frontend.vercel.app',
]

const VERCEL_PREVIEW_RE = /^https:\/\/cz-ops-frontend(-[a-z0-9]+)*(-darshrajpur87s-projects)?\.vercel\.app$/

export function isAllowedOrigin(origin) {
  if (!origin) return true
  if (EXPLICIT_ORIGINS.includes(origin)) return true
  if (VERCEL_PREVIEW_RE.test(origin)) return true
  return false
}

export const corsOptions = {
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true)
    cb(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}

export const socketCorsOptions = {
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true)
    cb(new Error(`CORS blocked: ${origin}`))
  },
  methods: ['GET', 'POST', 'PATCH'],
  credentials: true,
}
