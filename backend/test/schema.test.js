import { describe, it, expect } from 'vitest';
import { AppendixAKitSchema } from '../../shared/schemas.js';

describe('Appendix A Structure Validation', () => {
  const validKit = {
    source: {
      company: 'Acme',
      company_url: 'https://acme.test',
      role: 'Senior Backend Engineer',
      location: 'Remote',
      jd_chars: 1200,
      researched_at: new Date().toISOString(),
      pages_used: ['https://acme.test/about'],
    },
    company_brief: {
      summary: 'Acme builds enterprise microservices.',
      what_they_do: 'Cloud computing infrastructure.',
      sources: ['https://acme.test/about'],
    },
    role: {
      title: 'Senior Backend Engineer',
      seniority: 'Senior',
      responsibilities: ['Architect APIs', 'Lead system performance'],
      requirements: [
        { id: 'r1', text: '5+ years Node.js', kind: 'technical', priority: 'must' },
        { id: 'r2', text: 'Kubernetes', kind: 'technical', priority: 'nice' },
      ],
    },
    questions: [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Explain event loop internals and threadpool in Node.js',
        answer_outline: 'Phases: timers, I/O callbacks, idle, poll, check, close callbacks.',
        difficulty: 3,
      },
    ],
    flashcards: [
      {
        id: 'f1',
        front: 'Node.js Event Loop',
        back: 'Single threaded execution orchestrating asynchronous operations via libuv.',
        requirement_ids: ['r1'],
      },
    ],
    schedule: {
      days_available: 1,
      days: [
        {
          day: 1,
          focus: 'Intensive Backend Deep Dive',
          question_ids: ['q1'],
          minutes: 45,
        },
      ],
    },
    coverage: {
      uncovered_requirement_ids: ['r2'],
      passes: 2,
    },
  };

  it('validates a conforming Appendix A kit successfully', () => {
    const parsed = AppendixAKitSchema.safeParse(validKit);
    expect(parsed.success).toBe(true);
  });

  it('rejects a kit when minutes is a float', () => {
    const invalid = JSON.parse(JSON.stringify(validKit));
    invalid.schedule.days[0].minutes = 45.5;
    const parsed = AppendixAKitSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('rejects a kit when schedule references unknown question ID', () => {
    const invalid = JSON.parse(JSON.stringify(validKit));
    invalid.schedule.days[0].question_ids = ['q999'];
    const parsed = AppendixAKitSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('rejects a kit when days length does not match days_available', () => {
    const invalid = JSON.parse(JSON.stringify(validKit));
    invalid.schedule.days_available = 5;
    const parsed = AppendixAKitSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});
