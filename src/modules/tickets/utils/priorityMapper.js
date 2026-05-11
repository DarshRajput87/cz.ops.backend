import { TICKET_PRIORITY } from '../constants/priorities.js'

export function mapStringToPriority(str) {
  const normalized = str?.toUpperCase()?.trim()
  const valid = Object.values(TICKET_PRIORITY)
  
  if (valid.includes(normalized)) return normalized
  
  // Fuzzy matching or defaults
  if (normalized?.includes('URGENT')) return TICKET_PRIORITY.URGENT
  if (normalized?.includes('CRITICAL')) return TICKET_PRIORITY.URGENT
  if (normalized?.includes('HIGH'))    return TICKET_PRIORITY.HIGH
  if (normalized?.includes('LOW'))     return TICKET_PRIORITY.LOW
  
  return TICKET_PRIORITY.MEDIUM
}
