#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const env = require('../config/env');
const { runPipeline } = require('../services/pipeline');

/**
 * Helper function to strip internal `edited` and `pinned` flags
 * from questions and flashcards before returning payload to CLI/API consumers.
 *
 * @param {object} kit - Raw kit object returned by pipeline.
 * @returns {object} Cleaned kit matching Appendix A structure.
 */
function sanitizeKitForAppendix(kit) {
  if (!kit || typeof kit !== 'object') return null;

  const sanitized = JSON.parse(JSON.stringify(kit));

  if (Array.isArray(sanitized.questions)) {
    sanitized.questions = sanitized.questions.map((q) => {
      delete q.edited;
      delete q.pinned;
      return q;
    });
  }

  if (Array.isArray(sanitized.flashcards)) {
    sanitized.flashcards = sanitized.flashcards.map((fc) => {
      delete fc.edited;
      delete fc.pinned;
      return fc;
    });
  }

  return sanitized;
}

async function main() {
  const args = minimist(process.argv.slice(2));
  const inputFile = args.input || args.i;
  const outputFile = args.output || args.o;

  if (!inputFile || !outputFile) {
    console.error('Error: Missing required arguments --input or --output.');
    console.error('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), inputFile);
  const outputPath = path.resolve(process.cwd(), outputFile);

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found at ${inputPath}`);
    process.exit(1);
  }

  let testCases;
  try {
    const rawData = fs.readFileSync(inputPath, 'utf8');
    testCases = JSON.parse(rawData);
    if (!Array.isArray(testCases)) {
      throw new Error('Input file must contain a JSON array of test cases.');
    }
  } catch (err) {
    console.error(`Error parsing input JSON file: ${err.message}`);
    process.exit(1);
  }

  console.log(`[CLI Evaluator] Processing ${testCases.length} test case(s)...`);
  console.log(`[CLI Evaluator] Using LLM Provider: ${env.LLM_PROVIDER}`);

  const results = [];

  for (let index = 0; index < testCases.length; index++) {
    const testCase = testCases[index];
    const caseId = testCase.id || `case_${index + 1}`;
    console.log(`[CLI Evaluator] Running case [${index + 1}/${testCases.length}]: ID '${caseId}'...`);

    try {
      const pipelineResult = await runPipeline({
        jd: testCase.jd,
        company_url: testCase.company_url,
        days: testCase.days,
        allowLocalhost: true, // Allow local mock server URLs in evaluation mode
      });

      if (pipelineResult.status === 'ok' && pipelineResult.kit) {
        const cleanKit = sanitizeKitForAppendix(pipelineResult.kit);
        results.push({
          id: caseId,
          status: 'ready',
          kit: cleanKit,
          error: null,
        });
        console.log(`  -> Status: SUCCESS`);
      } else {
        results.push({
          id: caseId,
          status: 'failed',
          kit: null,
          error: pipelineResult.error || {
            code: 'PIPELINE_FAILED',
            message: 'Pipeline returned non-ok status.',
          },
        });
        console.warn(`  -> Status: FAILED (${pipelineResult.error?.message || 'Unknown error'})`);
      }
    } catch (err) {
      // Continue execution after case failure
      results.push({
        id: caseId,
        status: 'failed',
        kit: null,
        error: {
          code: 'UNHANDLED_CASE_ERROR',
          message: err.message,
        },
      });
      console.error(`  -> Status: UNHANDLED ERROR (${err.message})`);
    }
  }

  const outputPayload = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    kits: results,
  };

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(outputPayload, null, 2), 'utf8');
    console.log(`[CLI Evaluator] Evaluation complete. Results written to: ${outputPath}`);
  } catch (err) {
    console.error(`Error writing output file: ${err.message}`);
    process.exit(1);
  }
}

main();
