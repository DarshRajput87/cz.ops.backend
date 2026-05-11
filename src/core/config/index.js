import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port:          process.env.PORT || 5000,
  mongoUri:      process.env.MONGO_URI,
  jwtSecret:     process.env.JWT_SECRET,
  jwtExpiresIn:  process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey:  process.env.GEMINI_API_KEY,
}
