import { describe, it, expect } from 'vitest';
import { StateManager } from '../src/services/stateManager.js';

describe('The Builder State Management & Regeneration (Section 6)', () => {
  const baseKit = {
    source: {
      company: 'PostHog',
      company_url: 'https://posthog.com',
      role: 'Full Stack Engineer',
      location: 'Remote',
      jd_chars: 800,
      researched_at: new Date().toISOString(),
      pages_used: ['https://posthog.com/careers'],
    },
    company_brief: {
      summary: 'Product analytics platform.',
      what_they_do: 'Analytics and feature flags.',
      sources: ['https://posthog.com'],
    },
    role: {
      title: 'Full Stack Engineer',
      seniority: 'Senior',
      responsibilities: ['Build analytics pipelines'],
      requirements: [
        { id: 'r1', text: 'React', kind: 'technical', priority: 'must' },
        { id: 'r2', text: 'Python', kind: 'technical', priority: 'must' },
      ],
    },
    questions: [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Original prompt for React',
        answer_outline: 'Original outline',
        difficulty: 2,
        metadata: { origin: 'generated', status: 'unmodified' },
      },
      {
        id: 'q2',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'User hand-edited this question',
        answer_outline: 'User customized outline',
        difficulty: 3,
        metadata: { origin: 'generated', status: 'edited' },
      },
      {
        id: 'q3',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'User pinned this question',
        answer_outline: 'Pinned outline',
        difficulty: 2,
        metadata: { origin: 'generated', status: 'pinned', pinned: true },
      },
      {
        id: 'q4',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'User added this question manually',
        answer_outline: 'Manual outline',
        difficulty: 1,
        metadata: { origin: 'user_created', status: 'unmodified' },
      },
      {
        id: 'q5',
        requirement_ids: ['r2'],
        category: 'behavioural',
        prompt: 'Behavioural question in another category',
        answer_outline: 'Behavioural outline',
        difficulty: 1,
        metadata: { origin: 'generated', status: 'unmodified' },
      },
    ],
    flashcards: [],
    schedule: {
      days_available: 3,
      days: [
        { day: 1, focus: 'Day 1', question_ids: ['q1', 'q2'], minutes: 60 },
        { day: 2, focus: 'Day 2', question_ids: ['q3', 'q4'], minutes: 60 },
        { day: 3, focus: 'Day 3', question_ids: ['q5'], minutes: 60 },
      ],
    },
    coverage: { uncovered_requirement_ids: [], passes: 1 },
  };

  it('preserves edited, pinned, and user-created questions when regenerating category', async () => {
    const updatedKit = await StateManager.regenerateQuestionCategory(baseKit, 'technical');

    const prompts = updatedKit.questions.map((q) => q.prompt);

    expect(prompts).toContain('User hand-edited this question');
    expect(prompts).toContain('User pinned this question');
    expect(prompts).toContain('User added this question manually');
    expect(prompts).toContain('Behavioural question in another category');
    expect(prompts).not.toContain('Original prompt for React');
  });

  it('preserves schedule validity after category regeneration', async () => {
    const updatedKit = await StateManager.regenerateQuestionCategory(baseKit, 'technical');
    expect(updatedKit.schedule.days.length).toBe(baseKit.schedule.days_available);
  });
});
