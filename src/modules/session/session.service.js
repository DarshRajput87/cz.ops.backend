import { getLiveSessions, getInprogressSessions, getFaultySessions, getSessionById } from './session.repository.js'
import { resolveSessionById } from './services/resolveSession.service.js'

export const fetchLiveSessions       = (q) => getLiveSessions(q)
export const fetchInprogressSessions = (q) => getInprogressSessions(q)
export const fetchFaultySessions     = (q) => getFaultySessions(q)
export const resolveSession          = (id) => resolveSessionById(id)

export async function fetchSessionDetails(id) {
  const session = await getSessionById(id)
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 })
  return session
}
