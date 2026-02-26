import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

export type AIProvider = "openai" | "openrouter";

/**
 * Returns which AI provider is active based on environment variables.
 * Priority: OpenAI first, then OpenRouter.
 */
export function getActiveAIProvider(): AIProvider | null {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  return null;
}

/**
 * Returns whether any AI provider is configured.
 */
export function isAIConfigured(): boolean {
  return getActiveAIProvider() !== null;
}

/**
 * Returns the appropriate AI model instance based on configured provider.
 * Throws if no provider is configured.
 */
export function getAIModel(): LanguageModel {
  const provider = getActiveAIProvider();

  if (provider === "openai") {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    return openai(process.env.OPENAI_MODEL || "gpt-4o-mini") as unknown as LanguageModel;
  }

  if (provider === "openrouter") {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });
    return openrouter(process.env.OPENROUTER_MODEL || "openai/gpt-5-mini") as unknown as LanguageModel;
  }

  throw new Error("No AI provider configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY.");
}
