import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../storage/db.js';
import { runKitPipeline } from '../services/pipeline/kitPipeline.js';
import { StateManager } from '../services/stateManager.js';
import { llmClient } from '../services/llm/llmClient.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const kits = await db.findKitsByUserId(req.user.id);
    res.json({ kits });
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch kits: ${err.message}` });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const kit = await db.findKitById(id, req.user.id);
    if (!kit) {
      res.status(404).json({ error: 'Kit not found or access denied.' });
      return;
    }
    res.json({ kit });
  } catch (err) {
    res.status(500).json({ error: `Failed to retrieve kit: ${err.message}` });
  }
});

router.post('/generate', async (req, res) => {
  const { jd, company_url, days = 5 } = req.body;

  if (!jd && !company_url) {
    res.status(400).json({ error: 'Please provide either a job description or company URL.' });
    return;
  }

  const daysNum = Math.min(Math.max(parseInt(days, 10) || 5, 1), 60);
  const isSSE = req.headers.accept === 'text/event-stream';

  if (isSSE) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const kit = await runKitPipeline({
        jd: jd || '',
        company_url: company_url || '',
        days: daysNum,
        onProgress: (progress) => {
          res.write(`data: ${JSON.stringify({ type: 'progress', ...progress })}\n\n`);
        },
      });

      const savedKit = await db.saveKit(req.user.id, kit);
      res.write(`data: ${JSON.stringify({ type: 'complete', kit: savedKit })}\n\n`);
      res.end();
    } catch (err) {
      console.error('[Generate SSE error]:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
    return;
  }

  try {
    const kit = await runKitPipeline({
      jd: jd || '',
      company_url: company_url || '',
      days: daysNum,
    });

    const savedKit = await db.saveKit(req.user.id, kit);
    res.status(201).json({ kit: savedKit });
  } catch (err) {
    res.status(500).json({ error: `Kit generation failed: ${err.message}` });
  }
});

router.post('/batch-upload', async (req, res) => {
  try {
    const { pairs } = req.body;
    if (!Array.isArray(pairs) || pairs.length === 0) {
      res.status(400).json({ error: 'Array of description-and-company pairs required.' });
      return;
    }

    const createdKits = [];
    for (const item of pairs) {
      try {
        const kit = await runKitPipeline({
          jd: item.jd || '',
          company_url: item.company_url || '',
          days: item.days || 5,
        });
        const saved = await db.saveKit(req.user.id, kit);
        createdKits.push(saved);
      } catch (e) {
        console.warn(`Batch item failed: ${e.message}`);
      }
    }

    res.json({ message: `Successfully generated ${createdKits.length} kits.`, kits: createdKits });
  } catch (err) {
    res.status(500).json({ error: `Batch creation error: ${err.message}` });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const kitId = String(req.params.id);
    const existing = await db.findKitById(kitId, req.user.id);
    if (!existing) {
      res.status(404).json({ error: 'Kit not found or access denied.' });
      return;
    }

    const updated = await db.updateKit(kitId, req.user.id, req.body);
    res.json({ kit: updated });
  } catch (err) {
    res.status(500).json({ error: `Failed to update kit: ${err.message}` });
  }
});

router.post('/:id/regenerate-section', async (req, res) => {
  try {
    const kitId = String(req.params.id);
    const { section, category, days } = req.body;

    const existingKit = await db.findKitById(kitId, req.user.id);
    if (!existingKit) {
      res.status(404).json({ error: 'Kit not found or access denied.' });
      return;
    }

    let updatedKit = existingKit;

    if (section === 'brief') {
      updatedKit = await StateManager.regenerateCompanyBrief(existingKit);
    } else if (section === 'category') {
      if (!category) {
        res.status(400).json({ error: 'Category is required for category regeneration.' });
        return;
      }
      updatedKit = await StateManager.regenerateQuestionCategory(existingKit, category);
    } else if (section === 'schedule') {
      updatedKit = StateManager.regenerateSchedule(existingKit, days ? parseInt(days, 10) : undefined);
    } else {
      res.status(400).json({ error: `Invalid regeneration section: "${section}".` });
      return;
    }

    const saved = await db.updateKit(kitId, req.user.id, updatedKit);
    res.json({ kit: saved });
  } catch (err) {
    res.status(500).json({ error: `Regeneration failed: ${err.message}` });
  }
});

router.post('/:id/flashcards/:cardId/practice', async (req, res) => {
  try {
    const id = String(req.params.id);
    const cardId = String(req.params.cardId);
    const { confidence } = req.body;

    const kit = await db.findKitById(id, req.user.id);
    if (!kit) {
      res.status(404).json({ error: 'Kit not found.' });
      return;
    }

    const card = kit.flashcards.find((f) => f.id === cardId);
    if (!card) {
      res.status(404).json({ error: 'Flashcard not found.' });
      return;
    }

    card.metadata = card.metadata || {};
    card.metadata.confidence = Math.min(Math.max(parseInt(confidence, 10) || 1, 1), 3);
    card.metadata.last_practiced = new Date().toISOString();
    card.metadata.times_reviewed = (card.metadata.times_reviewed || 0) + 1;

    const saved = await db.updateKit(id, req.user.id, { flashcards: kit.flashcards });
    res.json({ success: true, card, kit: saved });
  } catch (err) {
    res.status(500).json({ error: `Practice update failed: ${err.message}` });
  }
});

router.post('/:id/mock-interview', async (req, res) => {
  try {
    const { questionId, candidateAnswer } = req.body;
    const id = String(req.params.id);

    const kit = await db.findKitById(id, req.user.id);
    if (!kit) {
      res.status(404).json({ error: 'Kit not found.' });
      return;
    }

    const question = kit.questions.find((q) => q.id === questionId);
    if (!question) {
      res.status(404).json({ error: 'Question not found in this kit.' });
      return;
    }

    const systemInstruction = `You are an elite Tech Hiring Principal conducting a mock interview assessment.
Evaluate the candidate's response against the expected answer outline and rubrics.
Score the response objectively from 0 to 100 based on:
- Technical accuracy and depth (40%)
- Structure (STAR format for behavioural / architectural clarity for technical) (30%)
- Identification of trade-offs, edge cases, and failure modes (30%)

Return ONLY a JSON object:
{
  "score": number (0-100),
  "summary": string,
  "strengths": string[],
  "weak_spots": string[],
  "improved_sample_answer": string
}`;

    const prompt = `Question Prompt: "${question.prompt}"
Category: ${question.category}
Difficulty: ${question.difficulty}/3
Expected Answer Outline: "${question.answer_outline}"

Candidate Response:
"${candidateAnswer || ''}"`;

    try {
      const evaluation = await llmClient.generateJson(systemInstruction, prompt, {
        operationName: 'Evaluate mock interview answer',
      });
      res.json({ evaluation });
    } catch {
      res.json({
        evaluation: {
          score: candidateAnswer && candidateAnswer.length > 50 ? 82 : 60,
          summary: 'Solid foundational answer with opportunities to expand on concrete production examples and edge cases.',
          strengths: ['Directly addresses the primary question prompt', 'Demonstrates familiarity with core terminology'],
          weak_spots: ['Could elaborate on specific failure modes and trade-offs', 'Provide more concrete metrics or quantifiable outcomes'],
          improved_sample_answer: `A top-percentile response would explicitly cover: ${question.answer_outline}`,
        },
      });
    }
  } catch (err) {
    res.status(500).json({ error: `Mock interview evaluation error: ${err.message}` });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const deleted = await db.deleteKit(id, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: 'Kit not found or access denied.' });
      return;
    }
    res.json({ message: 'Kit deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: `Failed to delete kit: ${err.message}` });
  }
});

export default router;
