import { generateQuestionsForCategory } from './4_generateQuestions.js';

export function findUncoveredRequirementIds(requirements, questions, onlyMustHaves = true) {
  const coveredIds = new Set();
  questions.forEach((q) => {
    q.requirement_ids.forEach((rid) => coveredIds.add(rid));
  });

  return requirements
    .filter((r) => (!onlyMustHaves || r.priority === 'must') && !coveredIds.has(r.id))
    .map((r) => r.id);
}

export async function runCoveragePassLoop(requirements, initialQuestions, context, maxPasses = 2) {
  let questions = [...initialQuestions];
  let passes = 1;

  let uncoveredMustIds = findUncoveredRequirementIds(requirements, questions, true);

  while (uncoveredMustIds.length > 0 && passes < maxPasses) {
    passes++;
    const gapRequirements = requirements.filter((r) => uncoveredMustIds.includes(r.id));
    let nextQNum = questions.length + 1;

    for (const gapReq of gapRequirements) {
      const category = gapReq.kind === 'behavioural'
        ? 'behavioural'
        : gapReq.kind === 'domain'
        ? 'company-fit'
        : 'technical';

      const gapQuestions = await generateQuestionsForCategory(
        category,
        [gapReq],
        context,
        nextQNum
      );

      questions.push(...gapQuestions);
      nextQNum += gapQuestions.length;
    }

    uncoveredMustIds = findUncoveredRequirementIds(requirements, questions, true);
  }

  const allUncoveredIds = findUncoveredRequirementIds(requirements, questions, false);

  return {
    questions,
    coverage: {
      uncovered_requirement_ids: allUncoveredIds,
      passes,
    },
  };
}
