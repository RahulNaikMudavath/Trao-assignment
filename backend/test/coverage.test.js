import { describe, it, expect } from 'vitest';
import { findUncoveredRequirementIds, runCoveragePassLoop } from '../src/services/pipeline/6_coverageCheck.js';

describe('Coverage Check & Second Pass (Section 4)', () => {
  const reqs = [
    { id: 'r1', text: 'React', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Node.js', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Docker', kind: 'technical', priority: 'nice' },
  ];

  it('correctly identifies uncovered must-have requirement IDs deterministically', () => {
    const questions = [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'React hooks',
        answer_outline: 'Explain useEffect and useMemo',
        difficulty: 2,
      },
    ];

    const uncoveredMust = findUncoveredRequirementIds(reqs, questions, true);
    expect(uncoveredMust).toEqual(['r2']);

    const allUncovered = findUncoveredRequirementIds(reqs, questions, false);
    expect(allUncovered).toEqual(['r2', 'r3']);
  });

  it('runs second pass to generate missing questions for uncovered must-haves', async () => {
    const initialQuestions = [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'React hooks',
        answer_outline: 'Explain useEffect and useMemo',
        difficulty: 2,
      },
    ];

    const context = {
      companyName: 'Acme Corp',
      companyBrief: 'Acme builds enterprise cloud solutions.',
      interviewStages: ['Tech Screen', 'System Design'],
    };

    const result = await runCoveragePassLoop(reqs, initialQuestions, context, 2);

    expect(result.coverage.passes).toBe(2);
    const coveredIds = new Set();
    result.questions.forEach((q) => q.requirement_ids.forEach((rid) => coveredIds.add(rid)));
    expect(coveredIds.has('r2')).toBe(true);
    expect(result.questions.length).toBeGreaterThan(initialQuestions.length);
  });
});
