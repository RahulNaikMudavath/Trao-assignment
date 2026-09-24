import { z } from 'zod';

export const RequirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  kind: z.enum(['technical', 'behavioural', 'domain']),
  priority: z.enum(['must', 'nice']),
});

export const QuestionCategorySchema = z.enum([
  'technical',
  'behavioural',
  'system-design',
  'company-fit',
]);

export const QuestionMetadataSchema = z.object({
  origin: z.enum(['generated', 'user_created']).optional(),
  status: z.enum(['unmodified', 'edited', 'pinned']).optional(),
  user_notes: z.string().optional(),
  pinned: z.boolean().optional(),
}).optional();

export const QuestionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string()),
  category: QuestionCategorySchema,
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: z.number().int().min(1).max(3),
  metadata: QuestionMetadataSchema,
});

export const FlashcardMetadataSchema = z.object({
  origin: z.enum(['generated', 'user_created']).optional(),
  status: z.enum(['unmodified', 'edited', 'pinned']).optional(),
  confidence: z.number().int().min(0).max(3).optional(),
  last_practiced: z.string().optional(),
  times_reviewed: z.number().int().optional(),
}).optional();

export const FlashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string()),
  metadata: FlashcardMetadataSchema,
});

export const ScheduleDaySchema = z.object({
  day: z.number().int().min(1),
  focus: z.string().min(1),
  question_ids: z.array(z.string()),
  minutes: z.number().int().min(1),
});

export const ScheduleSchema = z.object({
  days_available: z.number().int().min(1),
  days: z.array(ScheduleDaySchema),
});

export const CoverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int().min(1),
});

export const KitSourceSchema = z.object({
  company: z.string(),
  company_url: z.string(),
  role: z.string(),
  location: z.string(),
  jd_chars: z.number().int().nonnegative(),
  researched_at: z.string(),
  pages_used: z.array(z.string()),
});

export const CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string()),
});

export const RoleBreakdownSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema),
});

// Appendix A Schema Validator
export const AppendixAKitSchema = z.object({
  source: KitSourceSchema,
  company_brief: CompanyBriefSchema,
  role: RoleBreakdownSchema,
  questions: z.array(QuestionSchema),
  flashcards: z.array(FlashcardSchema),
  schedule: ScheduleSchema,
  coverage: CoverageSchema,
}).superRefine((data, ctx) => {
  // 1. Verify that days array length matches days_available
  if (data.schedule.days.length !== data.schedule.days_available) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `schedule.days count (${data.schedule.days.length}) does not match days_available (${data.schedule.days_available})`,
      path: ['schedule', 'days'],
    });
  }

  // 2. Verify all question_ids in schedule refer to questions that exist
  const existingQuestionIds = new Set(data.questions.map((q) => q.id));
  data.schedule.days.forEach((day, idx) => {
    for (const qid of day.question_ids) {
      if (!existingQuestionIds.has(qid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Schedule day ${day.day} references unknown question_id "${qid}"`,
          path: ['schedule', 'days', idx, 'question_ids'],
        });
      }
    }
  });

  // 3. Verify all requirement_ids in questions refer to requirements that exist
  const existingReqIds = new Set(data.role.requirements.map((r) => r.id));
  data.questions.forEach((q, qIdx) => {
    for (const rid of q.requirement_ids) {
      if (!existingReqIds.has(rid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Question "${q.id}" references unknown requirement_id "${rid}"`,
          path: ['questions', qIdx, 'requirement_ids'],
        });
      }
    }
  });

  // 4. Verify all must-have requirements have at least one question generated
  // or are listed in uncovered_requirement_ids
  const mustReqIds = data.role.requirements
    .filter((r) => r.priority === 'must')
    .map((r) => r.id);

  const coveredByQuestions = new Set();
  data.questions.forEach((q) => {
    q.requirement_ids.forEach((rid) => coveredByQuestions.add(rid));
  });

  const uncoveredSet = new Set(data.coverage.uncovered_requirement_ids);
  for (const mustId of mustReqIds) {
    if (!coveredByQuestions.has(mustId) && !uncoveredSet.has(mustId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must-have requirement "${mustId}" is not covered by any question and not recorded in uncovered_requirement_ids`,
        path: ['coverage', 'uncovered_requirement_ids'],
      });
    }
  }

  // 5. Verify all must-have requirements that have questions appear somewhere in the schedule
  const scheduledQuestionIds = new Set();
  data.schedule.days.forEach((day) => {
    day.question_ids.forEach((qid) => scheduledQuestionIds.add(qid));
  });

  const scheduledReqIds = new Set();
  data.questions
    .filter((q) => scheduledQuestionIds.has(q.id))
    .forEach((q) => {
      q.requirement_ids.forEach((rid) => scheduledReqIds.add(rid));
    });

  for (const mustId of mustReqIds) {
    if (coveredByQuestions.has(mustId) && !scheduledReqIds.has(mustId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must-have requirement "${mustId}" has generated questions but none are scheduled in the prep plan`,
        path: ['schedule'],
      });
    }
  }
});

// Appendix B Schema Validator
export const BatchCaseInputSchema = z.object({
  id: z.string().min(1),
  jd: z.string(),
  company_url: z.string(),
  days: z.number().int().min(1),
});

export const BatchCaseResultSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['ok', 'failed']),
  kit: AppendixAKitSchema.nullable(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).nullable(),
});

export const BatchOutputSchema = z.object({
  version: z.literal('1.0'),
  generated_at: z.string(),
  kits: z.array(BatchCaseResultSchema),
});
