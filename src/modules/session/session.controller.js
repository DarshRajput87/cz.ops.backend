import {
  fetchLiveSessions,
  fetchInprogressSessions,
  fetchFaultySessions,
  fetchSessionDetails,
  resolveSession,
} from './session.service.js'

const ok   = (res, payload) => res.json({ success: true, ...payload })
const fail = (res, err)     => res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })

export async function getLiveSessions(req, res) {
  try {
    const { type, status, search, page, limit } = req.query
    ok(res, await fetchLiveSessions({ type, status, search, page, limit }))
  } catch (err) { fail(res, err) }
}

export async function getInprogressSessions(req, res) {
  try {
    const { search, page, limit } = req.query
    ok(res, await fetchInprogressSessions({ search, page, limit }))
  } catch (err) { fail(res, err) }
}

export async function getFaultySessions(req, res) {
  try {
    const { search, page, limit } = req.query
    ok(res, await fetchFaultySessions({ search, page, limit }))
  } catch (err) { fail(res, err) }
}

export async function getSessionDetails(req, res) {
  try {
    ok(res, { data: await fetchSessionDetails(req.params.id) })
  } catch (err) { fail(res, err) }
}

export async function resolveSessionHandler(req, res) {
  try {
    ok(res, { data: await resolveSession(req.params.id) })
  } catch (err) { fail(res, err) }
}
