import { DEPARTMENT_TAG } from '../constants/departments.js'

export function mapStringToDepartment(str) {
  const normalized = str?.toLowerCase()?.trim()
  const departments = Object.values(DEPARTMENT_TAG)
  
  // Direct match
  const direct = departments.find(d => d.toLowerCase() === normalized)
  if (direct) return direct
  
  // Keyword mapping
  if (normalized?.includes('pay') || normalized?.includes('money') || normalized?.includes('bill')) 
    return DEPARTMENT_TAG.FINANCE
  if (normalized?.includes('app') || normalized?.includes('software') || normalized?.includes('bug'))
    return DEPARTMENT_TAG.SOFTWARE
  if (normalized?.includes('charger') || normalized?.includes('hardware') || normalized?.includes('machine'))
    return DEPARTMENT_TAG.TECHNICAL
  if (normalized?.includes('clean') || normalized?.includes('fix') || normalized?.includes('broken'))
    return DEPARTMENT_TAG.MAINTENANCE
    
  return DEPARTMENT_TAG.SUPPORT
}
