import { describe, it, expect } from 'vitest';
import { allocateSchedule } from '../src/services/pipeline/7_allocateSchedule.js';

describe('Schedule Allocation Algorithm (Section 8)', () => {
  const sampleRequirements = [
    { id: 'r1', text: 'React & Frontend Architecture', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Distributed Systems & Node.js', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Mentorship & Leadership', kind: 'behavioural', priority: 'must' },
    { id: 'r4', text: 'Cloud & Docker', kind: 'technical', priority: 'nice' },
  ];

  const sampleQuestions = [
    {
      id: 'q1',
      requirement_ids: ['r1'],
      category: 'technical',
      prompt: 'Deep dive into React Concurrent Mode',
      answer_outline: 'Explain fibers, lane priority, useTransition.',
      difficulty: 3,
    },
    {
      id: 'q2',
      requirement_ids: ['r2'],
      category: 'system-design',
      prompt: 'Design a distributed rate limiter',
      answer_outline: 'Token bucket, Redis cluster, sliding window.',
      difficulty: 3,
    },
    {
      id: 'q3',
      requirement_ids: ['r3'],
      category: 'behavioural',
      prompt: 'Handling disagreement with a senior engineer',
      answer_outline: 'STAR format: empathy, data, alignment.',
      difficulty: 2,
    },
    {
      id: 'q4',
      requirement_ids: ['r4'],
      category: 'technical',
      prompt: 'Docker multi-stage builds',
      answer_outline: 'Cache layers, minimal base images.',
      difficulty: 1,
    },
  ];

  it('allocates exactly the requested number of days for 5 days', () => {
    const schedule = allocateSchedule(sampleQuestions, sampleRequirements, 5);
    expect(schedule.days_available).toBe(5);
    expect(schedule.days.length).toBe(5);
  });

  it('allocates a 1-day schedule correctly and packs must-haves', () => {
    const schedule = allocateSchedule(sampleQuestions, sampleRequirements, 1);
    expect(schedule.days_available).toBe(1);
    expect(schedule.days.length).toBe(1);
    expect(Number.isInteger(schedule.days[0].minutes)).toBe(true);
    expect(schedule.days[0].question_ids.length).toBeGreaterThanOrEqual(1);
  });

  it('allocates a 60-day schedule without gaps or invalid question IDs', () => {
    const schedule = allocateSchedule(sampleQuestions, sampleRequirements, 60);
    expect(schedule.days_available).toBe(60);
    expect(schedule.days.length).toBe(60);

    const validQIds = new Set(sampleQuestions.map((q) => q.id));
    schedule.days.forEach((day) => {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThan(0);
      day.question_ids.forEach((qid) => {
        expect(validQIds.has(qid)).toBe(true);
      });
    });
  });

  it('ensures harder and higher-priority material lands earlier', () => {
    const schedule = allocateSchedule(sampleQuestions, sampleRequirements, 4);
    const day1QIds = schedule.days[0].question_ids;
    const day1Questions = sampleQuestions.filter((q) => day1QIds.includes(q.id));
    const hasHighDifficulty = day1Questions.some((q) => q.difficulty === 3);
    expect(hasHighDifficulty).toBe(true);
  });

  it('ensures all must-have requirements appear somewhere in the schedule', () => {
    const schedule = allocateSchedule(sampleQuestions, sampleRequirements, 3);
    const scheduledQIds = new Set();
    schedule.days.forEach((d) => d.question_ids.forEach((qid) => scheduledQIds.add(qid)));

    const scheduledReqIds = new Set();
    sampleQuestions
      .filter((q) => scheduledQIds.has(q.id))
      .forEach((q) => q.requirement_ids.forEach((rid) => scheduledReqIds.add(rid)));

    const mustReqs = sampleRequirements.filter((r) => r.priority === 'must');
    for (const mustReq of mustReqs) {
      expect(scheduledReqIds.has(mustReq.id)).toBe(true);
    }
  });

  it('all durations are integer minutes (no floats, no undefined)', () => {
    const schedule = allocateSchedule(sampleQuestions, sampleRequirements, 7);
    schedule.days.forEach((d) => {
      expect(Number.isInteger(d.minutes)).toBe(true);
      expect(d.minutes).toBeGreaterThan(0);
    });
  });
});
