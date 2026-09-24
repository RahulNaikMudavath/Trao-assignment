import { AppendixAKitSchema } from '../../../../shared/schemas.js';
import { extractRequirementsFromJD } from './1_extractRequirements.js';
import { researchCompany } from './2_researchCompany.js';
import { searchPublicDiscussions } from './3_searchDiscussions.js';
import { generateQuestionsForCategory } from './4_generateQuestions.js';
import { generateFlashcards } from './5_generateFlashcards.js';
import { runCoveragePassLoop } from './6_coverageCheck.js';
import { allocateSchedule } from './7_allocateSchedule.js';

export async function runKitPipeline(options) {
  const { jd, company_url, days, onProgress } = options;

  const emitProgress = (step, step_name, message, status = 'in_progress', data) => {
    if (onProgress) {
      onProgress({
        step,
        total_steps: 7,
        step_name,
        message,
        status,
        data,
      });
    }
  };

  // Step 1: Extract Requirements from JD
  emitProgress(1, 'Extracting Requirements', 'Analyzing job description and extracting role requirements...');
  const roleBreakdown = await extractRequirementsFromJD(jd, company_url);
  emitProgress(1, 'Extracting Requirements', `Extracted ${roleBreakdown.requirements.length} requirements.`, 'completed', roleBreakdown);

  // Step 2: Research Company Website (Crawl & Dynamic Link Ranking)
  emitProgress(2, 'Company Research', `Crawling ${company_url} and discovering hiring pages...`);
  const researchOutput = await researchCompany(company_url);
  emitProgress(2, 'Company Research', `Research completed using ${researchOutput.pagesUsed.length} pages.`, 'completed', researchOutput.companyBrief);

  // Step 3: Public Interview Discussion Research
  let companyName = 'Target Company';
  try {
    const urlObj = new URL(company_url);
    const domain = urlObj.hostname.replace('www.', '').split('.')[0];
    companyName = domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {}

  emitProgress(3, 'Interview Discussions', `Searching public discussions for ${companyName} interview processes...`);
  const discussionResult = await searchPublicDiscussions(companyName, company_url);
  emitProgress(3, 'Interview Discussions', discussionResult.found ? 'Public interview insights retrieved.' : 'No public discussions found (recorded honestly).', 'completed');

  // Step 4: Category-Specific Question Generation
  emitProgress(4, 'Question Bank Generation', 'Generating category-tailored interview questions...');
  const genContext = {
    companyName,
    companyBrief: `${researchOutput.companyBrief.summary}\n${researchOutput.companyBrief.what_they_do}`,
    interviewStages: discussionResult.interviewStages,
  };

  const technicalReqs = roleBreakdown.requirements.filter((r) => r.kind === 'technical');
  const behaviouralReqs = roleBreakdown.requirements.filter((r) => r.kind === 'behavioural');
  const domainReqs = roleBreakdown.requirements.filter((r) => r.kind === 'domain');

  let currentQCount = 1;
  const questions = [];

  // Generate Technical Questions
  if (technicalReqs.length > 0) {
    const techQuestions = await generateQuestionsForCategory('technical', technicalReqs, genContext, currentQCount);
    questions.push(...techQuestions);
    currentQCount += techQuestions.length;
  }

  // Generate Behavioural Questions
  if (behaviouralReqs.length > 0) {
    const behQuestions = await generateQuestionsForCategory('behavioural', behaviouralReqs, genContext, currentQCount);
    questions.push(...behQuestions);
    currentQCount += behQuestions.length;
  } else {
    const behFallback = await generateQuestionsForCategory('behavioural', roleBreakdown.requirements.slice(0, 2), genContext, currentQCount);
    questions.push(...behFallback);
    currentQCount += behFallback.length;
  }

  // Generate System Design Questions
  const sysDesignReqs = technicalReqs.length > 0 ? technicalReqs : roleBreakdown.requirements;
  const sysQuestions = await generateQuestionsForCategory('system-design', sysDesignReqs.slice(0, 2), genContext, currentQCount);
  questions.push(...sysQuestions);
  currentQCount += sysQuestions.length;

  // Generate Company Fit Questions
  const fitQuestions = await generateQuestionsForCategory('company-fit', (domainReqs.length > 0 ? domainReqs : roleBreakdown.requirements).slice(0, 2), genContext, currentQCount);
  questions.push(...fitQuestions);
  currentQCount += fitQuestions.length;

  emitProgress(4, 'Question Bank Generation', `Generated ${questions.length} initial interview questions across 4 categories.`, 'completed');

  // Step 5: Generate Flashcards
  emitProgress(5, 'Flashcard Generation', 'Creating active recall flashcards mapped to requirements...');
  const flashcards = await generateFlashcards(roleBreakdown.requirements);
  emitProgress(5, 'Flashcard Generation', `Created ${flashcards.length} flashcards.`, 'completed');

  // Step 6: Deterministic Second Pass Coverage Check Loop
  emitProgress(6, 'Coverage Verification', 'Running deterministic coverage check to identify and resolve gaps...');
  const coverageResult = await runCoveragePassLoop(roleBreakdown.requirements, questions, genContext, 2);
  emitProgress(
    6,
    'Coverage Verification',
    `Coverage verified across ${coverageResult.coverage.passes} passes. Uncovered must-haves: ${coverageResult.coverage.uncovered_requirement_ids.length}`,
    'completed'
  );

  // Step 7: Deterministic Arithmetic Schedule Allocation
  emitProgress(7, 'Schedule Allocation', `Calculating preparation schedule across exactly ${days} days...`);
  const schedule = allocateSchedule(coverageResult.questions, roleBreakdown.requirements, days);
  emitProgress(7, 'Schedule Allocation', `Schedule allocated across ${schedule.days.length} days.`, 'completed');

  // Assemble Appendix A Kit
  const assembledKit = {
    source: {
      company: companyName,
      company_url: company_url,
      role: roleBreakdown.title,
      location: 'Remote / Unspecified',
      jd_chars: jd.length,
      researched_at: new Date().toISOString(),
      pages_used: researchOutput.pagesUsed,
    },
    company_brief: researchOutput.companyBrief,
    role: roleBreakdown,
    questions: coverageResult.questions,
    flashcards: flashcards,
    schedule: schedule,
    coverage: coverageResult.coverage,
  };

  const validation = AppendixAKitSchema.safeParse(assembledKit);
  if (!validation.success) {
    console.error('[KitPipeline] Validation warnings in assembled kit:', validation.error.format());
  }

  return assembledKit;
}
