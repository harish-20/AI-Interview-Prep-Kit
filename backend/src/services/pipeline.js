const { extractRequirements } = require('./extraction');
const { discoverCompanyPages, fetchAndClean } = require('./crawler');
const { searchInterviewDiscussion } = require('./research');
const { generateCompanyBrief, generateQuestions, generateFlashcards } = require('./generation');
const { checkCoverage } = require('./coverage');
const { buildSchedule } = require('./scheduler');
const { validateKitStructure } = require('./validation');

const MAX_COVERAGE_PASSES = 3;

/**
 * Single pipeline orchestrator function called by HTTP API and CLI batch runner.
 * Completely side-effect free regarding DB persistence (returns kit payload).
 * Never throws past this function boundary — returns { status: "ok" | "failed", kit, error }.
 *
 * @param {object} params
 * @param {string} params.jd - Job Description text.
 * @param {string} params.company_url - Company website URL.
 * @param {number} [params.days=7] - Days available until interview.
 * @param {boolean} [params.allowLocalhost=false] - Whether localhost URLs are allowed (for CLI/local tests).
 * @returns {Promise<{ status: 'ok' | 'failed', kit: object | null, error: { code: string, message: string } | null }>}
 */
async function runPipeline({ jd, company_url, days = 7, allowLocalhost = false }) {
  try {
    if (!jd || typeof jd !== 'string' || jd.trim().length === 0) {
      return {
        status: 'failed',
        kit: null,
        error: { code: 'INVALID_INPUT', message: 'Job description (jd) is required.' },
      };
    }

    // 1. Requirement Extraction
    const roleDetails = await extractRequirements(jd);
    const requirements = roleDetails.requirements || [];

    // 2. Company Crawl (skip + record per-page failure, don't abort run)
    let companyName = 'Company';
    let scrapedPages = [];
    const pagesUsed = [];

    if (company_url) {
      try {
        const discovered = await discoverCompanyPages(company_url, { allowLocalhost });
        for (const pageUrl of discovered) {
          const res = await fetchAndClean(pageUrl, { allowLocalhost });
          if (res.status === 'ok') {
            scrapedPages.push(res);
            pagesUsed.push(pageUrl);
          } else {
            console.warn(`[Pipeline] Crawl skipped/failed for ${pageUrl}: ${res.error}`);
          }
        }

        // Infer company name from URL hostname if available
        try {
          const parsed = new URL(company_url);
          companyName = parsed.hostname.replace('www.', '').split('.')[0];
          companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
        } catch {
          companyName = 'Target Company';
        }
      } catch (err) {
        console.warn(`[Pipeline] Crawler encountered error: ${err.message}`);
      }
    }

    // 3. Interview Discussion Research (skip + record if missing)
    let researchSnippets = [];
    try {
      const researchRes = await searchInterviewDiscussion(companyName);
      if (researchRes.found) {
        researchSnippets = researchRes.snippets || [];
      }
    } catch (err) {
      console.warn(`[Pipeline] Research search failed: ${err.message}`);
    }

    // 4. Company Brief Generation
    const company_brief = await generateCompanyBrief(companyName, scrapedPages, researchSnippets);

    // 5. Initial Question Generation (per requirement x category)
    const categories = ['technical', 'behavioural', 'system-design', 'company-fit'];
    let questions = [];

    for (const req of requirements) {
      // Pick suitable categories based on requirement kind
      let targetCategories = ['technical'];
      if (req.kind === 'behavioural') {
        targetCategories = ['behavioural', 'company-fit'];
      } else if (req.kind === 'domain') {
        targetCategories = ['technical', 'system-design'];
      }

      for (const cat of targetCategories) {
        const generated = await generateQuestions(req, cat);
        questions.push(...generated);
      }
    }

    // Fallback if no questions generated
    if (questions.length === 0 && requirements.length > 0) {
      const fallbackQs = await generateQuestions(requirements[0], 'technical');
      questions.push(...fallbackQs);
    }

    // 6. Coverage Check & Gap Filling Loop (Pure JS checkCoverage)
    let passes = 0;
    let coverageResult = checkCoverage(requirements, questions, passes);

    while (coverageResult.uncovered_requirement_ids.length > 0 && passes < MAX_COVERAGE_PASSES) {
      passes += 1;
      const missingReqs = requirements.filter((r) =>
        coverageResult.uncovered_requirement_ids.includes(r.id)
      );

      for (const req of missingReqs) {
        const extraQs = await generateQuestions(req, 'technical');
        questions.push(...extraQs);
      }

      coverageResult = checkCoverage(requirements, questions, passes);
    }

    // 7. Flashcards Generation
    const flashcards = await generateFlashcards(requirements);

    // 8. Schedule Building (Pure JS buildSchedule)
    const daysCount = Math.max(1, parseInt(days, 10) || 7);
    const schedule = buildSchedule(questions, requirements, daysCount);

    // Assemble unpersisted Kit structure
    const kit = {
      status: 'ready',
      source: {
        company: companyName,
        company_url: company_url || '',
        role: roleDetails.title || 'Target Role',
        location: 'Remote / Unspecified',
        jd_chars: jd.length,
        researched_at: new Date().toISOString(),
        pages_used: pagesUsed,
      },
      company_brief,
      role: {
        title: roleDetails.title || 'Software Engineer',
        seniority: roleDetails.seniority || 'Mid-Senior',
        responsibilities: roleDetails.responsibilities || [],
        requirements: roleDetails.requirements || [],
      },
      questions,
      flashcards,
      schedule,
      coverage: {
        uncovered_requirement_ids: coverageResult.uncovered_requirement_ids,
        passes: coverageResult.passes,
      },
    };

    // 9. Schema Structure Validation (Pure JS validateKitStructure)
    const validation = validateKitStructure(kit);
    if (!validation.valid) {
      return {
        status: 'failed',
        kit: null,
        error: {
          code: 'SCHEMA_VALIDATION_ERROR',
          message: `Kit payload failed validation: ${validation.errors.join('; ')}`,
        },
      };
    }

    return {
      status: 'ok',
      kit,
      error: null,
    };
  } catch (err) {
    return {
      status: 'failed',
      kit: null,
      error: {
        code: 'PIPELINE_ERROR',
        message: err.message || 'An error occurred during pipeline execution.',
      },
    };
  }
}

module.exports = {
  runPipeline,
};
