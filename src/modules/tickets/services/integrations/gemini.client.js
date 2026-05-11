import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '../../../../core/config/index.js'

const genAI = new GoogleGenerativeAI(config.geminiApiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export async function generateContent(prompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (err) {
      if (attempt === retries) throw new Error(`Gemini API failed: ${err.message}`)
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
}

export function parseJsonResponse(text) {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/, '')
    .trim()
  return JSON.parse(cleaned)
}
