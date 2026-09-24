import { llmClient } from '../llm/llmClient.js';
import { mockGenerateQuestionsForRequirements } from '../llm/mockProvider.js';

export async function generateQuestionsForCategory(category, requirements, context, startingIdNumber = 1) {
  if (requirements.length === 0) {
    return [];
  }

  let categoryInstructions = '';
  switch (category) {
    case 'technical':
      categoryInstructions = `Generate rigorous technical interview questions.
Focus on: implementation mechanics, language runtime behaviour, memory/CPU performance, error boundaries, race conditions, and production debugging.
Do NOT ask generic trivia; ask real engineering scenario questions testing deep hands-on expertise.`;
      break;

    case 'behavioural':
      categoryInstructions = `Generate in-depth behavioural interview questions.
Focus on: STAR method (Situation, Task, Action, Result), team conflict resolution, prioritizing tech debt vs business delivery, mentorship, and navigating technical disagreements.`;
      break;

    case 'system-design':
      categoryInstructions = `Generate high-level architectural and system design questions.
Focus on: scalability, throughput vs latency, database selection (SQL vs NoSQL), caching strategies, data partitioning, and graceful degradation during network partitions.`;
      break;

    case 'company-fit':
      categoryInstructions = `Generate company-fit and values alignment questions.
Focus on: how the candidate works within ${context.companyName}'s engineering culture, mission, and user problem space. Incorporate the company context provided.`;
      break;
  }

  const systemInstruction = `You are a Principal Engineering Interviewer.
${categoryInstructions}

Rules:
1. Every question MUST reference at least one requirement ID from the provided list in "requirement_ids".
2. "id": formatted as "q<number>", starting from q${startingIdNumber}.
3. "category": strictly "${category}".
4. "difficulty": integer from 1 (fundamental/entry) to 3 (complex/senior).
5. "prompt": The actual question asked by an interviewer.
6. "answer_outline": Bulleted technical points covering what an exceptional candidate should mention.
7. Return ONLY a JSON object matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "requirement_ids": ["r1"],
      "category": "${category}",
      "prompt": string,
      "answer_outline": string,
      "difficulty": 1 | 2 | 3
    }
  ]
}`;

  const prompt = `Requirements to cover:
${JSON.stringify(requirements, null, 2)}

Company context:
${context.companyBrief}

Interview Stages known:
${context.interviewStages.join(', ')}`;

  try {
    const res = await llmClient.generateJson(systemInstruction, prompt, {
      operationName: `Generate ${category} questions`,
    });

    if (res.questions && Array.isArray(res.questions)) {
      let qNum = startingIdNumber;
      return res.questions.map((q) => {
        const difficulty = Math.min(Math.max(Math.round(Number(q.difficulty) || 2), 1), 3);
        const reqIds = Array.isArray(q.requirement_ids) && q.requirement_ids.length > 0
          ? q.requirement_ids.filter((id) => requirements.some((r) => r.id === id))
          : [requirements[0].id];

        return {
          id: `q${qNum++}`,
          requirement_ids: reqIds.length > 0 ? reqIds : [requirements[0].id],
          category: category,
          prompt: String(q.prompt || '').trim(),
          answer_outline: String(q.answer_outline || '').trim(),
          difficulty,
          metadata: {
            origin: 'generated',
            status: 'unmodified',
          },
        };
      });
    }

    return mockGenerateQuestionsForRequirements(requirements, category, startingIdNumber);
  } catch (err) {
    return mockGenerateQuestionsForRequirements(requirements, category, startingIdNumber);
  }
}
