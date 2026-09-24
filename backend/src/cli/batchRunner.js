import fs from 'fs';
import path from 'path';
import { runKitPipeline } from '../services/pipeline/kitPipeline.js';

export async function runBatchEvaluation(inputFilePath, outputFilePath) {
  const resolvedInput = path.resolve(process.cwd(), inputFilePath);
  const resolvedOutput = path.resolve(process.cwd(), outputFilePath);

  if (!fs.existsSync(resolvedInput)) {
    throw new Error(`Input file not found at: ${resolvedInput}`);
  }

  const rawInput = fs.readFileSync(resolvedInput, 'utf-8');
  let cases;
  try {
    cases = JSON.parse(rawInput);
  } catch (err) {
    throw new Error(`Failed to parse input cases JSON: ${err.message}`);
  }

  if (!Array.isArray(cases)) {
    throw new Error('Input file must contain a JSON array of case objects.');
  }

  console.log(`\n======================================================`);
  console.log(`[BatchRunner] Starting batch evaluation for ${cases.length} cases.`);
  console.log(`Input:  ${resolvedInput}`);
  console.log(`Output: ${resolvedOutput}`);
  console.log(`======================================================\n`);

  const results = [];

  for (let i = 0; i < cases.length; i++) {
    const testCase = cases[i];
    const caseId = testCase.id || `case-${i + 1}`;
    console.log(`[${i + 1}/${cases.length}] Processing case "${caseId}" (${testCase.company_url || 'no-url'}, ${testCase.days || 5} days)...`);

    try {
      if (!testCase.jd && !testCase.company_url) {
        throw new Error('Case must provide either a job description or company URL.');
      }

      const kit = await runKitPipeline({
        jd: testCase.jd || '',
        company_url: testCase.company_url || '',
        days: testCase.days || 5,
        onProgress: (p) => {
          console.log(`  -> Step ${p.step}/${p.total_steps}: ${p.step_name} (${p.message})`);
        },
      });

      results.push({
        id: caseId,
        status: 'ok',
        kit,
        error: null,
      });

      console.log(`  ✓ Case "${caseId}" completed successfully.\n`);
    } catch (err) {
      console.error(`  ✗ Case "${caseId}" failed:`, err.message);

      results.push({
        id: caseId,
        status: 'failed',
        kit: null,
        error: {
          code: err.code || 'PIPELINE_ERROR',
          message: err.message || 'An error occurred while generating the interview kit.',
        },
      });
    }
  }

  const output = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    kits: results,
  };

  const outDir = path.dirname(resolvedOutput);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(resolvedOutput, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`[BatchRunner] Evaluation complete! Wrote results to: ${resolvedOutput}\n`);

  return output;
}
