import { generateQuestionsForCategory } from './pipeline/4_generateQuestions.js';
import { researchCompany } from './pipeline/2_researchCompany.js';
import { allocateSchedule } from './pipeline/7_allocateSchedule.js';

export class StateManager {
  static async regenerateQuestionCategory(kit, categoryToRegenerate) {
    const existingQuestions = kit.questions;

    const protectedQuestions = [];
    const otherCategoryQuestions = [];

    for (const q of existingQuestions) {
      if (q.category !== categoryToRegenerate) {
        otherCategoryQuestions.push(q);
        continue;
      }

      const isUserCreated = q.metadata?.origin === 'user_created';
      const isEdited = q.metadata?.status === 'edited';
      const isPinned = q.metadata?.status === 'pinned' || q.metadata?.pinned === true;

      if (isUserCreated || isEdited || isPinned) {
        protectedQuestions.push(q);
      }
    }

    const relevantReqs = kit.role.requirements.filter((r) => {
      if (categoryToRegenerate === 'technical') return r.kind === 'technical';
      if (categoryToRegenerate === 'behavioural') return r.kind === 'behavioural';
      return true;
    });

    const context = {
      companyName: kit.source.company,
      companyBrief: `${kit.company_brief.summary}\n${kit.company_brief.what_they_do}`,
      interviewStages: ['Recruiter Screen', 'Technical Round', 'System Architecture', 'Values Fit'],
    };

    const maxExistingIdNum = existingQuestions.reduce((max, q) => {
      const match = q.id.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 0;
      return Math.max(max, num);
    }, 0);

    const freshlyGenerated = await generateQuestionsForCategory(
      categoryToRegenerate,
      relevantReqs.length > 0 ? relevantReqs : kit.role.requirements,
      context,
      maxExistingIdNum + 1
    );

    const updatedQuestions = [
      ...otherCategoryQuestions,
      ...protectedQuestions,
      ...freshlyGenerated,
    ];

    const updatedSchedule = allocateSchedule(
      updatedQuestions,
      kit.role.requirements,
      kit.schedule.days_available
    );

    return {
      ...kit,
      questions: updatedQuestions,
      schedule: updatedSchedule,
    };
  }

  static async regenerateCompanyBrief(kit) {
    const researchOutput = await researchCompany(kit.source.company_url);

    return {
      ...kit,
      company_brief: researchOutput.companyBrief,
      source: {
        ...kit.source,
        researched_at: new Date().toISOString(),
        pages_used: [...new Set([...kit.source.pages_used, ...researchOutput.pagesUsed])],
      },
    };
  }

  static regenerateSchedule(kit, newDays) {
    const daysToUse = newDays ?? kit.schedule.days_available;
    const newSchedule = allocateSchedule(kit.questions, kit.role.requirements, daysToUse);

    return {
      ...kit,
      schedule: newSchedule,
    };
  }
}
