#!/usr/bin/env node
import { runBatchEvaluation } from './backend/src/cli/batchRunner.js';

function parseArgs() {
  const args = process.argv.slice(2);
  let inputPath = '';
  let outputPath = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && i + 1 < args.length) {
      inputPath = args[i + 1];
      i++;
    } else if (args[i] === '--output' && i + 1 < args.length) {
      outputPath = args[i + 1];
      i++;
    }
  }

  return { inputPath, outputPath };
}

async function main() {
  const { inputPath, outputPath } = parseArgs();

  if (!inputPath || !outputPath) {
    console.error('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
    process.exit(1);
  }

  try {
    await runBatchEvaluation(inputPath, outputPath);
    process.exit(0);
  } catch (err) {
    console.error('Evaluation run terminated with error:', err.message);
    process.exit(1);
  }
}

main();
