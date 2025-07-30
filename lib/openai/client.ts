import OpenAI from 'openai'

// OpenAI client configuration
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) 