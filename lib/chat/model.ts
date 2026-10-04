import { ChatGoogle } from "@langchain/google"

interface GeminiModelOptions {
  temperature?: number
  model?: string
  maxOutputTokens?: number
}

/**
 * Shared factory for instantiating the LangChain Google Chat model.
 * Prevents repeating config across route handlers.
 */
export function createGeminiModel(options: GeminiModelOptions = {}) {
  const { temperature = 0, model, maxOutputTokens = 1000 } = options

  // Fallback chain: Option override -> Env Var -> Default (gemini-2.5-flash for 2026 standards)
  const modelName = model || process.env.GEMINI_MODEL || "gemini-2.5-flash"

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment variables.")
  }

  return new ChatGoogle({
    model: modelName,
    apiKey,
    temperature,
    maxOutputTokens,
  })
}
