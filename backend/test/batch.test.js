import { describe, it, expect } from 'vitest';
import { runBatchEvaluation } from '../src/cli/batchRunner.js';
import { BatchOutputSchema } from '../../shared/schemas.js';
import fs from 'fs';
import path from 'path';

describe('Batch Entry Point (Section 9 & Appendix B)', () => {
  const testInput = path.resolve(process.cwd(), '../test_cases.json');
  const testOutput = path.resolve(process.cwd(), '../batch_test_out.json');

  it('runs batch evaluation over test cases and writes Appendix B output', async () => {
    const result = await runBatchEvaluation(testInput, testOutput);

    expect(result.version).toBe('1.0');
    expect(result.kits.length).toBe(2);

    expect(fs.existsSync(testOutput)).toBe(true);

    const validation = BatchOutputSchema.safeParse(result);
    expect(validation.success).toBe(true);

    expect(result.kits[0].status).toBe('ok');
    expect(result.kits[0].kit?.schedule.days.length).toBe(5);

    if (fs.existsSync(testOutput)) {
      fs.unlinkSync(testOutput);
    }
  });
});
