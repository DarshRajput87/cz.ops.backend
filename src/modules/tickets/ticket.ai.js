import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '../../core/config/index.js'
import { TICKET_PRIORITY, DEPARTMENT_TAG, ISSUE_TAG } from './ticket.model.js'
import { buildClassificationPrompt } from './utils/aiPromptBuilder.js'
import { mapStringToPriority } from './utils/priorityMapper.js'
import { mapStringToDepartment } from './utils/departmentMapper.js'

const genAI  = new GoogleGenerativeAI(config.geminiApiKey)
const model  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

const VALID_PRIORITIES   = Object.values(TICKET_PRIORITY)
const VALID_DEPARTMENTS  = Object.values(DEPARTMENT_TAG)
const VALID_ISSUE_TAGS   = Object.values(ISSUE_TAG)

// ─── Core Analyzer ────────────────────────────────────────────────────────────

export async function analyzeWithGemini(raw_feedback) {
  const prompt = buildClassificationPrompt({
    feedback: raw_feedback,
    priorities: VALID_PRIORITIES,
    departments: VALID_DEPARTMENTS,
    issueTags: VALID_ISSUE_TAGS
  })

  let responseText
  try {
    const result = await model.generateContent(prompt)
    responseText = result.response.text().trim()
  } catch (err) {
    throw { status: 502, message: `Gemini API error: ${err.message}` }
  }

  let parsed
  try {
    const cleaned = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/,  '')
      .trim()
    parsed = JSON.parse(cleaned)
  } catch {
    throw { status: 502, message: 'Gemini returned non-JSON response', raw: responseText }
  }

  return sanitizeAiResult(parsed, responseText)
}

// ─── Sanitize + Validate AI Output ───────────────────────────────────────────

function sanitizeAiResult(parsed, rawText) {
  const priority = mapStringToPriority(parsed.suggested_priority)
  const dept = mapStringToDepartment(parsed.suggested_dept)

  const tags = Array.isArray(parsed.issue_tags)
    ? parsed.issue_tags.filter((t) => VALID_ISSUE_TAGS.includes(t))
    : []

  const confidence = typeof parsed.confidence === 'number'
    ? Math.min(1, Math.max(0, parsed.confidence))
    : 0.5

  return {
    classified_issue:   String(parsed.classified_issue || 'Unclassified Issue').slice(0, 80),
    issue_tags:         tags,
    suggested_priority: priority,
    suggested_dept:     dept,
    is_enhancement:     Boolean(parsed.is_enhancement),
    confidence,
    reasoning:          String(parsed.reasoning || ''),
    raw:                rawText,
  }
}
