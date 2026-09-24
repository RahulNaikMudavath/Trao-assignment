import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config.js';
import { globalRateLimiter } from './rateLimiter.js';

export class LLMClient {
  constructor() {
    this.provider = config.llmProvider;
    this.geminiClient = null;
    if (config.geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
    }
  }

  // Sanitizes model output to safely parse JSON
  extractJsonString(raw) {
    let clean = raw.trim();

    // Remove markdown code fences if present
    const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      clean = codeBlockMatch[1].trim();
    }

    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    let startIdx = 0;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      const lastBrace = clean.lastIndexOf('}');
      if (lastBrace !== -1) {
        clean = clean.substring(startIdx, lastBrace + 1);
      }
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      const lastBracket = clean.lastIndexOf(']');
      if (lastBracket !== -1) {
        clean = clean.substring(startIdx, lastBracket + 1);
      }
    }

    // Fix trailing commas in arrays/objects
    clean = clean.replace(/,\s*([\]}])/g, '$1');

    return clean;
  }

  async generateJson(systemInstruction, prompt, options = {}) {
    const operationName = options.operationName || 'LLM generation';

    // If provider is mock or no API keys exist, signal caller or use fallback
    if (this.provider === 'mock' || (!config.geminiApiKey && !config.groqApiKey)) {
      throw new Error('NO_API_KEY_MOCK_FALLBACK');
    }

    return await globalRateLimiter.executeWithRetry(
      async () => {
        if (this.provider === 'gemini' && this.geminiClient) {
          const model = this.geminiClient.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: systemInstruction,
            generationConfig: {
              temperature: options.temperature ?? 0.2,
              responseMimeType: 'application/json',
            },
          });

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const jsonStr = this.extractJsonString(text);
          return JSON.parse(jsonStr);
        }

        if (this.provider === 'groq' && config.groqApiKey) {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.groqApiKey}`,
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt },
              ],
              temperature: options.temperature ?? 0.2,
              response_format: { type: 'json_object' },
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            const err = new Error(`Groq API error (${response.status}): ${errorBody}`);
            err.status = response.status;
            throw err;
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '{}';
          const jsonStr = this.extractJsonString(content);
          return JSON.parse(jsonStr);
        }

        throw new Error('NO_VALID_PROVIDER_CONFIGURED');
      },
      operationName,
      { maxRetries: 4, initialDelayMs: 2000 }
    );
  }
}

export const llmClient = new LLMClient();
