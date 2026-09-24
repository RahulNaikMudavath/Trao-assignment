import { llmClient } from '../llm/llmClient.js';
import { mockGenerateFlashcards } from '../llm/mockProvider.js';

export async function generateFlashcards(requirements) {
  if (requirements.length === 0) return [];

  const systemInstruction = `You are a technical study coach creating high-yield active recall flashcards.
Rules:
1. Create concise, high-impact flashcards covering key definitions, tricky edge cases, and architectural principles for the provided requirements.
2. "id": formatted as "f1", "f2", "f3"...
3. "front": clear prompt or question.
4. "back": concise, memorable answer or explanation.
5. "requirement_ids": array of matching requirement IDs from the input.
6. Return ONLY a JSON object:
{
  "flashcards": [
    { "id": "f1", "front": string, "back": string, "requirement_ids": ["r1"] }
  ]
}`;

  const prompt = `Create flashcards for these requirements:
${JSON.stringify(requirements, null, 2)}`;

  try {
    const res = await llmClient.generateJson(
      systemInstruction,
      prompt,
      { operationName: 'Generate flashcards' }
    );

    if (res.flashcards && Array.isArray(res.flashcards)) {
      return res.flashcards.map((f, idx) => ({
        id: `f${idx + 1}`,
        front: String(f.front || '').trim(),
        back: String(f.back || '').trim(),
        requirement_ids: Array.isArray(f.requirement_ids) && f.requirement_ids.length > 0
          ? f.requirement_ids.filter((id) => requirements.some((r) => r.id === id))
          : [requirements[0].id],
        metadata: {
          origin: 'generated',
          status: 'unmodified',
          confidence: 0,
        },
      }));
    }

    return mockGenerateFlashcards(requirements);
  } catch (err) {
    return mockGenerateFlashcards(requirements);
  }
}
